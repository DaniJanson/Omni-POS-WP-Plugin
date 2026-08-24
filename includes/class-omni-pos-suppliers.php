<?php
/**
 * Omni POS Suppliers & Distribution (Purchase Invoices & Stock Intake) Handler
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Omni_POS_Suppliers {

	/**
	 * Initialize DB tables for suppliers and purchase invoices
	 */
	public static function init_db() {
		global $wpdb;

		$charset_collate  = $wpdb->get_charset_collate();
		$suppliers_table  = $wpdb->prefix . 'omni_pos_suppliers';
		$purchases_table  = $wpdb->prefix . 'omni_pos_purchases';

		$sql_suppliers = "CREATE TABLE IF NOT EXISTS $suppliers_table (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			name varchar(191) NOT NULL,
			company varchar(191) NOT NULL DEFAULT '',
			email varchar(100) NOT NULL DEFAULT '',
			phone varchar(50) NOT NULL DEFAULT '',
			tax_number varchar(50) NOT NULL DEFAULT '',
			address text DEFAULT NULL,
			notes text DEFAULT NULL,
			total_purchases decimal(12,2) NOT NULL DEFAULT 0.00,
			created_at datetime NOT NULL,
			PRIMARY KEY  (id),
			KEY name (name)
		) $charset_collate;";

		$sql_purchases = "CREATE TABLE IF NOT EXISTS $purchases_table (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			invoice_number varchar(100) NOT NULL DEFAULT '',
			supplier_id bigint(20) unsigned NOT NULL DEFAULT 0,
			supplier_name varchar(191) NOT NULL DEFAULT '',
			date_received datetime NOT NULL,
			status varchar(20) NOT NULL DEFAULT 'received',
			payment_status varchar(20) NOT NULL DEFAULT 'paid',
			payment_method varchar(50) NOT NULL DEFAULT 'bank_transfer',
			items longtext NOT NULL,
			items_count int(11) NOT NULL DEFAULT 0,
			subtotal decimal(12,2) NOT NULL DEFAULT 0.00,
			tax_amount decimal(12,2) NOT NULL DEFAULT 0.00,
			total_amount decimal(12,2) NOT NULL DEFAULT 0.00,
			notes text DEFAULT NULL,
			created_by bigint(20) unsigned NOT NULL DEFAULT 0,
			created_at datetime NOT NULL,
			PRIMARY KEY  (id),
			KEY supplier_id (supplier_id),
			KEY invoice_number (invoice_number),
			KEY status (status)
		) $charset_collate;";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql_suppliers );
		dbDelta( $sql_purchases );
	}

	/**
	 * Get Suppliers list
	 */
	public static function get_suppliers( $search = '' ) {
		self::init_db();
		global $wpdb;
		$table = $wpdb->prefix . 'omni_pos_suppliers';

		if ( ! empty( $search ) ) {
			$like = '%' . $wpdb->esc_like( $search ) . '%';
			$sql  = $wpdb->prepare( "SELECT * FROM $table WHERE name LIKE %s OR company LIKE %s OR phone LIKE %s OR tax_number LIKE %s ORDER BY name ASC", $like, $like, $like, $like );
		} else {
			$sql = "SELECT * FROM $table ORDER BY name ASC";
		}

		$results = $wpdb->get_results( $sql, ARRAY_A );
		if ( empty( $results ) ) {
			return array();
		}

		return array_map( function( $row ) {
			return array(
				'id'              => (int) $row['id'],
				'name'            => html_entity_decode( $row['name'], ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'company'         => html_entity_decode( $row['company'], ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'email'           => $row['email'],
				'phone'           => $row['phone'],
				'tax_number'      => $row['tax_number'],
				'address'         => $row['address'],
				'notes'           => $row['notes'],
				'total_purchases' => (float) $row['total_purchases'],
				'created_at'      => $row['created_at'],
			);
		}, $results );
	}

	/**
	 * Create or Update Supplier
	 */
	public static function save_supplier( $data, $id = 0 ) {
		self::init_db();
		global $wpdb;
		$table = $wpdb->prefix . 'omni_pos_suppliers';

		$name       = sanitize_text_field( $data['name'] ?? '' );
		$company    = sanitize_text_field( $data['company'] ?? '' );
		$email      = sanitize_email( $data['email'] ?? '' );
		$phone      = sanitize_text_field( $data['phone'] ?? '' );
		$tax_number = sanitize_text_field( $data['tax_number'] ?? '' );
		$address    = sanitize_textarea_field( $data['address'] ?? '' );
		$notes      = sanitize_textarea_field( $data['notes'] ?? '' );

		if ( empty( $name ) ) {
			throw new \Exception( __( 'Supplier name is required.', 'omni-pos' ) );
		}

		$payload = array(
			'name'       => $name,
			'company'    => $company,
			'email'      => $email,
			'phone'      => $phone,
			'tax_number' => $tax_number,
			'address'    => $address,
			'notes'      => $notes,
		);

		if ( $id > 0 ) {
			$wpdb->update( $table, $payload, array( 'id' => $id ) );
			$supplier_id = $id;
		} else {
			$payload['total_purchases'] = 0.00;
			$payload['created_at']      = current_time( 'mysql' );
			$wpdb->insert( $table, $payload );
			$supplier_id = $wpdb->insert_id;
		}

		return self::get_supplier( $supplier_id );
	}

	/**
	 * Get single supplier
	 */
	public static function get_supplier( $id ) {
		self::init_db();
		global $wpdb;
		$table = $wpdb->prefix . 'omni_pos_suppliers';
		$row   = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $table WHERE id = %d", $id ), ARRAY_A );

		if ( ! $row ) {
			return null;
		}

		return array(
			'id'              => (int) $row['id'],
			'name'            => html_entity_decode( $row['name'], ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			'company'         => html_entity_decode( $row['company'], ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			'email'           => $row['email'],
			'phone'           => $row['phone'],
			'tax_number'      => $row['tax_number'],
			'address'         => $row['address'],
			'notes'           => $row['notes'],
			'total_purchases' => (float) $row['total_purchases'],
			'created_at'      => $row['created_at'],
		);
	}

	/**
	 * Delete supplier
	 */
	public static function delete_supplier( $id ) {
		self::init_db();
		global $wpdb;
		$table = $wpdb->prefix . 'omni_pos_suppliers';
		return $wpdb->delete( $table, array( 'id' => $id ) );
	}

	/**
	 * Get Purchase Invoices / Distribution records
	 */
	public static function get_purchases( $args = array() ) {
		self::init_db();
		global $wpdb;
		$table = $wpdb->prefix . 'omni_pos_purchases';

		$page        = max( 1, (int) ( $args['page'] ?? 1 ) );
		$per_page    = min( 100, max( 5, (int) ( $args['per_page'] ?? 20 ) ) );
		$offset      = ( $page - 1 ) * $per_page;
		$search      = sanitize_text_field( $args['search'] ?? '' );
		$supplier_id = (int) ( $args['supplier_id'] ?? 0 );
		$status      = sanitize_text_field( $args['status'] ?? '' );
		$date_from   = sanitize_text_field( $args['date_from'] ?? '' );
		$date_to     = sanitize_text_field( $args['date_to'] ?? '' );

		$where = array( '1=1' );
		$params = array();

		if ( ! empty( $search ) ) {
			$like = '%' . $wpdb->esc_like( $search ) . '%';
			$where[] = "(invoice_number LIKE %s OR supplier_name LIKE %s OR notes LIKE %s)";
			$params[] = $like;
			$params[] = $like;
			$params[] = $like;
		}

		if ( $supplier_id > 0 ) {
			$where[] = "supplier_id = %d";
			$params[] = $supplier_id;
		}

		if ( ! empty( $status ) && 'all' !== $status ) {
			$where[] = "status = %s";
			$params[] = $status;
		}

		if ( ! empty( $date_from ) && ! empty( $date_to ) ) {
			$where[] = "date_received BETWEEN %s AND %s";
			$params[] = $date_from . ' 00:00:00';
			$params[] = $date_to . ' 23:59:59';
		} elseif ( ! empty( $date_from ) ) {
			$where[] = "date_received >= %s";
			$params[] = $date_from . ' 00:00:00';
		}

		$where_str = implode( ' AND ', $where );

		// Count total
		$count_sql = "SELECT COUNT(*) FROM $table WHERE $where_str";
		if ( ! empty( $params ) ) {
			$count_sql = $wpdb->prepare( $count_sql, $params );
		}
		$total = (int) $wpdb->get_var( $count_sql );

		// Sum total amount
		$sum_sql = "SELECT SUM(total_amount) FROM $table WHERE $where_str";
		if ( ! empty( $params ) ) {
			$sum_sql = $wpdb->prepare( $sum_sql, $params );
		}
		$total_amount = (float) $wpdb->get_var( $sum_sql );

		// Query page
		$data_sql = "SELECT * FROM $table WHERE $where_str ORDER BY date_received DESC, id DESC LIMIT %d OFFSET %d";
		$params[] = $per_page;
		$params[] = $offset;
		$data_sql = $wpdb->prepare( $data_sql, $params );

		$results = $wpdb->get_results( $data_sql, ARRAY_A );
		$purchases = array();

		if ( ! empty( $results ) ) {
			foreach ( $results as $row ) {
				$items = json_decode( $row['items'], true ) ?: array();
				$purchases[] = array(
					'id'             => (int) $row['id'],
					'invoice_number' => $row['invoice_number'],
					'supplier_id'    => (int) $row['supplier_id'],
					'supplier_name'  => html_entity_decode( $row['supplier_name'], ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
					'date_received'  => $row['date_received'],
					'status'         => $row['status'],
					'payment_status' => $row['payment_status'],
					'payment_method' => $row['payment_method'],
					'items'          => $items,
					'items_count'    => (int) $row['items_count'],
					'subtotal'       => (float) $row['subtotal'],
					'tax_amount'     => (float) $row['tax_amount'],
					'total_amount'   => (float) $row['total_amount'],
					'notes'          => $row['notes'],
					'created_at'     => $row['created_at'],
				);
			}
		}

		return array(
			'purchases'    => $purchases,
			'total'        => $total,
			'total_pages'  => ceil( $total / $per_page ),
			'total_amount' => round( $total_amount, 2 ),
			'page'         => $page,
			'per_page'     => $per_page,
		);
	}

	/**
	 * Create or Update Purchase Invoice & Auto-Adjust Inventory
	 */
	public static function save_purchase( $data, $id = 0 ) {
		self::init_db();
		global $wpdb;
		$table          = $wpdb->prefix . 'omni_pos_purchases';
		$supp_table     = $wpdb->prefix . 'omni_pos_suppliers';

		$invoice_number = sanitize_text_field( $data['invoice_number'] ?? '' );
		$supplier_id    = (int) ( $data['supplier_id'] ?? 0 );
		$supplier_name  = sanitize_text_field( $data['supplier_name'] ?? '' );
		$date_received  = sanitize_text_field( $data['date_received'] ?? current_time( 'mysql' ) );
		$status         = sanitize_key( $data['status'] ?? 'received' );
		$payment_status = sanitize_key( $data['payment_status'] ?? 'paid' );
		$payment_method = sanitize_text_field( $data['payment_method'] ?? 'bank_transfer' );
		$raw_items      = $data['items'] ?? array();
		$notes          = sanitize_textarea_field( $data['notes'] ?? '' );

		if ( empty( $invoice_number ) ) {
			$invoice_number = 'INV-' . strtoupper( wp_generate_password( 6, false ) );
		}

		if ( $supplier_id > 0 && empty( $supplier_name ) ) {
			$supp = self::get_supplier( $supplier_id );
			if ( $supp ) {
				$supplier_name = $supp['company'] ?: $supp['name'];
			}
		}

		// Process Line Items and Calculate Totals
		$processed_items = array();
		$subtotal        = 0.0;
		$items_count     = 0;

		foreach ( $raw_items as $item ) {
			$prod_id    = (int) ( $item['product_id'] ?? $item['id'] ?? 0 );
			$var_id     = (int) ( $item['variation_id'] ?? 0 );
			$target_id  = $var_id > 0 ? $var_id : $prod_id;
			$product    = $target_id > 0 ? wc_get_product( $target_id ) : null;

			$name       = sanitize_text_field( $item['name'] ?? ( $product ? $product->get_name() : __( 'Item', 'omni-pos' ) ) );
			$sku        = sanitize_text_field( $item['sku'] ?? ( $product ? $product->get_sku() : '' ) );
			$qty        = max( 0.01, (float) ( $item['quantity'] ?? $item['qty'] ?? 1 ) );
			$cost_price = max( 0, (float) ( $item['cost_price'] ?? 0 ) );
			$sale_price = max( 0, (float) ( $item['sale_price'] ?? ( $product ? (float) $product->get_price() : 0 ) ) );
			$line_total = $cost_price * $qty;

			$subtotal    += $line_total;
			$items_count += $qty;

			$processed_items[] = array(
				'product_id'   => $prod_id,
				'variation_id' => $var_id,
				'name'         => $name,
				'sku'          => $sku,
				'quantity'     => $qty,
				'cost_price'   => round( $cost_price, 2 ),
				'sale_price'   => round( $sale_price, 2 ),
				'line_total'   => round( $line_total, 2 ),
			);

			// Automatically increase stock in WooCommerce if status is 'received'
			if ( 'received' === $status && $product ) {
				$product->set_manage_stock( true );
				$curr_stock = (float) $product->get_stock_quantity();
				$new_stock  = $curr_stock + $qty;
				$product->set_stock_quantity( $new_stock );
				$product->set_stock_status( $new_stock > 0 ? 'instock' : 'outofstock' );

				// Update cost price and retail price meta
				if ( $cost_price > 0 ) {
					$product->update_meta_data( '_omni_pos_cost_price', $cost_price );
					$product->update_meta_data( '_cost_price', $cost_price );
				}
				if ( $sale_price > 0 ) {
					$product->set_regular_price( $sale_price );
					$product->set_price( $sale_price );
				}
				$product->save();

				if ( function_exists( 'wc_delete_product_transients' ) ) {
					wc_delete_product_transients( $product->get_id() );
				}
				clean_post_cache( $product->get_id() );
			}
		}

		$tax_amount   = (float) ( $data['tax_amount'] ?? 0 );
		$total_amount = $subtotal + $tax_amount;

		$payload = array(
			'invoice_number' => $invoice_number,
			'supplier_id'    => $supplier_id,
			'supplier_name'  => $supplier_name,
			'date_received'  => $date_received,
			'status'         => $status,
			'payment_status' => $payment_status,
			'payment_method' => $payment_method,
			'items'          => wp_json_encode( $processed_items ),
			'items_count'    => $items_count,
			'subtotal'       => round( $subtotal, 2 ),
			'tax_amount'     => round( $tax_amount, 2 ),
			'total_amount'   => round( $total_amount, 2 ),
			'notes'          => $notes,
			'created_by'     => get_current_user_id(),
		);

		if ( $id > 0 ) {
			$wpdb->update( $table, $payload, array( 'id' => $id ) );
			$purchase_id = $id;
		} else {
			$payload['created_at'] = current_time( 'mysql' );
			$wpdb->insert( $table, $payload );
			$purchase_id = $wpdb->insert_id;
		}

		// Update supplier total purchase volume
		if ( $supplier_id > 0 ) {
			$total_volume = (float) $wpdb->get_var( $wpdb->prepare( "SELECT SUM(total_amount) FROM $table WHERE supplier_id = %d AND status = 'received'", $supplier_id ) );
			$wpdb->update( $supp_table, array( 'total_purchases' => $total_volume ), array( 'id' => $supplier_id ) );
		}

		return self::get_purchase( $purchase_id );
	}

	/**
	 * Get single purchase invoice
	 */
	public static function get_purchase( $id ) {
		self::init_db();
		global $wpdb;
		$table = $wpdb->prefix . 'omni_pos_purchases';
		$row   = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $table WHERE id = %d", $id ), ARRAY_A );

		if ( ! $row ) {
			return null;
		}

		return array(
			'id'             => (int) $row['id'],
			'invoice_number' => $row['invoice_number'],
			'supplier_id'    => (int) $row['supplier_id'],
			'supplier_name'  => html_entity_decode( $row['supplier_name'], ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			'date_received'  => $row['date_received'],
			'status'         => $row['status'],
			'payment_status' => $row['payment_status'],
			'payment_method' => $row['payment_method'],
			'items'          => json_decode( $row['items'], true ) ?: array(),
			'items_count'    => (int) $row['items_count'],
			'subtotal'       => (float) $row['subtotal'],
			'tax_amount'     => (float) $row['tax_amount'],
			'total_amount'   => (float) $row['total_amount'],
			'notes'          => $row['notes'],
			'created_at'     => $row['created_at'],
		);
	}

	/**
	 * Delete purchase invoice and decrease stock if it was received
	 */
	public static function delete_purchase( $id ) {
		self::init_db();
		global $wpdb;
		$table      = $wpdb->prefix . 'omni_pos_purchases';
		$supp_table = $wpdb->prefix . 'omni_pos_suppliers';

		$purchase = self::get_purchase( $id );
		if ( ! $purchase ) {
			return false;
		}

		// If it was received, decrease stock
		if ( 'received' === $purchase['status'] ) {
			foreach ( $purchase['items'] as $item ) {
				$target_id = ! empty( $item['variation_id'] ) ? (int) $item['variation_id'] : (int) $item['product_id'];
				$product   = $target_id > 0 ? wc_get_product( $target_id ) : null;
				if ( $product && $product->managing_stock() ) {
					$qty = (float) ( $item['quantity'] ?? 0 );
					if ( $qty > 0 ) {
						wc_update_product_stock( $product, $qty, 'decrease' );
					}
				}
			}
		}

		$wpdb->delete( $table, array( 'id' => $id ) );

		if ( $purchase['supplier_id'] > 0 ) {
			$total_volume = (float) $wpdb->get_var( $wpdb->prepare( "SELECT SUM(total_amount) FROM $table WHERE supplier_id = %d AND status = 'received'", $purchase['supplier_id'] ) );
			$wpdb->update( $supp_table, array( 'total_purchases' => $total_volume ), array( 'id' => $purchase['supplier_id'] ) );
		}

		return true;
	}
}
