<?php
/**
 * Omni POS Register Shifts & Cash Drawer Handler
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Omni_POS_Shifts {

	/**
	 * Create database tables if they do not exist
	 */
	/**
	 * Create database tables if they do not exist
	 */
	public static function init_db() {
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();
		$shifts_table    = $wpdb->prefix . 'omni_pos_shifts';
		$logs_table      = $wpdb->prefix . 'omni_pos_cash_logs';

		$sql_shifts = "CREATE TABLE IF NOT EXISTS $shifts_table (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			cashier_id bigint(20) unsigned NOT NULL,
			cashier_name varchar(191) NOT NULL DEFAULT '',
			opened_at datetime NOT NULL,
			closed_at datetime DEFAULT NULL,
			opening_float decimal(12,2) NOT NULL DEFAULT 0.00,
			cash_sales decimal(12,2) NOT NULL DEFAULT 0.00,
			card_sales decimal(12,2) NOT NULL DEFAULT 0.00,
			other_sales decimal(12,2) NOT NULL DEFAULT 0.00,
			cash_in decimal(12,2) NOT NULL DEFAULT 0.00,
			cash_out decimal(12,2) NOT NULL DEFAULT 0.00,
			expected_cash decimal(12,2) NOT NULL DEFAULT 0.00,
			counted_cash decimal(12,2) NOT NULL DEFAULT 0.00,
			difference decimal(12,2) NOT NULL DEFAULT 0.00,
			orders_count int(11) NOT NULL DEFAULT 0,
			status varchar(20) NOT NULL DEFAULT 'open',
			notes text DEFAULT NULL,
			PRIMARY KEY  (id),
			KEY cashier_id (cashier_id),
			KEY status (status)
		) $charset_collate;";

		$sql_logs = "CREATE TABLE IF NOT EXISTS $logs_table (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			shift_id bigint(20) unsigned NOT NULL,
			cashier_id bigint(20) unsigned NOT NULL,
			cashier_name varchar(191) NOT NULL DEFAULT '',
			type varchar(20) NOT NULL,
			amount decimal(12,2) NOT NULL DEFAULT 0.00,
			reason text NOT NULL,
			created_at datetime NOT NULL,
			PRIMARY KEY  (id),
			KEY shift_id (shift_id)
		) $charset_collate;";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql_shifts );
		dbDelta( $sql_logs );

		// Fallback direct creation if dbDelta was bypassed
		$wpdb->query( $sql_shifts );
		$wpdb->query( $sql_logs );
	}

	/**
	 * Get currently active open shift for cashier (or global open shift)
	 *
	 * @param int $cashier_id
	 * @return object|null
	 */
	public static function get_current_shift( $cashier_id = 0 ) {
		global $wpdb;
		$shifts_table = $wpdb->prefix . 'omni_pos_shifts';

		self::init_db();

		if ( $cashier_id > 0 ) {
			$shift = $wpdb->get_row( $wpdb->prepare(
				"SELECT * FROM $shifts_table WHERE status = 'open' AND cashier_id = %d ORDER BY id DESC LIMIT 1",
				$cashier_id
			) );
		} else {
			$shift = $wpdb->get_row( "SELECT * FROM $shifts_table WHERE status = 'open' ORDER BY id DESC LIMIT 1" );
		}

		if ( ! $shift ) {
			return null;
		}

		// Calculate live sales within this shift time window
		return self::recalculate_shift_live_stats( $shift );
	}

	/**
	 * Recalculate live shift stats from orders and cash logs
	 */
	public static function recalculate_shift_live_stats( $shift ) {
		global $wpdb;
		$shifts_table = $wpdb->prefix . 'omni_pos_shifts';
		$logs_table   = $wpdb->prefix . 'omni_pos_cash_logs';

		$shift_id = (int) $shift->id;
		$cash_sales   = 0.0;
		$card_sales   = 0.0;
		$other_sales  = 0.0;
		$orders_count = 0;

		try {
			// 1. Query all orders linked to this shift ID by meta
			$orders = wc_get_orders( array(
				'limit'        => -1,
				'status'       => array( 'completed', 'processing' ),
				'meta_key'     => '_omni_pos_shift_id',
				'meta_value'   => $shift_id,
				'meta_compare' => '=',
				'return'       => 'objects',
			) );

			// 2. If no meta-linked orders found, fallback to timeframe query
			if ( empty( $orders ) ) {
				$opened_at = $shift->opened_at;
				$closed_at = $shift->closed_at ?: current_time( 'mysql' );
				$start_ts  = strtotime( $opened_at );
				$end_ts    = strtotime( $closed_at );

				$all_recent_orders = wc_get_orders( array(
					'limit'  => 100,
					'status' => array( 'completed', 'processing' ),
					'return' => 'objects',
				) );

				$orders = array();
				foreach ( $all_recent_orders as $o ) {
					$order_time = $o->get_date_created() ? $o->get_date_created()->getTimestamp() : 0;
					if ( $order_time >= ( $start_ts - 60 ) && $order_time <= ( $end_ts + 60 ) ) {
						if ( 'yes' === $o->get_meta( '_omni_pos_order' ) || $o->get_created_via() === 'omni_pos' ) {
							$orders[] = $o;
						}
					}
				}
			}

			if ( ! empty( $orders ) ) {
				foreach ( $orders as $order ) {
					if ( ! is_object( $order ) ) {
						continue;
					}
					$total  = (float) $order->get_total();
					$method = (string) $order->get_payment_method();
					$split  = $order->get_meta( '_omni_pos_split_details' );

					if ( ! empty( $split ) && is_array( $split ) ) {
						$cash_amt = isset( $split['cash'] ) ? (float) $split['cash'] : 0.0;
						$card_amt = isset( $split['card'] ) ? (float) $split['card'] : 0.0;
						$cash_sales += $cash_amt;
						$card_sales += $card_amt;
					} elseif ( strpos( $method, 'cash' ) !== false ) {
						$cash_sales += $total;
					} elseif ( strpos( $method, 'card' ) !== false ) {
						$card_sales += $total;
					} else {
						$other_sales += $total;
					}
					$orders_count++;
				}
			}
		} catch ( \Throwable $t ) {
			// Preserve existing values if query fails
			$cash_sales   = (float) $shift->cash_sales;
			$card_sales   = (float) $shift->card_sales;
			$other_sales  = (float) $shift->other_sales;
			$orders_count = (int) $shift->orders_count;
		}

		// Calculate Cash In & Cash Out from logs
		$logs_totals = $wpdb->get_results( $wpdb->prepare(
			"SELECT type, SUM(amount) as total FROM $logs_table WHERE shift_id = %d GROUP BY type",
			$shift_id
		), OBJECT_K );

		$cash_in  = isset( $logs_totals['in'] ) ? (float) $logs_totals['in']->total : 0.0;
		$cash_out = isset( $logs_totals['out'] ) ? (float) $logs_totals['out']->total : 0.0;

		$opening_float = (float) $shift->opening_float;
		$expected_cash = $opening_float + $cash_sales + $cash_in - $cash_out;

		$shift->cash_sales    = round( $cash_sales, 2 );
		$shift->card_sales    = round( $card_sales, 2 );
		$shift->other_sales   = round( $other_sales, 2 );
		$shift->cash_in       = round( $cash_in, 2 );
		$shift->cash_out      = round( $cash_out, 2 );
		$shift->expected_cash = round( $expected_cash, 2 );
		$shift->orders_count  = $orders_count;

		// Persist live recalculated figures to shifts table
		$wpdb->update(
			$shifts_table,
			array(
				'cash_sales'    => $shift->cash_sales,
				'card_sales'    => $shift->card_sales,
				'other_sales'   => $shift->other_sales,
				'cash_in'       => $shift->cash_in,
				'cash_out'      => $shift->cash_out,
				'expected_cash' => $shift->expected_cash,
				'orders_count'  => $shift->orders_count,
			),
			array( 'id' => $shift_id ),
			array( '%f', '%f', '%f', '%f', '%f', '%f', '%d' ),
			array( '%d' )
		);

		return $shift;
	}

	/**
	 * Record sale on active shift directly during order completion
	 */
	public static function record_order_sale( $order, $shift_id = 0 ) {
		if ( ! is_object( $order ) ) {
			return false;
		}

		if ( empty( $shift_id ) ) {
			$current_shift = self::get_current_shift();
			if ( ! $current_shift ) {
				return false;
			}
			$shift_id = $current_shift->id;
		}

		// Ensure order has shift meta saved
		$order->update_meta_data( '_omni_pos_shift_id', $shift_id );
		$order->save_meta_data();

		global $wpdb;
		$shifts_table = $wpdb->prefix . 'omni_pos_shifts';
		$shift = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $shifts_table WHERE id = %d", $shift_id ) );

		if ( $shift ) {
			self::recalculate_shift_live_stats( $shift );
			return true;
		}

		return false;
	}

	/**
	 * Open a new shift
	 */
	public static function open_shift( $cashier_id, $cashier_name, $opening_float = 0.0, $notes = '' ) {
		global $wpdb;
		$shifts_table = $wpdb->prefix . 'omni_pos_shifts';

		self::init_db();

		// Check if there is already an open shift
		$existing = self::get_current_shift( $cashier_id );
		if ( $existing ) {
			return $existing;
		}

		$wpdb->insert(
			$shifts_table,
			array(
				'cashier_id'    => $cashier_id,
				'cashier_name'  => sanitize_text_field( $cashier_name ),
				'opened_at'     => current_time( 'mysql' ),
				'opening_float' => (float) $opening_float,
				'expected_cash' => (float) $opening_float,
				'status'        => 'open',
				'notes'         => sanitize_textarea_field( $notes ),
			),
			array( '%d', '%s', '%s', '%f', '%f', '%s', '%s' )
		);

		$shift_id = $wpdb->insert_id;
		return self::get_current_shift( $cashier_id );
	}

	/**
	 * Close a shift and calculate final Z-report discrepancies
	 */
	public static function close_shift( $shift_id, $counted_cash, $notes = '' ) {
		global $wpdb;
		$shifts_table = $wpdb->prefix . 'omni_pos_shifts';

		$shift = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $shifts_table WHERE id = %d", $shift_id ) );
		if ( ! $shift || $shift->status === 'closed' ) {
			return false;
		}

		$shift = self::recalculate_shift_live_stats( $shift );

		$counted_cash = (float) $counted_cash;
		$difference   = round( $counted_cash - (float) $shift->expected_cash, 2 );
		$closed_at    = current_time( 'mysql' );

		$wpdb->update(
			$shifts_table,
			array(
				'closed_at'     => $closed_at,
				'cash_sales'    => $shift->cash_sales,
				'card_sales'    => $shift->card_sales,
				'other_sales'   => $shift->other_sales,
				'cash_in'       => $shift->cash_in,
				'cash_out'      => $shift->cash_out,
				'expected_cash' => $shift->expected_cash,
				'counted_cash'  => $counted_cash,
				'difference'    => $difference,
				'orders_count'  => $shift->orders_count,
				'status'        => 'closed',
				'notes'         => sanitize_textarea_field( $notes ),
			),
			array( 'id' => $shift_id ),
			array( '%s', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%d', '%s', '%s' ),
			array( '%d' )
		);

		$shift->closed_at    = $closed_at;
		$shift->counted_cash = $counted_cash;
		$shift->difference   = $difference;
		$shift->status       = 'closed';

		return $shift;
	}

	/**
	 * Log Cash In / Cash Out
	 */
	public static function add_cash_movement( $shift_id, $cashier_id, $cashier_name, $type, $amount, $reason ) {
		global $wpdb;
		$logs_table = $wpdb->prefix . 'omni_pos_cash_logs';

		self::init_db();

		$wpdb->insert(
			$logs_table,
			array(
				'shift_id'     => (int) $shift_id,
				'cashier_id'   => (int) $cashier_id,
				'cashier_name' => sanitize_text_field( $cashier_name ),
				'type'         => sanitize_key( $type ), // 'in' or 'out'
				'amount'       => abs( (float) $amount ),
				'reason'       => sanitize_textarea_field( $reason ),
				'created_at'   => current_time( 'mysql' ),
			),
			array( '%d', '%d', '%s', '%s', '%f', '%s', '%s' )
		);

		return $wpdb->insert_id;
	}

	/**
	 * Get Cash logs for shift
	 */
	public static function get_shift_logs( $shift_id ) {
		global $wpdb;
		$logs_table = $wpdb->prefix . 'omni_pos_cash_logs';
		return $wpdb->get_results( $wpdb->prepare(
			"SELECT * FROM $logs_table WHERE shift_id = %d ORDER BY id DESC",
			$shift_id
		) );
	}

	/**
	 * Get shift history
	 */
	public static function get_shift_history( $page = 1, $per_page = 20 ) {
		global $wpdb;
		$shifts_table = $wpdb->prefix . 'omni_pos_shifts';

		self::init_db();

		$offset = ( $page - 1 ) * $per_page;
		$total  = (int) $wpdb->get_var( "SELECT COUNT(id) FROM $shifts_table" );
		$shifts = $wpdb->get_results( $wpdb->prepare(
			"SELECT * FROM $shifts_table ORDER BY id DESC LIMIT %d OFFSET %d",
			$per_page,
			$offset
		) );

		return array(
			'shifts'      => $shifts,
			'total'       => $total,
			'total_pages' => ceil( $total / max( 1, $per_page ) ),
			'page'        => $page,
		);
	}
}
