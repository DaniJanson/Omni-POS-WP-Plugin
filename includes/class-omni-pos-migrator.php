<?php
/**
 * Omni POS - VitePOS Data Migrator & Safe Rollback Engine
 *
 * Scans, backs up, and safely imports products, barcodes, cost prices,
 * outlet stocks, cashier cash drawer sessions (shifts), cash movements,
 * and VitePOS orders into Omni POS.
 *
 * @package Omni_POS
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Omni_POS_Migrator {

	/**
	 * Get directory where migration snapshots are safely stored
	 */
	public static function get_backup_dir() {
		$upload_dir = wp_upload_dir();
		$backup_dir = $upload_dir['basedir'] . '/omni-pos-backups';
		if ( ! is_dir( $backup_dir ) ) {
			wp_mkdir_p( $backup_dir );
			// Add an index.html and .htaccess for security
			file_put_contents( $backup_dir . '/index.html', '' );
			file_put_contents( $backup_dir . '/.htaccess', 'deny from all' );
		}
		return $backup_dir;
	}

	/**
	 * Detect VitePOS tables and available records
	 */
	public static function get_migration_stats() {
		global $wpdb;

		// 1. Check VitePOS Barcodes and Cost Prices in Product Meta
		$products_with_vtp_barcode = (int) $wpdb->get_var(
			"SELECT COUNT(DISTINCT post_id) FROM {$wpdb->postmeta} WHERE meta_key IN ('_vtp_barcode', '_vt_barcode') AND meta_value != ''"
		);

		$products_with_vtp_cost = (int) $wpdb->get_var(
			"SELECT COUNT(DISTINCT post_id) FROM {$wpdb->postmeta} WHERE meta_key IN ('_vtp_cost_price', '_vt_cost_price') AND meta_value != ''"
		);

		// 2. Check VitePOS Multi-Outlet Stock Records
		$vtp_stock_log_table = $wpdb->prefix . 'apbd_pos_stock_log';
		$stock_log_exists = ( $wpdb->get_var( "SHOW TABLES LIKE '$vtp_stock_log_table'" ) === $vtp_stock_log_table );
		$stock_log_products = $stock_log_exists ? (int) $wpdb->get_var( "SELECT COUNT(DISTINCT product_id) FROM $vtp_stock_log_table" ) : 0;

		$products_with_vtp_stocks = (int) $wpdb->get_var(
			"SELECT COUNT(DISTINCT post_id) FROM {$wpdb->postmeta} WHERE meta_key = '_vt_stocks' AND meta_value != ''"
		);
		$total_stock_records = max( $products_with_vtp_stocks, $stock_log_products );

		$total_products = (int) wp_count_posts( 'product' )->publish;
		$total_variations = (int) wp_count_posts( 'product_variation' )->publish;

		// 3. Check VitePOS Cash Drawer / Shifts Tables
		$vtp_drawer_table_v1 = $wpdb->prefix . 'apbd_pos_cash_drawer';
		$vtp_drawer_table_v2 = $wpdb->prefix . 'vtp_cash_drawer';
		$drawer_table = '';
		$drawer_count = 0;

		if ( $wpdb->get_var( "SHOW TABLES LIKE '$vtp_drawer_table_v1'" ) === $vtp_drawer_table_v1 ) {
			$drawer_table = $vtp_drawer_table_v1;
			$drawer_count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM $vtp_drawer_table_v1" );
		} elseif ( $wpdb->get_var( "SHOW TABLES LIKE '$vtp_drawer_table_v2'" ) === $vtp_drawer_table_v2 ) {
			$drawer_table = $vtp_drawer_table_v2;
			$drawer_count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM $vtp_drawer_table_v2" );
		}

		// 4. Check VitePOS Cash Drawer Logs / Movements Table
		$vtp_log_table_v1 = $wpdb->prefix . 'apbd_pos_cash_drawer_log';
		$vtp_log_table_v2 = $wpdb->prefix . 'vtp_cash_drawer_log';
		$log_table = '';
		$log_count = 0;

		if ( $wpdb->get_var( "SHOW TABLES LIKE '$vtp_log_table_v1'" ) === $vtp_log_table_v1 ) {
			$log_table = $vtp_log_table_v1;
			$log_count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM $vtp_log_table_v1" );
		} elseif ( $wpdb->get_var( "SHOW TABLES LIKE '$vtp_log_table_v2'" ) === $vtp_log_table_v2 ) {
			$log_table = $vtp_log_table_v2;
			$log_count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM $vtp_log_table_v2" );
		}

		// 5. Check VitePOS Orders
		$vtp_orders_count = (int) $wpdb->get_var(
			"SELECT COUNT(DISTINCT post_id) FROM {$wpdb->postmeta} WHERE meta_key = '_vtp_processed_by' OR meta_key = '_vtp_payment_list'"
		);

		// 6. Check VitePOS Vendors / Suppliers
		$vtp_vendor_table_v1 = $wpdb->prefix . 'apbd_pos_vendor';
		$vtp_vendor_table_v2 = $wpdb->prefix . 'vtp_vendor';
		$vendor_table = '';
		$vendor_count = 0;

		if ( $wpdb->get_var( "SHOW TABLES LIKE '$vtp_vendor_table_v1'" ) === $vtp_vendor_table_v1 ) {
			$vendor_table = $vtp_vendor_table_v1;
			$vendor_count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM $vtp_vendor_table_v1" );
		} elseif ( $wpdb->get_var( "SHOW TABLES LIKE '$vtp_vendor_table_v2'" ) === $vtp_vendor_table_v2 ) {
			$vendor_table = $vtp_vendor_table_v2;
			$vendor_count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM $vtp_vendor_table_v2" );
		}

		// Check if VitePOS plugin is currently active or present
		$is_vitepos_active = is_plugin_active( 'vitepos/vitepos.php' ) || is_plugin_active( 'vitepos-lite/vitepos-lite.php' );
		$is_vitepos_installed = file_exists( WP_PLUGIN_DIR . '/vitepos/vitepos.php' ) || file_exists( WP_PLUGIN_DIR . '/vitepos-lite/vitepos-lite.php' );

		// Check existing snapshots
		$snapshots = self::list_snapshots();

		return array(
			'is_vitepos_active'          => $is_vitepos_active,
			'is_vitepos_installed'       => $is_vitepos_installed,
			'products_with_vtp_barcode'  => $products_with_vtp_barcode,
			'products_with_vtp_cost'     => $products_with_vtp_cost,
			'products_with_vtp_stocks'   => $total_stock_records,
			'total_products'             => $total_products,
			'total_variations'           => $total_variations,
			'cash_drawer_sessions'       => $drawer_count,
			'cash_movements_count'       => $log_count,
			'vtp_orders_count'           => $vtp_orders_count,
			'vendors_count'              => $vendor_count,
			'has_migratable_data'        => ( $products_with_vtp_barcode > 0 || $total_stock_records > 0 || $products_with_vtp_cost > 0 || $drawer_count > 0 || $log_count > 0 || $vtp_orders_count > 0 || $vendor_count > 0 ),
			'available_snapshots'        => $snapshots,
		);
	}

	/**
	 * Create a complete pre-migration JSON snapshot for 1-click rollback
	 */
	public static function create_snapshot() {
		global $wpdb;

		$snapshot_id = 'snapshot_' . date( 'Ymd_His' );
		$backup_dir  = self::get_backup_dir();
		$file_path   = $backup_dir . '/' . $snapshot_id . '.json';

		// 1. Backup Omni Settings
		$omni_settings = get_option( 'omni_pos_settings', array() );

		// 2. Backup Omni Shifts table rows
		$shifts_table = $wpdb->prefix . 'omni_pos_shifts';
		$shifts_data  = array();
		if ( $wpdb->get_var( "SHOW TABLES LIKE '$shifts_table'" ) === $shifts_table ) {
			$shifts_data = $wpdb->get_results( "SELECT * FROM $shifts_table", ARRAY_A );
		}

		// 3. Backup Omni Cash Movements table rows
		$movements_table = $wpdb->prefix . 'omni_pos_cash_movements';
		$movements_data  = array();
		if ( $wpdb->get_var( "SHOW TABLES LIKE '$movements_table'" ) === $movements_table ) {
			$movements_data = $wpdb->get_results( "SELECT * FROM $movements_table", ARRAY_A );
		}

		// 4. Backup Existing Product Barcodes, Cost Prices, and Stock Metas
		$product_metas = $wpdb->get_results(
			"SELECT post_id, meta_key, meta_value FROM {$wpdb->postmeta} 
			 WHERE meta_key IN ('_barcode', '_omni_barcode', '_cost_price', '_omni_pos_cost_price', '_purchase_price', '_stock', '_manage_stock', '_stock_status')",
			ARRAY_A
		);

		$snapshot = array(
			'snapshot_id'    => $snapshot_id,
			'created_at'     => current_time( 'mysql' ),
			'omni_version'   => defined( 'OMNI_POS_VERSION' ) ? OMNI_POS_VERSION : '1.0.0',
			'omni_settings'  => $omni_settings,
			'shifts_data'    => $shifts_data,
			'movements_data' => $movements_data,
			'product_metas'  => $product_metas,
		);

		file_put_contents( $file_path, json_encode( $snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ) );

		return array(
			'snapshot_id' => $snapshot_id,
			'file_path'   => $file_path,
			'created_at'  => $snapshot['created_at'],
			'items_count' => count( $shifts_data ) + count( $movements_data ) + count( $product_metas ),
		);
	}

	/**
	 * Run Migration with chosen options
	 */
	public static function run_migration( $options = array() ) {
		global $wpdb;

		// Default options
		$opt = wp_parse_args( $options, array(
			'migrate_stocks'       => true,
			'migrate_barcodes'     => true,
			'migrate_cost_prices'  => true,
			'migrate_shifts'       => true,
			'migrate_movements'    => true,
			'migrate_orders'       => true,
			'migrate_vendors'      => true,
		) );

		// Step 1: Create Snapshot first!
		$snapshot_info = self::create_snapshot();

		$results = array(
			'success'             => true,
			'snapshot_id'         => $snapshot_info['snapshot_id'],
			'stocks_migrated'     => 0,
			'barcodes_migrated'   => 0,
			'costs_migrated'      => 0,
			'shifts_migrated'     => 0,
			'movements_migrated'  => 0,
			'orders_migrated'     => 0,
			'vendors_migrated'    => 0,
			'logs'                => array(),
		);

		$results['logs'][] = 'Safety snapshot created: ' . $snapshot_info['snapshot_id'];

		// Step 2: Migrate Stock Quantities from VitePOS to WooCommerce & Omni POS
		if ( ! empty( $opt['migrate_stocks'] ) ) {
			// Find all products with _vt_stocks meta
			$vt_stock_rows = $wpdb->get_results(
				"SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_vt_stocks' AND meta_value != ''",
				ARRAY_A
			);

			$processed_pids = array();

			foreach ( $vt_stock_rows as $row ) {
				$pid = (int) $row['post_id'];
				$processed_pids[ $pid ] = true;

				$stocks_data = maybe_unserialize( $row['meta_value'] );
				$total_qty = 0;

				if ( is_array( $stocks_data ) ) {
					foreach ( $stocks_data as $outlet_id => $qty ) {
						$total_qty += intval( $qty );
					}
				} elseif ( is_numeric( $stocks_data ) ) {
					$total_qty = intval( $stocks_data );
				}

				// Update WooCommerce core stock fields
				update_post_meta( $pid, '_stock', $total_qty );
				update_post_meta( $pid, '_manage_stock', 'yes' );
				$stock_status = ( $total_qty > 0 ) ? 'instock' : 'outofstock';
				update_post_meta( $pid, '_stock_status', $stock_status );

				// Update WooCommerce product meta lookup table if it exists
				$lookup_table = $wpdb->prefix . 'wc_product_meta_lookup';
				if ( $wpdb->get_var( "SHOW TABLES LIKE '$lookup_table'" ) === $lookup_table ) {
					$wpdb->update(
						$lookup_table,
						array(
							'stock_quantity' => $total_qty,
							'stock_status'   => $stock_status,
						),
						array( 'product_id' => $pid )
					);
				}

				if ( function_exists( 'wc_delete_product_transients' ) ) {
					wc_delete_product_transients( $pid );
				}

				$results['stocks_migrated']++;
			}

			// Also check VitePOS stock log table for any products not in _vt_stocks
			$vtp_stock_log_table = $wpdb->prefix . 'apbd_pos_stock_log';
			if ( $wpdb->get_var( "SHOW TABLES LIKE '$vtp_stock_log_table'" ) === $vtp_stock_log_table ) {
				$log_products = $wpdb->get_results(
					"SELECT product_id, stock_val FROM $vtp_stock_log_table WHERE id IN (
						SELECT MAX(id) FROM $vtp_stock_log_table GROUP BY product_id
					)",
					ARRAY_A
				);

				foreach ( $log_products as $lp ) {
					$pid = (int) $lp['product_id'];
					if ( ! empty( $processed_pids[ $pid ] ) ) {
						continue; // Already processed from _vt_stocks
					}

					$qty = intval( $lp['stock_val'] );
					update_post_meta( $pid, '_stock', $qty );
					update_post_meta( $pid, '_manage_stock', 'yes' );
					$stock_status = ( $qty > 0 ) ? 'instock' : 'outofstock';
					update_post_meta( $pid, '_stock_status', $stock_status );

					if ( function_exists( 'wc_delete_product_transients' ) ) {
						wc_delete_product_transients( $pid );
					}
					$results['stocks_migrated']++;
				}
			}

			$results['logs'][] = sprintf( 'Migrated %d product live stock quantities into WooCommerce.', $results['stocks_migrated'] );
		}

		// Step 3: Migrate Barcodes
		if ( ! empty( $opt['migrate_barcodes'] ) ) {
			$vtp_barcodes = $wpdb->get_results(
				"SELECT post_id, meta_key, meta_value FROM {$wpdb->postmeta} WHERE meta_key IN ('_vtp_barcode', '_vt_barcode') AND meta_value != ''",
				ARRAY_A
			);

			foreach ( $vtp_barcodes as $row ) {
				$pid     = (int) $row['post_id'];
				$barcode = sanitize_text_field( $row['meta_value'] );

				if ( ! empty( $barcode ) ) {
					// Save to standard _barcode and _omni_barcode
					update_post_meta( $pid, '_barcode', $barcode );
					update_post_meta( $pid, '_omni_barcode', $barcode );
					update_post_meta( $pid, '_omni_pos_barcode', $barcode );

					// If SKU is empty, populate SKU with barcode
					$current_sku = get_post_meta( $pid, '_sku', true );
					if ( empty( $current_sku ) ) {
						update_post_meta( $pid, '_sku', $barcode );
					}

					$results['barcodes_migrated']++;
				}
			}
			$results['logs'][] = sprintf( 'Migrated %d product barcodes.', $results['barcodes_migrated'] );
		}

		// Step 4: Migrate Cost Prices / თვითღირებულება
		if ( ! empty( $opt['migrate_cost_prices'] ) ) {
			$vtp_costs = $wpdb->get_results(
				"SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key IN ('_vtp_cost_price', '_vt_cost_price') AND meta_value != ''",
				ARRAY_A
			);

			foreach ( $vtp_costs as $row ) {
				$pid  = (int) $row['post_id'];
				$cost = floatval( $row['meta_value'] );

				if ( $cost > 0 ) {
					update_post_meta( $pid, '_cost_price', $cost );
					update_post_meta( $pid, '_omni_pos_cost_price', $cost );
					update_post_meta( $pid, '_purchase_price', $cost );
					$results['costs_migrated']++;
				}
			}
			$results['logs'][] = sprintf( 'Migrated %d cost prices.', $results['costs_migrated'] );
		}

		// Step 4: Migrate Cash Drawer Sessions to Omni Shifts
		if ( ! empty( $opt['migrate_shifts'] ) ) {
			$vtp_drawer_table = $wpdb->prefix . 'apbd_pos_cash_drawer';
			if ( $wpdb->get_var( "SHOW TABLES LIKE '$vtp_drawer_table'" ) !== $vtp_drawer_table ) {
				$vtp_drawer_table = $wpdb->prefix . 'vtp_cash_drawer';
			}

			$omni_shifts_table = $wpdb->prefix . 'omni_pos_shifts';

			if ( $wpdb->get_var( "SHOW TABLES LIKE '$vtp_drawer_table'" ) === $vtp_drawer_table &&
			     $wpdb->get_var( "SHOW TABLES LIKE '$omni_shifts_table'" ) === $omni_shifts_table ) {

				$drawers = $wpdb->get_results( "SELECT * FROM $vtp_drawer_table ORDER BY id ASC", ARRAY_A );

				foreach ( $drawers as $d ) {
					$vtp_id          = (int) $d['id'];
					$user_id         = (int) ( $d['opened_by'] ?? 1 );
					$opening_float   = floatval( $d['opening_balance'] ?? 0.0 );
					$closing_balance = floatval( $d['closing_balance'] ?? 0.0 );
					$opened_at       = ! empty( $d['opening_time'] ) ? $d['opening_time'] : current_time( 'mysql' );
					$closed_at       = ! empty( $d['closing_time'] ) ? $d['closing_time'] : null;
					$status          = ( strtolower( $d['status'] ?? '' ) === 'c' || ! empty( $closed_at ) ) ? 'closed' : 'open';

					// Check if already migrated
					$exists = $wpdb->get_var( $wpdb->prepare(
						"SELECT id FROM $omni_shifts_table WHERE notes LIKE %s",
						'%[VitePOS_Drawer_#' . $vtp_id . ']%'
					) );

					if ( ! $exists ) {
						$user = get_userdata( $user_id );
						$user_name = $user ? $user->display_name : 'VitePOS Cashier';

						$wpdb->insert(
							$omni_shifts_table,
							array(
								'cashier_id'    => $user_id,
								'cashier_name'  => $user_name,
								'opened_at'     => $opened_at,
								'closed_at'     => $closed_at,
								'opening_float' => $opening_float,
								'cash_sales'    => 0.00,
								'card_sales'    => 0.00,
								'other_sales'   => 0.00,
								'cash_in'       => 0.00,
								'cash_out'      => 0.00,
								'expected_cash' => $closing_balance,
								'counted_cash'  => $closing_balance,
								'difference'    => 0.00,
								'orders_count'  => 0,
								'status'        => $status,
								'notes'         => '[VitePOS_Drawer_#' . $vtp_id . '] Migrated from VitePOS Cash Drawer session.',
							),
							array( '%d', '%s', '%s', '%s', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%d', '%s', '%s' )
						);
						$results['shifts_migrated']++;
					}
				}
				$results['logs'][] = sprintf( 'Migrated %d cash drawer sessions to Omni POS Shifts.', $results['shifts_migrated'] );
			}
		}

		// Step 5: Migrate Cash Drawer Logs (Movements)
		if ( ! empty( $opt['migrate_movements'] ) ) {
			$vtp_log_table = $wpdb->prefix . 'apbd_pos_cash_drawer_log';
			if ( $wpdb->get_var( "SHOW TABLES LIKE '$vtp_log_table'" ) !== $vtp_log_table ) {
				$vtp_log_table = $wpdb->prefix . 'vtp_cash_drawer_log';
			}

			$omni_movements_table = $wpdb->prefix . 'omni_pos_cash_movements';

			if ( $wpdb->get_var( "SHOW TABLES LIKE '$vtp_log_table'" ) === $vtp_log_table &&
			     $wpdb->get_var( "SHOW TABLES LIKE '$omni_movements_table'" ) === $omni_movements_table ) {

				$logs = $wpdb->get_results( "SELECT * FROM $vtp_log_table ORDER BY id ASC", ARRAY_A );

				foreach ( $logs as $l ) {
					$vtp_log_id = (int) $l['id'];
					$vtp_drawer = (int) ( $l['cash_drawer_id'] ?? 0 );
					$amount     = floatval( $l['amount'] ?? 0.0 );
					$user_id    = (int) ( $l['user_id'] ?? 1 );
					$note       = sanitize_text_field( $l['note'] ?? $l['user_note'] ?? 'VitePOS cash movement' );
					$type_raw   = strtoupper( trim( $l['log_type'] ?? 'I' ) );
					$type       = ( $type_raw === 'O' || $type_raw === 'OUT' || $type_raw === 'EXPENSE' || $amount < 0 ) ? 'out' : 'in';

					// Find corresponding Omni shift ID
					$shift_id = (int) $wpdb->get_var( $wpdb->prepare(
						"SELECT id FROM {$wpdb->prefix}omni_pos_shifts WHERE notes LIKE %s LIMIT 1",
						'%[VitePOS_Drawer_#' . $vtp_drawer . ']%'
					) );

					// Check if already migrated
					$exists = $wpdb->get_var( $wpdb->prepare(
						"SELECT id FROM $omni_movements_table WHERE reason LIKE %s",
						'%[VitePOS_Log_#' . $vtp_log_id . ']%'
					) );

					if ( ! $exists ) {
						$user = get_userdata( $user_id );
						$user_name = $user ? $user->display_name : 'Cashier';

						$wpdb->insert(
							$omni_movements_table,
							array(
								'shift_id'   => $shift_id ?: null,
								'user_id'    => $user_id,
								'type'       => $type,
								'amount'     => abs( $amount ),
								'reason'     => '[VitePOS_Log_#' . $vtp_log_id . '] ' . $note,
								'created_at' => current_time( 'mysql' ),
							),
							array( '%d', '%d', '%s', '%f', '%s', '%s' )
						);
						$results['movements_migrated']++;
					}
				}
				$results['logs'][] = sprintf( 'Migrated %d cash drawer movements.', $results['movements_migrated'] );
			}
		}

		// Step 6: Migrate Orders Meta (Cashier Attribution & Change)
		if ( ! empty( $opt['migrate_orders'] ) ) {
			$vtp_orders = $wpdb->get_results(
				"SELECT DISTINCT post_id FROM {$wpdb->postmeta} WHERE meta_key IN ('_vtp_processed_by', '_vtp_payment_list')",
				ARRAY_A
			);

			foreach ( $vtp_orders as $row ) {
				$order_id = (int) $row['post_id'];
				$cashier_id = (int) get_post_meta( $order_id, '_vtp_processed_by', true );
				$tendered   = floatval( get_post_meta( $order_id, '_vtp_tendered_amount', true ) );
				$change     = floatval( get_post_meta( $order_id, '_vtp_change_amount', true ) );

				if ( $cashier_id > 0 && ! get_post_meta( $order_id, '_omni_cashier_id', true ) ) {
					$user = get_userdata( $cashier_id );
					update_post_meta( $order_id, '_omni_cashier_id', $cashier_id );
					update_post_meta( $order_id, '_omni_cashier_name', $user ? $user->display_name : 'VitePOS Cashier' );
					update_post_meta( $order_id, '_is_omni_pos_order', 'yes' );

					if ( $tendered > 0 ) {
						update_post_meta( $order_id, '_omni_tendered_amount', $tendered );
					}
					if ( $change > 0 ) {
						update_post_meta( $order_id, '_omni_change_amount', $change );
					}
					$results['orders_migrated']++;
				}
			}
			$results['logs'][] = sprintf( 'Enriched %d VitePOS orders with Omni POS cashier metadata.', $results['orders_migrated'] );
		}

		return $results;
	}

	/**
	 * Rollback a snapshot to return to previous state
	 */
	public static function rollback_migration( $snapshot_id ) {
		global $wpdb;

		$snapshot_id = sanitize_file_name( $snapshot_id );
		$backup_dir  = self::get_backup_dir();
		$file_path   = $backup_dir . '/' . $snapshot_id . '.json';

		if ( ! file_exists( $file_path ) ) {
			return new WP_Error( 'snapshot_not_found', 'Snapshot file does not exist.' );
		}

		$data = json_decode( file_get_contents( $file_path ), true );
		if ( ! is_array( $data ) ) {
			return new WP_Error( 'invalid_snapshot', 'Invalid snapshot JSON data.' );
		}

		// 1. Rollback Omni Settings
		if ( isset( $data['omni_settings'] ) && is_array( $data['omni_settings'] ) ) {
			update_option( 'omni_pos_settings', $data['omni_settings'] );
		}

		// 2. Rollback Shifts Table (Remove migrated rows)
		$shifts_table = $wpdb->prefix . 'omni_pos_shifts';
		if ( $wpdb->get_var( "SHOW TABLES LIKE '$shifts_table'" ) === $shifts_table ) {
			$wpdb->query( "DELETE FROM $shifts_table WHERE notes LIKE '%[VitePOS_Drawer_%'" );
		}

		// 3. Rollback Movements Table (Remove migrated rows)
		$movements_table = $wpdb->prefix . 'omni_pos_cash_movements';
		if ( $wpdb->get_var( "SHOW TABLES LIKE '$movements_table'" ) === $movements_table ) {
			$wpdb->query( "DELETE FROM $movements_table WHERE reason LIKE '%[VitePOS_Log_%'" );
		}

		// 4. Rollback Barcodes & Cost Prices if they were changed
		if ( isset( $data['product_metas'] ) && is_array( $data['product_metas'] ) ) {
			foreach ( $data['product_metas'] as $meta ) {
				update_post_meta( (int) $meta['post_id'], $meta['meta_key'], $meta['meta_value'] );
			}
		}

		return array(
			'success'     => true,
			'snapshot_id' => $snapshot_id,
			'message'     => 'System successfully rolled back to snapshot: ' . $snapshot_id,
		);
	}

	/**
	 * List all available backup snapshots
	 */
	public static function list_snapshots() {
		$backup_dir = self::get_backup_dir();
		$files      = glob( $backup_dir . '/snapshot_*.json' );
		$list       = array();

		if ( ! empty( $files ) ) {
			// Sort newest first
			usort( $files, function( $a, $b ) {
				return filemtime( $b ) - filemtime( $a );
			} );

			foreach ( $files as $f ) {
				$basename = basename( $f, '.json' );
				$raw_data = json_decode( file_get_contents( $f ), true );
				$list[] = array(
					'snapshot_id' => $basename,
					'created_at'  => $raw_data['created_at'] ?? date( 'Y-m-d H:i:s', filemtime( $f ) ),
					'size_kb'     => round( filesize( $f ) / 1024, 2 ),
				);
			}
		}

		return $list;
	}

	/**
	 * Initialize 2-way real-time stock & field synchronization
	 */
	public static function init_sync_hooks() {
		add_action( 'woocommerce_product_set_stock', array( __CLASS__, 'sync_wc_stock_to_vitepos' ) );
		add_action( 'save_post_product', array( __CLASS__, 'sync_product_fields_twoway' ), 25, 2 );
		add_action( 'save_post_product_variation', array( __CLASS__, 'sync_product_fields_twoway' ), 25, 2 );
		add_action( 'updated_post_meta', array( __CLASS__, 'on_post_meta_updated' ), 25, 4 );
		add_action( 'added_post_meta', array( __CLASS__, 'on_post_meta_updated' ), 25, 4 );
	}

	/**
	 * When WooCommerce stock changes, keep VitePOS _vt_stocks updated
	 */
	public static function sync_wc_stock_to_vitepos( $product ) {
		if ( ! is_object( $product ) ) {
			return;
		}
		$pid = $product->get_id();
		$qty = (int) $product->get_stock_quantity();
		
		$vt_stocks = get_post_meta( $pid, '_vt_stocks', true );
		if ( is_array( $vt_stocks ) && ! empty( $vt_stocks ) ) {
			// Set default outlet 1 or preserve multi-outlet
			$first_key = array_key_first( $vt_stocks );
			$vt_stocks[ $first_key ] = $qty;
		} else {
			$vt_stocks = array( 1 => $qty );
		}
		
		remove_action( 'updated_post_meta', array( __CLASS__, 'on_post_meta_updated' ), 25 );
		update_post_meta( $pid, '_vt_stocks', $vt_stocks );
		add_action( 'updated_post_meta', array( __CLASS__, 'on_post_meta_updated' ), 25, 4 );
	}

	/**
	 * Synchronize barcode, cost price, and stock 2-way on product save
	 */
	public static function sync_product_fields_twoway( $post_id, $post = null ) {
		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		// 1. Barcode Sync
		$barcode = get_post_meta( $post_id, '_barcode', true );
		$vt_barcode = get_post_meta( $post_id, '_vt_barcode', true );
		$vtp_barcode = get_post_meta( $post_id, '_vtp_barcode', true );

		$final_barcode = ! empty( $barcode ) ? $barcode : ( ! empty( $vt_barcode ) ? $vt_barcode : $vtp_barcode );

		if ( ! empty( $final_barcode ) ) {
			update_post_meta( $post_id, '_barcode', $final_barcode );
			update_post_meta( $post_id, '_omni_barcode', $final_barcode );
			update_post_meta( $post_id, '_omni_pos_barcode', $final_barcode );
			update_post_meta( $post_id, '_vt_barcode', $final_barcode );
			update_post_meta( $post_id, '_vtp_barcode', $final_barcode );

			$sku = get_post_meta( $post_id, '_sku', true );
			if ( empty( $sku ) ) {
				update_post_meta( $post_id, '_sku', $final_barcode );
			}
		}

		// 2. Cost Price Sync
		$cost = get_post_meta( $post_id, '_cost_price', true );
		$vt_cost = get_post_meta( $post_id, '_vt_cost_price', true );
		$vtp_cost = get_post_meta( $post_id, '_vtp_cost_price', true );

		$final_cost = ( floatval( $cost ) > 0 ) ? floatval( $cost ) : ( floatval( $vt_cost ) > 0 ? floatval( $vt_cost ) : floatval( $vtp_cost ) );

		if ( $final_cost > 0 ) {
			update_post_meta( $post_id, '_cost_price', $final_cost );
			update_post_meta( $post_id, '_omni_pos_cost_price', $final_cost );
			update_post_meta( $post_id, '_purchase_price', $final_cost );
			update_post_meta( $post_id, '_vt_cost_price', $final_cost );
			update_post_meta( $post_id, '_vtp_cost_price', $final_cost );
		}

		// 3. Stock Sync (If _vt_stocks exists, sync to _stock)
		$vt_stocks = get_post_meta( $post_id, '_vt_stocks', true );
		if ( ! empty( $vt_stocks ) ) {
			$vt_decoded = maybe_unserialize( $vt_stocks );
			$total_qty = 0;
			if ( is_array( $vt_decoded ) ) {
				foreach ( $vt_decoded as $q ) {
					$total_qty += intval( $q );
				}
			} elseif ( is_numeric( $vt_decoded ) ) {
				$total_qty = intval( $vt_decoded );
			}
			$wc_stock = get_post_meta( $post_id, '_stock', true );
			if ( $wc_stock === '' || $wc_stock === null ) {
				update_post_meta( $post_id, '_stock', $total_qty );
				update_post_meta( $post_id, '_manage_stock', 'yes' );
				update_post_meta( $post_id, '_stock_status', $total_qty > 0 ? 'instock' : 'outofstock' );
			}
		}
	}

	/**
	 * Catch individual meta updates for instant sync
	 */
	public static function on_post_meta_updated( $meta_id, $post_id, $meta_key, $meta_value ) {
		static $is_syncing = false;
		if ( $is_syncing ) {
			return;
		}

		if ( in_array( $meta_key, array( '_barcode', '_vt_barcode', '_vtp_barcode' ), true ) && ! empty( $meta_value ) ) {
			$is_syncing = true;
			update_post_meta( $post_id, '_barcode', $meta_value );
			update_post_meta( $post_id, '_omni_barcode', $meta_value );
			update_post_meta( $post_id, '_omni_pos_barcode', $meta_value );
			update_post_meta( $post_id, '_vt_barcode', $meta_value );
			update_post_meta( $post_id, '_vtp_barcode', $meta_value );
			$is_syncing = false;
		} elseif ( in_array( $meta_key, array( '_cost_price', '_vt_cost_price', '_vtp_cost_price', '_omni_pos_cost_price' ), true ) && floatval( $meta_value ) > 0 ) {
			$is_syncing = true;
			$c = floatval( $meta_value );
			update_post_meta( $post_id, '_cost_price', $c );
			update_post_meta( $post_id, '_omni_pos_cost_price', $c );
			update_post_meta( $post_id, '_purchase_price', $c );
			update_post_meta( $post_id, '_vt_cost_price', $c );
			update_post_meta( $post_id, '_vtp_cost_price', $c );
			$is_syncing = false;
		}
	}
}

// Automatically bind 2-way sync hooks
Omni_POS_Migrator::init_sync_hooks();

