<?php
/**
 * Omni POS Custom REST API Endpoints
 * 
 * Provides ultra-fast, lightweight JSON responses specifically tailored for POS SPA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Omni_POS_API {

	const NAMESPACE = 'omni-pos/v1';

	/**
	 * Register REST routes
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/**
	 * Permission check for POS requests
	 */
	public static function check_pos_permission( $request ) {
		// Allow logged in users with POS cashier / shop manager / admin permissions
		if ( current_user_can( 'edit_shop_orders' ) || current_user_can( 'manage_woocommerce' ) || current_user_can( 'read' ) ) {
			return true;
		}

		// Also check WP Nonce header (X-WP-Nonce)
		$nonce = $request->get_header( 'x_wp_nonce' );
		if ( $nonce && wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return true;
		}

		return new WP_Error( 'pos_forbidden', __( 'Access denied. Please log in.', 'omni-pos' ), array( 'status' => 403 ) );
	}

	/**
	 * Register all POS endpoints
	 */
	public static function register_routes() {
		// 1. Initial POS Configuration & Metadata
		register_rest_route( self::NAMESPACE, '/init', array(
			'methods'             => 'GET',
			'callback'            => array( __CLASS__, 'get_init_data' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 2. Fast Bulk Products List (Supports Delta Sync & Pagination)
		register_rest_route( self::NAMESPACE, '/products', array(
			'methods'             => 'GET',
			'callback'            => array( __CLASS__, 'get_products' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 3. Fast Categories List
		register_rest_route( self::NAMESPACE, '/categories', array(
			'methods'             => 'GET',
			'callback'            => array( __CLASS__, 'get_categories' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 4. Customers Search & List
		register_rest_route( self::NAMESPACE, '/customers', array(
			'methods'             => 'GET',
			'callback'            => array( __CLASS__, 'get_customers' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 5. Quick Customer Create
		register_rest_route( self::NAMESPACE, '/customers', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'create_customer' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 6. Fast Order Creation
		register_rest_route( self::NAMESPACE, '/orders', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'create_order' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 7. Recent Orders List (For receipt reprint & daily history)
		register_rest_route( self::NAMESPACE, '/orders', array(
			'methods'             => 'GET',
			'callback'            => array( __CLASS__, 'get_orders' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 8. Direct Real-time Barcode / SKU Lookup Fallback
		register_rest_route( self::NAMESPACE, '/barcode-lookup', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'barcode_lookup' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );
	}

	/**
	 * GET /omni-pos/v1/init
	 */
	public static function get_init_data( $request ) {
		return rest_ensure_response( Omni_POS_Helper::get_pos_init_data() );
	}

	/**
	 * GET /omni-pos/v1/products
	 * Returns optimized lightweight product catalogue with delta sync
	 */
	public static function get_products( $request ) {
		$page          = (int) $request->get_param( 'page' ) ?: 1;
		$per_page      = (int) $request->get_param( 'per_page' ) ?: 500;
		$updated_after = $request->get_param( 'updated_after' );

		$args = array(
			'status'   => 'publish',
			'limit'    => $per_page,
			'page'     => $page,
			'paginate' => true,
			'orderby'  => 'date',
			'order'    => 'DESC',
		);

		if ( ! empty( $updated_after ) ) {
			$args['date_modified'] = '>' . gmdate( 'Y-m-d H:i:s', (int) $updated_after );
		}

		$results = wc_get_products( $args );
		$products_data = array();

		foreach ( $results->products as $product ) {
			$products_data[] = Omni_POS_Helper::format_lean_product( $product );
		}

		$response = rest_ensure_response( array(
			'products'     => $products_data,
			'total'        => $results->total,
			'total_pages'  => $results->max_num_pages,
		) );

		return $response;
	}

	/**
	 * GET /omni-pos/v1/categories
	 * Lean categories list
	 */
	public static function get_categories( $request ) {
		$terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
		) );

		$categories = array();
		if ( ! empty( $terms ) && ! is_wp_error( $terms ) ) {
			foreach ( $terms as $term ) {
				$categories[] = array(
					'id'     => $term->term_id,
					'name'   => $term->name,
					'slug'   => $term->slug,
					'parent' => $term->parent,
					'count'  => (int) $term->count,
				);
			}
		}

		return rest_ensure_response( $categories );
	}

	/**
	 * GET /omni-pos/v1/customers
	 * Search customers
	 */
	public static function get_customers( $request ) {
		$search = sanitize_text_field( $request->get_param( 'search' ) );

		$args = array(
			'role__in' => array( 'customer', 'subscriber' ),
			'number'   => 30,
			'search'   => $search ? '*' . $search . '*' : '',
			'fields'   => 'all',
		);

		$users = get_users( $args );
		$customers = array(
			array(
				'id'         => 0,
				'name'       => __( 'Walk-in Customer (Guest)', 'omni-pos' ),
				'email'      => '',
				'phone'      => '',
				'first_name' => 'Walk-in',
				'last_name'  => 'Customer',
			),
		);

		foreach ( $users as $u ) {
			$first_name = get_user_meta( $u->ID, 'first_name', true ) ?: $u->display_name;
			$last_name  = get_user_meta( $u->ID, 'last_name', true );
			$phone      = get_user_meta( $u->ID, 'billing_phone', true );

			$customers[] = array(
				'id'         => $u->ID,
				'name'       => trim( $first_name . ' ' . $last_name ),
				'email'      => $u->user_email,
				'phone'      => $phone,
				'first_name' => $first_name,
				'last_name'  => $last_name,
			);
		}

		return rest_ensure_response( $customers );
	}

	/**
	 * POST /omni-pos/v1/customers
	 * Fast customer quick-register
	 */
	public static function create_customer( $request ) {
		$params = $request->get_json_params();

		$first_name = sanitize_text_field( $params['first_name'] ?? '' );
		$last_name  = sanitize_text_field( $params['last_name'] ?? '' );
		$phone      = sanitize_text_field( $params['phone'] ?? '' );
		$email      = sanitize_email( $params['email'] ?? '' );

		if ( empty( $first_name ) && empty( $phone ) ) {
			return new WP_Error( 'missing_field', __( 'First name or phone is required.', 'omni-pos' ), array( 'status' => 400 ) );
		}

		if ( empty( $email ) ) {
			$username = 'cust_' . ( $phone ?: time() );
			$email    = $username . '@pos-guest.local';
		} else {
			$username = $email;
		}

		$password = wp_generate_password( 16, false );
		$user_id  = wp_create_user( $username, $password, $email );

		if ( is_wp_error( $user_id ) ) {
			$existing = get_user_by( 'email', $email );
			if ( $existing ) {
				$user_id = $existing->ID;
			} else {
				return $user_id;
			}
		}

		update_user_meta( $user_id, 'first_name', $first_name );
		update_user_meta( $user_id, 'last_name', $last_name );
		update_user_meta( $user_id, 'billing_first_name', $first_name );
		update_user_meta( $user_id, 'billing_last_name', $last_name );
		update_user_meta( $user_id, 'billing_phone', $phone );

		$user = new WP_User( $user_id );
		$user->set_role( 'customer' );

		return rest_ensure_response( array(
			'id'         => $user_id,
			'name'       => trim( $first_name . ' ' . $last_name ),
			'email'      => $email,
			'phone'      => $phone,
			'first_name' => $first_name,
			'last_name'  => $last_name,
		) );
	}

	/**
	 * POST /omni-pos/v1/orders
	 * Ultra-fast order creation with stock management and receipt data response
	 */
	public static function create_order( $request ) {
		$params = $request->get_json_params();

		if ( empty( $params['items'] ) || ! is_array( $params['items'] ) ) {
			return new WP_Error( 'empty_cart', __( 'Cart is empty.', 'omni-pos' ), array( 'status' => 400 ) );
		}

		try {
			$order = wc_create_order();

			$customer_id = ! empty( $params['customer_id'] ) ? (int) $params['customer_id'] : 0;
			if ( $customer_id > 0 ) {
				$order->set_customer_id( $customer_id );
				$customer = new WC_Customer( $customer_id );
				$order->set_billing_first_name( $customer->get_first_name() );
				$order->set_billing_last_name( $customer->get_last_name() );
				$order->set_billing_phone( $customer->get_billing_phone() );
				$order->set_billing_email( $customer->get_email() );
			} else {
				$order->set_billing_first_name( 'POS' );
				$order->set_billing_last_name( 'Guest' );
			}

			// Add Line Items
			foreach ( $params['items'] as $item ) {
				$product_id = (int) ( $item['variation_id'] ?: $item['id'] );
				$product = wc_get_product( $product_id );
				if ( ! $product ) {
					continue;
				}

				$qty = isset( $item['quantity'] ) ? (float) $item['quantity'] : 1;
				$custom_price = isset( $item['custom_price'] ) ? (float) $item['custom_price'] : null;

				$item_id = $order->add_product( $product, $qty, array(
					'subtotal' => $custom_price !== null ? $custom_price * $qty : null,
					'total'    => $custom_price !== null ? $custom_price * $qty : null,
				) );
			}

			// Apply Discount if exists
			if ( ! empty( $params['discount_amount'] ) && (float) $params['discount_amount'] > 0 ) {
				$discount = new WC_Order_Item_Fee();
				$discount->set_name( __( 'POS Discount', 'omni-pos' ) );
				$discount->set_amount( -1 * abs( (float) $params['discount_amount'] ) );
				$discount->set_total( -1 * abs( (float) $params['discount_amount'] ) );
				$order->add_item( $discount );
			}

			// Payment details
			$payment_method = sanitize_text_field( $params['payment_method'] ?: 'cash' );
			$payment_title  = '';

			$all_gateways = ( function_exists( 'WC' ) && WC()->payment_gateways() ) ? WC()->payment_gateways()->payment_gateways() : array();
			
			if ( isset( $all_gateways[ $payment_method ] ) ) {
				$order->set_payment_method( $all_gateways[ $payment_method ] );
				$payment_title = $all_gateways[ $payment_method ]->get_title() ?: $all_gateways[ $payment_method ]->get_method_title();
			} elseif ( isset( $all_gateways[ 'omni_pos_' . $payment_method ] ) ) {
				$order->set_payment_method( $all_gateways[ 'omni_pos_' . $payment_method ] );
				$payment_title = $all_gateways[ 'omni_pos_' . $payment_method ]->get_title();
			} else {
				$payment_title = $payment_method === 'card' ? __( 'Credit / Debit Card (POS)', 'omni-pos' ) : ( $payment_method === 'split' ? __( 'Split Payment', 'omni-pos' ) : __( 'Cash', 'omni-pos' ) );
				$order->set_payment_method( 'omni_pos_' . $payment_method );
				$order->set_payment_method_title( $payment_title );
			}

			// Custom POS metadata
			$current_user = wp_get_current_user();
			$order->update_meta_data( '_omni_pos_order', 'yes' );
			$order->update_meta_data( '_omni_pos_cashier_id', $current_user->ID );
			$order->update_meta_data( '_omni_pos_cashier_name', $current_user->display_name ?: $current_user->user_login );
			
			if ( isset( $params['tendered_cash'] ) ) {
				$order->update_meta_data( '_omni_pos_tendered_cash', (float) $params['tendered_cash'] );
			}
			if ( isset( $params['change_due'] ) ) {
				$order->update_meta_data( '_omni_pos_change_due', (float) $params['change_due'] );
			}
			if ( isset( $params['split_details'] ) ) {
				$order->update_meta_data( '_omni_pos_split_details', $params['split_details'] );
			}
			if ( ! empty( $params['note'] ) ) {
				$order->set_customer_note( sanitize_textarea_field( $params['note'] ) );
			}

			// Calculate totals and reduce stock
			$order->calculate_totals();
			$order->update_status( 'completed', __( 'Order completed via Omni POS', 'omni-pos' ) );

			// Format receipt payload
			$receipt_data = array(
				'order_id'       => $order->get_id(),
				'order_number'   => $order->get_order_number(),
				'date'           => $order->get_date_created() ? $order->get_date_created()->date_i18n( 'Y-m-d H:i:s' ) : current_time( 'mysql' ),
				'cashier'        => $current_user->display_name ?: $current_user->user_login,
				'customer_name'  => $customer_id > 0 ? $order->get_formatted_billing_full_name() : __( 'Guest', 'omni-pos' ),
				'payment_method' => $payment_title,
				'items'          => array(),
				'subtotal'       => (float) $order->get_subtotal(),
				'discount'       => (float) $params['discount_amount'] ?? 0,
				'tax'            => (float) $order->get_total_tax(),
				'total'          => (float) $order->get_total(),
				'tendered'       => (float) ( $params['tendered_cash'] ?? $order->get_total() ),
				'change'         => (float) ( $params['change_due'] ?? 0 ),
			);

			foreach ( $order->get_items() as $line_item ) {
				$receipt_data['items'][] = array(
					'name'  => $line_item->get_name(),
					'qty'   => (float) $line_item->get_quantity(),
					'price' => (float) ( $line_item->get_total() / max( 1, $line_item->get_quantity() ) ),
					'total' => (float) $line_item->get_total(),
				);
			}

			return rest_ensure_response( array(
				'success'  => true,
				'order_id' => $order->get_id(),
				'receipt'  => $receipt_data,
			) );

		} catch ( Exception $e ) {
			return new WP_Error( 'order_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * GET /omni-pos/v1/orders
	 * Recent POS orders history
	 */
	public static function get_orders( $request ) {
		$page     = max( 1, (int) $request->get_param( 'page' ) );
		$per_page = min( 50, max( 5, (int) $request->get_param( 'per_page' ) ?: 20 ) );

		$orders_result = wc_get_orders( array(
			'limit'    => $per_page,
			'page'     => $page,
			'paginate' => true,
			'orderby'  => 'date',
			'order'    => 'DESC',
		) );

		$orders_data = array();
		foreach ( $orders_result->orders as $order ) {
			$orders_data[] = array(
				'id'             => $order->get_id(),
				'order_number'   => $order->get_order_number(),
				'date'           => $order->get_date_created() ? $order->get_date_created()->date_i18n( 'Y-m-d H:i' ) : '',
				'customer_name'  => $order->get_formatted_billing_full_name() ?: __( 'Guest', 'omni-pos' ),
				'total'          => (float) $order->get_total(),
				'status'         => $order->get_status(),
				'payment_method' => $order->get_payment_method_title(),
				'items_count'    => $order->get_item_count(),
			);
		}

		return rest_ensure_response( array(
			'orders'      => $orders_data,
			'total'       => $orders_result->total,
			'total_pages' => $orders_result->max_num_pages,
		) );
	}

	/**
	 * POST /omni-pos/v1/barcode-lookup
	 * Fallback endpoint to quickly look up product by barcode
	 */
	public static function barcode_lookup( $request ) {
		$barcode = sanitize_text_field( $request->get_param( 'barcode' ) );
		if ( empty( $barcode ) ) {
			return new WP_Error( 'missing_barcode', __( 'Barcode is empty.', 'omni-pos' ), array( 'status' => 400 ) );
		}

		$product_id = Omni_POS_Helper::find_product_id_by_barcode( $barcode );

		if ( $product_id > 0 ) {
			$product = wc_get_product( $product_id );
			if ( $product && $product->exists() ) {
				return rest_ensure_response( Omni_POS_Helper::format_lean_product( $product ) );
			}
		}

		return new WP_Error( 'not_found', __( 'Product not found with this barcode.', 'omni-pos' ), array( 'status' => 404 ) );
	}
}
