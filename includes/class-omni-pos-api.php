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
	 * Permission check for Admin requests (Manage WooCommerce / Shop Manager / Admin)
	 */
	public static function check_admin_permission( $request ) {
		if ( current_user_can( 'manage_woocommerce' ) || current_user_can( 'manage_options' ) ) {
			return true;
		}

		$nonce = $request->get_header( 'x_wp_nonce' );
		if ( $nonce && wp_verify_nonce( $nonce, 'wp_rest' ) && ( current_user_can( 'manage_woocommerce' ) || current_user_can( 'manage_options' ) ) ) {
			return true;
		}

		return new WP_Error( 'admin_forbidden', __( 'Administrator or Shop Manager permissions required.', 'omni-pos' ), array( 'status' => 403 ) );
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

		// 7. Orders List (Supports Search, Date Filter, Status Filter & Pagination)
		register_rest_route( self::NAMESPACE, '/orders', array(
			'methods'             => 'GET',
			'callback'            => array( __CLASS__, 'get_orders' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 8. Single Order Detail, Update, and Delete
		register_rest_route( self::NAMESPACE, '/orders/(?P<id>\d+)', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'get_single_order' ),
				'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
			),
			array(
				'methods'             => 'PUT',
				'callback'            => array( __CLASS__, 'update_order' ),
				'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
			),
			array(
				'methods'             => 'DELETE',
				'callback'            => array( __CLASS__, 'delete_order' ),
				'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
			),
		) );

		// 9. Direct Real-time Barcode / SKU Lookup Fallback
		register_rest_route( self::NAMESPACE, '/barcode-lookup', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'barcode_lookup' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 9. Admin Dashboard KPI Stats
		register_rest_route( self::NAMESPACE, '/admin/dashboard', array(
			'methods'             => 'GET',
			'callback'            => array( __CLASS__, 'get_admin_dashboard' ),
			'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
		) );

		// 10. Admin Settings (Get / Update)
		register_rest_route( self::NAMESPACE, '/admin/settings', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'get_admin_settings' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'update_admin_settings' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
		) );

		// 11. Admin Products List & Create
		register_rest_route( self::NAMESPACE, '/admin/products', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'admin_get_products' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'admin_create_product' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
		) );

		// 12. Admin Single Product Get, Update, Delete
		register_rest_route( self::NAMESPACE, '/admin/products/(?P<id>\d+)', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'admin_get_single_product' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
			array(
				'methods'             => 'PUT',
				'callback'            => array( __CLASS__, 'admin_update_product' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
			array(
				'methods'             => 'DELETE',
				'callback'            => array( __CLASS__, 'admin_delete_product' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
		) );

		// 13. Admin Quick Stock Adjustment (+/- or exact)
		register_rest_route( self::NAMESPACE, '/admin/products/(?P<id>\d+)/stock', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'admin_adjust_stock' ),
			'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
		) );

		// 14. Admin Generate Unique Barcode
		register_rest_route( self::NAMESPACE, '/admin/generate-barcode', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'admin_generate_barcode' ),
			'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
		) );

		// 15. Shift Current Status & Stats
		register_rest_route( self::NAMESPACE, '/shifts/current', array(
			'methods'             => 'GET',
			'callback'            => array( __CLASS__, 'get_current_shift' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 16. Open Shift
		register_rest_route( self::NAMESPACE, '/shifts/open', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'open_shift' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 17. Close Shift
		register_rest_route( self::NAMESPACE, '/shifts/close', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'close_shift' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 18. Cash In / Cash Out (Pay in / Pay out)
		register_rest_route( self::NAMESPACE, '/shifts/cash-movement', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'cash_movement' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 19. Shifts History
		register_rest_route( self::NAMESPACE, '/shifts/history', array(
			'methods'             => 'GET',
			'callback'            => array( __CLASS__, 'get_shift_history' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 20. Admin Cashiers List & Create
		register_rest_route( self::NAMESPACE, '/admin/cashiers', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'admin_get_cashiers' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'admin_create_cashier' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
		) );

		// 21. Admin Cashier Update
		register_rest_route( self::NAMESPACE, '/admin/cashiers/(?P<id>\d+)', array(
			'methods'             => 'PUT',
			'callback'            => array( __CLASS__, 'admin_update_cashier' ),
			'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
		) );

		// 22. Quick Cashier Switch & PIN Verify
		register_rest_route( self::NAMESPACE, '/cashiers/verify-pin', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'verify_cashier_pin' ),
			'permission_callback' => array( __CLASS__, 'check_pos_permission' ),
		) );

		// 23. Admin Sales Analytics & Reports
		register_rest_route( self::NAMESPACE, '/admin/reports', array(
			'methods'             => 'GET',
			'callback'            => array( __CLASS__, 'admin_get_reports' ),
			'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
		) );

		// 24. Admin Customers List & Create
		register_rest_route( self::NAMESPACE, '/admin/customers', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'admin_get_customers' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'admin_create_customer' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
		) );

		// 25. Admin Customer Details & Update
		register_rest_route( self::NAMESPACE, '/admin/customers/(?P<id>\d+)', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'admin_get_customer_detail' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
			array(
				'methods'             => 'PUT',
				'callback'            => array( __CLASS__, 'admin_update_customer' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
		) );

		// 26. Admin Suppliers List & Create
		register_rest_route( self::NAMESPACE, '/admin/suppliers', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'admin_get_suppliers' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'admin_create_supplier' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
		) );

		// 27. Admin Supplier Single Detail, Update, Delete
		register_rest_route( self::NAMESPACE, '/admin/suppliers/(?P<id>\d+)', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'admin_get_single_supplier' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
			array(
				'methods'             => 'PUT',
				'callback'            => array( __CLASS__, 'admin_update_supplier' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
			array(
				'methods'             => 'DELETE',
				'callback'            => array( __CLASS__, 'admin_delete_supplier' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
		) );

		// 28. Admin Purchases / Distribution List & Create
		register_rest_route( self::NAMESPACE, '/admin/purchases', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'admin_get_purchases' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'admin_create_purchase' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
		) );

		// 29. Admin Purchase / Distribution Single Detail, Update, Delete
		register_rest_route( self::NAMESPACE, '/admin/purchases/(?P<id>\d+)', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'admin_get_single_purchase' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
			array(
				'methods'             => 'PUT',
				'callback'            => array( __CLASS__, 'admin_update_purchase' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
			array(
				'methods'             => 'DELETE',
				'callback'            => array( __CLASS__, 'admin_delete_purchase' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
		) );

		// 30. Admin Migration Data Import
		register_rest_route( self::NAMESPACE, '/admin/import', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'admin_import_data' ),
			'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
		) );

		// 31. Admin Translation Strings & Language Settings
		register_rest_route( self::NAMESPACE, '/admin/translations', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'admin_get_translations' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'admin_save_translations' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
			),
		) );

		// 32. Admin Translation Codebase Scanner
		register_rest_route( self::NAMESPACE, '/admin/translations/scan', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'admin_scan_translations' ),
			'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
		) );

		// 33. Admin Auto-Translate Engine
		register_rest_route( self::NAMESPACE, '/admin/translations/auto-translate', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'admin_auto_translate' ),
			'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
		) );

		// 34. Admin User-Defined Custom Strings
		register_rest_route( self::NAMESPACE, '/admin/translations/custom-string', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'admin_add_custom_string' ),
			'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
		) );

		register_rest_route( self::NAMESPACE, '/admin/translations/custom-string/(?P<key>[a-zA-Z0-9_\-]+)', array(
			'methods'             => 'DELETE',
			'callback'            => array( __CLASS__, 'admin_delete_custom_string' ),
			'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
		) );

		// 35. Admin Unified Bulk Deletion
		register_rest_route( self::NAMESPACE, '/admin/bulk-delete', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'admin_bulk_delete' ),
			'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
		) );

		// 36. Admin GitHub Updates (Check, Settings, 1-Click Install)
		register_rest_route( self::NAMESPACE, '/admin/updates/check', array(
			'methods'             => 'GET',
			'callback'            => array( __CLASS__, 'admin_check_updates' ),
			'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
		) );

		register_rest_route( self::NAMESPACE, '/admin/updates/settings', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'admin_save_update_settings' ),
			'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
		) );

		register_rest_route( self::NAMESPACE, '/admin/updates/install', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'admin_install_update' ),
			'permission_callback' => array( __CLASS__, 'check_admin_permission' ),
		) );

		// 37. Chrome Extension 1-Click Direct Zip Package Download
		register_rest_route( self::NAMESPACE, '/admin/extension/download', array(
			'methods'             => 'GET',
			'callback'            => array( __CLASS__, 'admin_download_extension_zip' ),
			'permission_callback' => '__return_true',
		) );
	}

	/**
	 * GET /omni-pos/v1/init
	 */
	public static function get_init_data( $request ) {
		try {
			return rest_ensure_response( Omni_POS_Helper::get_pos_init_data() );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'init_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * GET /omni-pos/v1/products
	 * Returns ultra-fast batch product catalogue with delta sync
	 */
	public static function get_products( $request ) {
		try {
			$page          = (int) $request->get_param( 'page' ) ?: 1;
			$per_page      = (int) $request->get_param( 'per_page' ) ?: 500;
			$updated_after = $request->get_param( 'updated_after' );

			$results = Omni_POS_Helper::get_fast_lean_products( $page, $per_page, $updated_after );

			return rest_ensure_response( $results );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'products_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
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
					'name'   => html_entity_decode( $term->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
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
				$product_id = ! empty( $item['variation_id'] ) ? (int) $item['variation_id'] : (int) $item['id'];
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
			$payment_method = sanitize_text_field( ! empty( $params['payment_method'] ) ? $params['payment_method'] : 'cash' );
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

			// Suppress WooCommerce customer transactional emails during POS walk-in checkout
			add_filter( 'woocommerce_email_enabled_customer_completed_order', '__return_false', 999 );
			add_filter( 'woocommerce_email_enabled_new_order', '__return_false', 999 );
			add_filter( 'woocommerce_email_enabled_customer_processing_order', '__return_false', 999 );

			// Calculate totals and complete order
			$order->calculate_totals();
			$order->update_status( 'completed', __( 'Order completed via Omni POS', 'omni-pos' ) );

			// Remove temporary email suppression filters
			remove_filter( 'woocommerce_email_enabled_customer_completed_order', '__return_false', 999 );
			remove_filter( 'woocommerce_email_enabled_new_order', '__return_false', 999 );
			remove_filter( 'woocommerce_email_enabled_customer_processing_order', '__return_false', 999 );

			// Record sale into current active shift
			if ( class_exists( 'Omni_POS_Shifts' ) ) {
				Omni_POS_Shifts::record_order_sale( $order );
			}

			// Format receipt payload
			$receipt_data = array(
				'order_id'       => $order->get_id(),
				'order_number'   => $order->get_order_number(),
				'date'           => $order->get_date_created() ? $order->get_date_created()->date_i18n( 'Y-m-d H:i:s' ) : current_time( 'mysql' ),
				'cashier'        => $current_user->display_name ?: $current_user->user_login,
				'customer_name'  => $customer_id > 0 ? ( trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() ) ?: __( 'Customer', 'omni-pos' ) ) : __( 'Guest', 'omni-pos' ),
				'payment_method' => $payment_title,
				'items'          => array(),
				'subtotal'       => (float) $order->get_subtotal(),
				'discount'       => isset( $params['discount_amount'] ) ? (float) $params['discount_amount'] : 0,
				'tax'            => (float) $order->get_total_tax(),
				'total'          => (float) $order->get_total(),
				'tendered'       => isset( $params['tendered_cash'] ) ? (float) $params['tendered_cash'] : (float) $order->get_total(),
				'change'         => isset( $params['change_due'] ) ? (float) $params['change_due'] : 0,
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

		} catch ( \Throwable $e ) {
			return new WP_Error( 'order_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * GET /omni-pos/v1/orders
	 * Comprehensive POS sales & orders history with search, filtering and item details
	 */
	public static function get_orders( $request ) {
		try {
			$page     = max( 1, (int) $request->get_param( 'page' ) ?: 1 );
			$per_page = min( 100, max( 5, (int) $request->get_param( 'per_page' ) ?: 20 ) );
			$search   = sanitize_text_field( $request->get_param( 'search' ) ?: '' );
			$status   = sanitize_text_field( $request->get_param( 'status' ) ?: '' );
			$date_from = sanitize_text_field( $request->get_param( 'date_from' ) ?: '' );
			$date_to   = sanitize_text_field( $request->get_param( 'date_to' ) ?: '' );

			$query_args = array(
				'limit'    => $per_page,
				'page'     => $page,
				'paginate' => true,
				'orderby'  => 'date',
				'order'    => 'DESC',
			);

			if ( ! empty( $status ) && 'all' !== $status ) {
				$query_args['status'] = $status;
			}

			if ( ! empty( $date_from ) && ! empty( $date_to ) ) {
				$query_args['date_created'] = strtotime( $date_from . ' 00:00:00' ) . '...' . strtotime( $date_to . ' 23:59:59' );
			} elseif ( ! empty( $date_from ) ) {
				$query_args['date_created'] = '>=' . strtotime( $date_from . ' 00:00:00' );
			}

			if ( ! empty( $search ) ) {
				// If numeric, attempt to match order ID directly
				if ( is_numeric( $search ) ) {
					$query_args['post__in'] = array( (int) $search );
				} else {
					$query_args['search'] = $search;
				}
			}

			$orders_result = wc_get_orders( $query_args );

			$orders_data = array();
			$total_revenue = 0.0;

			if ( ! empty( $orders_result->orders ) ) {
				foreach ( $orders_result->orders as $order ) {
					$formatted = Omni_POS_Helper::format_order_detail( $order );
					$orders_data[] = $formatted;
					$total_revenue += (float) $formatted['total'];
				}
			}

			return rest_ensure_response( array(
				'orders'        => $orders_data,
				'total'         => $orders_result->total,
				'total_pages'   => $orders_result->max_num_pages,
				'total_revenue' => round( $total_revenue, 2 ),
				'page'          => $page,
				'per_page'      => $per_page,
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'orders_fetch_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * GET /omni-pos/v1/orders/{id}
	 * Get single order complete details for editing / receipt view
	 */
	public static function get_single_order( $request ) {
		$id = (int) $request->get_param( 'id' );
		$order = wc_get_order( $id );

		if ( ! $order ) {
			return new WP_Error( 'not_found', __( 'Order not found.', 'omni-pos' ), array( 'status' => 404 ) );
		}

		return rest_ensure_response( array(
			'success' => true,
			'order'   => Omni_POS_Helper::format_order_detail( $order ),
		) );
	}

	/**
	 * PUT /omni-pos/v1/orders/{id}
	 * Edit order line items, prices, discounts, and recalculate totals & inventory
	 */
	public static function update_order( $request ) {
		$id = (int) $request->get_param( 'id' );
		$order = wc_get_order( $id );

		if ( ! $order ) {
			return new WP_Error( 'not_found', __( 'Order not found.', 'omni-pos' ), array( 'status' => 404 ) );
		}

		$params = $request->get_json_params();

		try {
			// 1. Record original item quantities for inventory adjustment
			$orig_quantities = array();
			foreach ( $order->get_items() as $item_id => $item ) {
				$p_id = $item->get_variation_id() ?: $item->get_product_id();
				if ( $p_id > 0 ) {
					$orig_quantities[ $p_id ] = ( $orig_quantities[ $p_id ] ?? 0 ) + (float) $item->get_quantity();
				}
			}

			// 2. If updated items array is provided, replace order items
			if ( isset( $params['items'] ) && is_array( $params['items'] ) ) {
				// Remove existing line items
				foreach ( $order->get_items() as $item_id => $item ) {
					$order->remove_item( $item_id );
				}

				// Remove existing discount fee lines
				foreach ( $order->get_fees() as $fee_id => $fee ) {
					$order->remove_item( $fee_id );
				}

				$new_quantities = array();

				// Add new items
				foreach ( $params['items'] as $item ) {
					$product_id = ! empty( $item['variation_id'] ) ? (int) $item['variation_id'] : (int) ( $item['product_id'] ?? $item['id'] ?? 0 );
					$product    = $product_id > 0 ? wc_get_product( $product_id ) : null;
					$qty        = max( 0.01, (float) ( $item['quantity'] ?? 1 ) );
					$unit_price = isset( $item['unit_price'] ) ? (float) $item['unit_price'] : ( $product ? (float) $product->get_price() : 0 );

					if ( $product ) {
						$order->add_product( $product, $qty, array(
							'subtotal' => $unit_price * $qty,
							'total'    => $unit_price * $qty,
						) );
						$new_quantities[ $product_id ] = ( $new_quantities[ $product_id ] ?? 0 ) + $qty;
					} else {
						// Custom non-catalog product item
						$custom_item = new WC_Order_Item_Product();
						$custom_item->set_name( sanitize_text_field( $item['name'] ?? __( 'Custom Product', 'omni-pos' ) ) );
						$custom_item->set_quantity( $qty );
						$custom_item->set_subtotal( $unit_price * $qty );
						$custom_item->set_total( $unit_price * $qty );
						$order->add_item( $custom_item );
					}
				}

				// Adjust stock differences for physical inventory
				foreach ( $orig_quantities as $p_id => $old_qty ) {
					$new_qty = $new_quantities[ $p_id ] ?? 0;
					$diff = $old_qty - $new_qty;
					if ( $diff != 0 ) {
						$prod = wc_get_product( $p_id );
						if ( $prod && $prod->managing_stock() ) {
							wc_update_product_stock( $prod, $diff, 'increase' );
						}
					}
				}
				foreach ( $new_quantities as $p_id => $new_qty ) {
					if ( ! isset( $orig_quantities[ $p_id ] ) ) {
						$prod = wc_get_product( $p_id );
						if ( $prod && $prod->managing_stock() ) {
							wc_update_product_stock( $prod, $new_qty, 'decrease' );
						}
					}
				}
			}

			// 3. Discount adjustments
			if ( isset( $params['discount_amount'] ) ) {
				$discount_amount = abs( (float) $params['discount_amount'] );
				if ( $discount_amount > 0 ) {
					$discount_fee = new WC_Order_Item_Fee();
					$discount_fee->set_name( __( 'POS Discount', 'omni-pos' ) );
					$discount_fee->set_amount( -1 * $discount_amount );
					$discount_fee->set_total( -1 * $discount_amount );
					$order->add_item( $discount_fee );
				}
			}

			// 4. Update customer note if passed
			if ( isset( $params['note'] ) ) {
				$order->set_customer_note( sanitize_textarea_field( $params['note'] ) );
			}

			// 5. Update status if passed
			if ( ! empty( $params['status'] ) ) {
				$status = sanitize_key( $params['status'] );
				if ( in_array( $status, array( 'completed', 'processing', 'on-hold', 'cancelled', 'refunded', 'pending' ) ) ) {
					$order->set_status( $status );
				}
			}

			// Suppress emails during manual POS adjustments
			add_filter( 'woocommerce_email_enabled_customer_completed_order', '__return_false', 999 );
			add_filter( 'woocommerce_email_enabled_new_order', '__return_false', 999 );

			// Recalculate totals and save
			$order->calculate_totals();
			$order->save();

			remove_filter( 'woocommerce_email_enabled_customer_completed_order', '__return_false', 999 );
			remove_filter( 'woocommerce_email_enabled_new_order', '__return_false', 999 );

			$formatted = Omni_POS_Helper::format_order_detail( $order );

			return rest_ensure_response( array(
				'success' => true,
				'order'   => $formatted,
				'receipt' => array(
					'order_id'       => $order->get_id(),
					'order_number'   => $order->get_order_number(),
					'date'           => $order->get_date_created() ? $order->get_date_created()->date_i18n( 'Y-m-d H:i:s' ) : current_time( 'mysql' ),
					'cashier'        => $formatted['cashier_name'],
					'customer_name'  => $formatted['customer_name'],
					'payment_method' => $formatted['payment_title'],
					'items'          => array_map( function( $it ) {
						return array(
							'name'  => $it['name'],
							'qty'   => $it['quantity'],
							'price' => $it['unit_price'],
							'total' => $it['total'],
						);
					}, $formatted['items'] ),
					'subtotal'       => $formatted['subtotal'],
					'discount'       => $formatted['discount_total'],
					'tax'            => $formatted['tax_total'],
					'total'          => $formatted['total'],
					'tendered'       => $formatted['tendered_cash'],
					'change'         => $formatted['change_due'],
				),
				'message' => __( 'Order updated successfully.', 'omni-pos' ),
			) );

		} catch ( \Throwable $e ) {
			return new WP_Error( 'order_update_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * DELETE /omni-pos/v1/orders/{id}
	 * Delete or void order and restore inventory
	 */
	public static function delete_order( $request ) {
		$id = (int) $request->get_param( 'id' );
		$order = wc_get_order( $id );

		if ( ! $order ) {
			return new WP_Error( 'not_found', __( 'Order not found.', 'omni-pos' ), array( 'status' => 404 ) );
		}

		try {
			// Restock inventory for cancelled order
			foreach ( $order->get_items() as $item ) {
				$product = $item->get_product();
				if ( $product && $product->managing_stock() ) {
					wc_update_product_stock( $product, (float) $item->get_quantity(), 'increase' );
				}
			}

			$order->update_status( 'cancelled', __( 'Order cancelled & voided via Omni POS', 'omni-pos' ) );
			$order->delete( true );

			return rest_ensure_response( array(
				'success' => true,
				'message' => __( 'Order deleted and items restocked successfully.', 'omni-pos' ),
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'order_delete_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
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

	/**
	 * GET /omni-pos/v1/admin/dashboard
	 * Return aggregated KPI statistics for Admin Hub
	 */
	public static function get_admin_dashboard( $request ) {
		$stats = Omni_POS_Helper::get_admin_dashboard_stats();
		return rest_ensure_response( array(
			'success' => true,
			'stats'   => $stats,
		) );
	}

	/**
	 * GET /omni-pos/v1/admin/settings
	 * Retrieve all POS & Management settings
	 */
	public static function get_admin_settings( $request ) {
		$all_currencies = function_exists( 'get_woocommerce_currencies' ) ? get_woocommerce_currencies() : array();
		$available_currencies = array();
		foreach ( $all_currencies as $code => $name ) {
			$symbol = function_exists( 'get_woocommerce_currency_symbol' ) ? html_entity_decode( get_woocommerce_currency_symbol( $code ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) : $code;
			$available_currencies[] = array(
				'code'   => $code,
				'name'   => $name,
				'symbol' => $symbol,
			);
		}

		$currency_code = function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'GEL';
		$currency_symbol = function_exists( 'get_woocommerce_currency_symbol' ) ? html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) : '₾';

		$settings = array(
			'inventory_mode'       => get_option( 'omni_pos_inventory_mode', 'woocommerce' ),
			'currency'             => $currency_code,
			'currency_symbol'      => $currency_symbol,
			'currency_pos'         => get_option( 'woocommerce_currency_pos', 'right_space' ),
			'price_decimals'       => function_exists( 'wc_get_price_decimals' ) ? (int) wc_get_price_decimals() : 2,
			'price_decimal_sep'    => function_exists( 'wc_get_price_decimal_separator' ) ? wc_get_price_decimal_separator() : '.',
			'price_thousand_sep'   => function_exists( 'wc_get_price_thousand_separator' ) ? wc_get_price_thousand_separator() : ' ',
			'available_currencies' => $available_currencies,
			'store_phone'          => get_option( 'omni_pos_store_phone', '' ),
			'store_tax_id'         => get_option( 'omni_pos_store_tax_id', '' ),
			'receipt_header'       => get_option( 'omni_pos_receipt_header', __( "Thank you for your purchase!\nFast & Reliable Service", 'omni-pos' ) ),
			'receipt_footer'       => get_option( 'omni_pos_receipt_footer', __( 'Please keep this receipt for warranty and returns.', 'omni-pos' ) ),
			'auto_print'           => get_option( 'omni_pos_auto_print', 'no' ) === 'yes',
			'sound_effects'        => get_option( 'omni_pos_sound_effects', 'yes' ) === 'yes',
			'low_stock_threshold'  => (int) get_option( 'omni_pos_low_stock_threshold', 5 ),
			'enable_discounts'     => get_option( 'omni_pos_enable_discounts', 'yes' ) === 'yes',
			'enable_custom_price'  => get_option( 'omni_pos_enable_custom_price', 'yes' ) === 'yes',
			'receipt_printer'      => get_option( 'omni_pos_receipt_printer', '' ),
			'label_printer'        => get_option( 'omni_pos_label_printer', '' ),
			'cash_drawer_kick'     => get_option( 'omni_pos_cash_drawer_kick', 'yes' ) === 'yes',
			'auto_paper_cut'       => get_option( 'omni_pos_auto_paper_cut', 'yes' ) === 'yes',
			'silent_print'         => get_option( 'omni_pos_silent_print', 'yes' ) === 'yes',
		);

		$init_data = Omni_POS_Helper::get_pos_init_data();

		return rest_ensure_response( array(
			'success'  => true,
			'settings' => $settings,
			'store'    => isset( $init_data['store'] ) ? $init_data['store'] : null,
		) );
	}

	/**
	 * POST /omni-pos/v1/admin/settings
	 * Save POS & Management settings with strict sanitization
	 */
	public static function update_admin_settings( $request ) {
		$params = $request->get_json_params();

		if ( isset( $params['inventory_mode'] ) ) {
			$mode = sanitize_text_field( $params['inventory_mode'] );
			if ( in_array( $mode, array( 'woocommerce', 'omni_pos' ), true ) ) {
				update_option( 'omni_pos_inventory_mode', $mode );
			}
		}

		// WooCommerce Currency & Formatting Synchronization
		if ( ! empty( $params['currency'] ) ) {
			$currency = sanitize_text_field( $params['currency'] );
			update_option( 'woocommerce_currency', $currency );
		}

		if ( isset( $params['currency_pos'] ) ) {
			$pos = sanitize_text_field( $params['currency_pos'] );
			if ( in_array( $pos, array( 'left', 'right', 'left_space', 'right_space' ), true ) ) {
				update_option( 'woocommerce_currency_pos', $pos );
			}
		}

		if ( isset( $params['price_decimals'] ) ) {
			update_option( 'woocommerce_price_num_decimals', max( 0, min( 6, (int) $params['price_decimals'] ) ) );
		}

		if ( isset( $params['price_decimal_sep'] ) ) {
			update_option( 'woocommerce_price_decimal_sep', sanitize_text_field( $params['price_decimal_sep'] ) );
		}

		if ( isset( $params['price_thousand_sep'] ) ) {
			update_option( 'woocommerce_price_thousand_sep', (string) $params['price_thousand_sep'] );
		}

		if ( isset( $params['store_phone'] ) ) {
			update_option( 'omni_pos_store_phone', sanitize_text_field( $params['store_phone'] ) );
		}

		if ( isset( $params['store_tax_id'] ) ) {
			update_option( 'omni_pos_store_tax_id', sanitize_text_field( $params['store_tax_id'] ) );
		}

		if ( isset( $params['receipt_header'] ) ) {
			update_option( 'omni_pos_receipt_header', sanitize_textarea_field( $params['receipt_header'] ) );
		}

		if ( isset( $params['receipt_footer'] ) ) {
			update_option( 'omni_pos_receipt_footer', sanitize_textarea_field( $params['receipt_footer'] ) );
		}

		if ( isset( $params['auto_print'] ) ) {
			update_option( 'omni_pos_auto_print', ! empty( $params['auto_print'] ) ? 'yes' : 'no' );
		}

		if ( isset( $params['sound_effects'] ) ) {
			update_option( 'omni_pos_sound_effects', ! empty( $params['sound_effects'] ) ? 'yes' : 'no' );
		}

		if ( isset( $params['low_stock_threshold'] ) ) {
			update_option( 'omni_pos_low_stock_threshold', max( 1, (int) $params['low_stock_threshold'] ) );
		}

		if ( isset( $params['enable_discounts'] ) ) {
			update_option( 'omni_pos_enable_discounts', ! empty( $params['enable_discounts'] ) ? 'yes' : 'no' );
		}

		if ( isset( $params['enable_custom_price'] ) ) {
			update_option( 'omni_pos_enable_custom_price', ! empty( $params['enable_custom_price'] ) ? 'yes' : 'no' );
		}

		if ( isset( $params['receipt_printer'] ) ) {
			update_option( 'omni_pos_receipt_printer', sanitize_text_field( $params['receipt_printer'] ) );
		}

		if ( isset( $params['label_printer'] ) ) {
			update_option( 'omni_pos_label_printer', sanitize_text_field( $params['label_printer'] ) );
		}

		if ( isset( $params['cash_drawer_kick'] ) ) {
			update_option( 'omni_pos_cash_drawer_kick', ! empty( $params['cash_drawer_kick'] ) ? 'yes' : 'no' );
		}

		if ( isset( $params['auto_paper_cut'] ) ) {
			update_option( 'omni_pos_auto_paper_cut', ! empty( $params['auto_paper_cut'] ) ? 'yes' : 'no' );
		}

		if ( isset( $params['silent_print'] ) ) {
			update_option( 'omni_pos_silent_print', ! empty( $params['silent_print'] ) ? 'yes' : 'no' );
		}

		return self::get_admin_settings( $request );
	}

	/**
	 * GET /omni-pos/v1/admin/products
	 * Admin Product Management Search & Filtering
	 */
	public static function admin_get_products( $request ) {
		$page          = max( 1, (int) $request->get_param( 'page' ) ?: 1 );
		$per_page      = min( 100, max( 5, (int) $request->get_param( 'per_page' ) ?: 20 ) );
		$search        = sanitize_text_field( $request->get_param( 'search' ) ?: '' );
		$category_id   = (int) $request->get_param( 'category_id' ) ?: 0;
		$stock_filter  = sanitize_text_field( $request->get_param( 'stock_status' ) ?: 'all' );
		$orderby       = sanitize_key( $request->get_param( 'orderby' ) ?: 'date' );
		$order         = strtoupper( sanitize_key( $request->get_param( 'order' ) ?: 'DESC' ) );

		$args = array(
			'status'   => 'publish',
			'limit'    => $per_page,
			'page'     => $page,
			'paginate' => true,
			'orderby'  => in_array( $orderby, array( 'date', 'title', 'price', 'id' ), true ) ? $orderby : 'date',
			'order'    => in_array( $order, array( 'ASC', 'DESC' ), true ) ? $order : 'DESC',
		);

		if ( ! empty( $search ) ) {
			$args['s'] = $search;
		}

		if ( $category_id > 0 ) {
			$term = get_term( $category_id, 'product_cat' );
			if ( $term && ! is_wp_error( $term ) ) {
				$args['category'] = array( $term->slug );
			}
		}

		if ( 'instock' === $stock_filter ) {
			$args['stock_status'] = 'instock';
		} elseif ( 'outofstock' === $stock_filter ) {
			$args['stock_status'] = 'outofstock';
		}

		$results = wc_get_products( $args );
		$products_data = array();
		$low_stock_threshold = (int) get_option( 'omni_pos_low_stock_threshold', 5 );

		foreach ( $results->products as $product ) {
			$item = Omni_POS_Helper::format_lean_product( $product );
			
			// Check if stock filter is lowstock
			if ( 'lowstock' === $stock_filter ) {
				if ( ! ( $item['manage_stock'] && $item['stock_quantity'] <= $low_stock_threshold ) ) {
					continue;
				}
			}

			// Add wholesale / cost price if available
			$cost_price = get_post_meta( $product->get_id(), '_cost_price', true );
			if ( empty( $cost_price ) ) {
				$cost_price = get_post_meta( $product->get_id(), '_wc_cog_cost', true );
			}
			$item['cost_price'] = ! empty( $cost_price ) ? (float) $cost_price : null;

			$products_data[] = $item;
		}

		return rest_ensure_response( array(
			'success'     => true,
			'products'    => $products_data,
			'total'       => $results->total,
			'total_pages' => $results->max_num_pages,
			'page'        => $page,
		) );
	}

	/**
	 * GET /omni-pos/v1/admin/products/{id}
	 */
	public static function admin_get_single_product( $request ) {
		$id = (int) $request->get_param( 'id' );
		$product = wc_get_product( $id );
		if ( ! $product || ! $product->exists() ) {
			return new WP_Error( 'not_found', __( 'Product not found.', 'omni-pos' ), array( 'status' => 404 ) );
		}

		$data = Omni_POS_Helper::format_lean_product( $product );
		$cost_price = get_post_meta( $id, '_cost_price', true );
		$data['cost_price'] = ! empty( $cost_price ) ? (float) $cost_price : null;

		return rest_ensure_response( array(
			'success' => true,
			'product' => $data,
		) );
	}

	/**
	 * POST /omni-pos/v1/admin/products
	 * Create new product directly from Omni POS Admin
	 */
	public static function admin_create_product( $request ) {
		$params = $request->get_json_params();

		$name = sanitize_text_field( $params['name'] ?? '' );
		if ( empty( $name ) ) {
			return new WP_Error( 'missing_name', __( 'Product name is required.', 'omni-pos' ), array( 'status' => 400 ) );
		}

		try {
			$product = new WC_Product_Simple();
			$product->set_name( $name );
			$product->set_status( 'publish' );

			// Prices
			$regular_price = isset( $params['regular_price'] ) ? (float) $params['regular_price'] : (float) ( $params['price'] ?? 0 );
			$sale_price    = ! empty( $params['sale_price'] ) ? (float) $params['sale_price'] : '';
			
			$product->set_regular_price( $regular_price );
			if ( ! empty( $sale_price ) ) {
				$product->set_sale_price( $sale_price );
				$product->set_price( $sale_price );
			} else {
				$product->set_price( $regular_price );
			}

			// SKU
			if ( ! empty( $params['sku'] ) ) {
				$sku = sanitize_text_field( $params['sku'] );
				$product->set_sku( $sku );
			}

			// Manage Stock & Quantity
			$manage_stock = isset( $params['manage_stock'] ) ? (bool) $params['manage_stock'] : true;
			$product->set_manage_stock( $manage_stock );
			if ( $manage_stock ) {
				$stock_qty = isset( $params['stock_quantity'] ) ? (int) $params['stock_quantity'] : 0;
				$product->set_stock_quantity( $stock_qty );
				$product->set_stock_status( $stock_qty > 0 ? 'instock' : 'outofstock' );
			} else {
				$product->set_stock_status( 'instock' );
			}

			// Category
			if ( ! empty( $params['category_id'] ) ) {
				$product->set_category_ids( array( (int) $params['category_id'] ) );
			} elseif ( ! empty( $params['category_ids'] ) && is_array( $params['category_ids'] ) ) {
				$product->set_category_ids( array_map( 'absint', $params['category_ids'] ) );
			}

			$product_id = $product->save();

			// Barcode
			if ( ! empty( $params['barcode'] ) ) {
				$barcode = sanitize_text_field( $params['barcode'] );
				update_post_meta( $product_id, '_global_unique_id', $barcode );
				update_post_meta( $product_id, '_barcode', $barcode );
			}

			// Cost Price
			if ( isset( $params['cost_price'] ) && '' !== $params['cost_price'] ) {
				update_post_meta( $product_id, '_cost_price', (float) $params['cost_price'] );
			}

			$saved_product = wc_get_product( $product_id );
			return rest_ensure_response( array(
				'success' => true,
				'product' => Omni_POS_Helper::format_lean_product( $saved_product ),
				'message' => __( 'Product created successfully.', 'omni-pos' ),
			) );

		} catch ( Exception $e ) {
			return new WP_Error( 'product_create_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * PUT /omni-pos/v1/admin/products/{id}
	 * Update product details
	 */
	public static function admin_update_product( $request ) {
		$id = (int) $request->get_param( 'id' );
		$product = wc_get_product( $id );

		if ( ! $product || ! $product->exists() ) {
			return new WP_Error( 'not_found', __( 'Product not found.', 'omni-pos' ), array( 'status' => 404 ) );
		}

		$params = $request->get_json_params();

		try {
			if ( isset( $params['name'] ) && ! empty( $params['name'] ) ) {
				$product->set_name( sanitize_text_field( $params['name'] ) );
			}

			if ( isset( $params['regular_price'] ) ) {
				$reg = (float) $params['regular_price'];
				$product->set_regular_price( $reg );
				if ( empty( $params['sale_price'] ) ) {
					$product->set_price( $reg );
				}
			}

			if ( array_key_exists( 'sale_price', $params ) ) {
				$sale = ! empty( $params['sale_price'] ) ? (float) $params['sale_price'] : '';
				$product->set_sale_price( $sale );
				if ( ! empty( $sale ) ) {
					$product->set_price( $sale );
				}
			}

			if ( isset( $params['sku'] ) ) {
				$product->set_sku( sanitize_text_field( $params['sku'] ) );
			}

			if ( isset( $params['manage_stock'] ) ) {
				$product->set_manage_stock( (bool) $params['manage_stock'] );
			}

			if ( isset( $params['stock_quantity'] ) && $product->managing_stock() ) {
				$stock_qty = (int) $params['stock_quantity'];
				$product->set_stock_quantity( $stock_qty );
				$product->set_stock_status( $stock_qty > 0 ? 'instock' : 'outofstock' );
			}

			if ( isset( $params['category_id'] ) ) {
				$product->set_category_ids( array( (int) $params['category_id'] ) );
			} elseif ( isset( $params['category_ids'] ) && is_array( $params['category_ids'] ) ) {
				$product->set_category_ids( array_map( 'absint', $params['category_ids'] ) );
			}

			$product->save();

			// Barcode
			if ( isset( $params['barcode'] ) ) {
				$barcode = sanitize_text_field( $params['barcode'] );
				update_post_meta( $id, '_global_unique_id', $barcode );
				update_post_meta( $id, '_barcode', $barcode );
			}

			// Cost Price
			if ( array_key_exists( 'cost_price', $params ) ) {
				if ( '' !== $params['cost_price'] && null !== $params['cost_price'] ) {
					update_post_meta( $id, '_cost_price', (float) $params['cost_price'] );
				} else {
					delete_post_meta( $id, '_cost_price' );
				}
			}

			$updated_product = wc_get_product( $id );
			return rest_ensure_response( array(
				'success' => true,
				'product' => Omni_POS_Helper::format_lean_product( $updated_product ),
				'message' => __( 'Product updated successfully.', 'omni-pos' ),
			) );

		} catch ( Exception $e ) {
			return new WP_Error( 'product_update_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * DELETE /omni-pos/v1/admin/products/{id}
	 * Trash product
	 */
	public static function admin_delete_product( $request ) {
		$id = (int) $request->get_param( 'id' );
		$product = wc_get_product( $id );

		if ( ! $product || ! $product->exists() ) {
			return new WP_Error( 'not_found', __( 'Product not found.', 'omni-pos' ), array( 'status' => 404 ) );
		}

		$product->delete( false ); // Trash

		return rest_ensure_response( array(
			'success' => true,
			'id'      => $id,
			'message' => __( 'Product moved to trash.', 'omni-pos' ),
		) );
	}

	/**
	 * POST /omni-pos/v1/admin/products/{id}/stock
	 * Rapid Stock Adjustment (+/- or direct value)
	 */
	public static function admin_adjust_stock( $request ) {
		$id = (int) $request->get_param( 'id' );
		$product = wc_get_product( $id );

		if ( ! $product || ! $product->exists() ) {
			return new WP_Error( 'not_found', __( 'Product not found.', 'omni-pos' ), array( 'status' => 404 ) );
		}

		$params = $request->get_json_params();
		$action = sanitize_text_field( $params['action'] ?? 'set' ); // 'add', 'subtract', 'set'
		$amount = (int) ( $params['amount'] ?? 0 );

		if ( ! $product->managing_stock() ) {
			$product->set_manage_stock( true );
		}

		$current_stock = (int) $product->get_stock_quantity();
		$new_stock     = $current_stock;

		if ( 'add' === $action ) {
			$new_stock = $current_stock + $amount;
		} elseif ( 'subtract' === $action ) {
			$new_stock = max( 0, $current_stock - $amount );
		} else {
			$new_stock = $amount;
		}

		$product->set_stock_quantity( $new_stock );
		$product->set_stock_status( $new_stock > 0 ? 'instock' : 'outofstock' );
		$product->save();

		return rest_ensure_response( array(
			'success'        => true,
			'id'             => $id,
			'stock_quantity' => $new_stock,
			'in_stock'       => $new_stock > 0,
			'product'        => Omni_POS_Helper::format_lean_product( $product ),
		) );
	}

	/**
	 * POST /omni-pos/v1/admin/generate-barcode
	 * Generate a unique EAN-13 barcode with valid checksum
	 */
	public static function admin_generate_barcode( $request ) {
		$prefix = '20'; // In-store standard retail prefix
		$random = str_pad( (string) wp_rand( 1000000000, 9999999999 ), 10, '0', STR_PAD_LEFT );
		$code12 = $prefix . substr( $random, 0, 10 );

		// Calculate EAN-13 modulo-10 checksum
		$sum = 0;
		for ( $i = 0; $i < 12; $i++ ) {
			$digit = (int) $code12[ $i ];
			$sum += ( $i % 2 === 0 ) ? $digit : ( $digit * 3 );
		}
		$checksum = ( 10 - ( $sum % 10 ) ) % 10;
		$barcode = $code12 . $checksum;

		return rest_ensure_response( array(
			'success' => true,
			'barcode' => $barcode,
		) );
	}

	/**
	 * GET /omni-pos/v1/shifts/current
	 */
	public static function get_current_shift( $request ) {
		$user = wp_get_current_user();
		$shift = Omni_POS_Shifts::get_current_shift( $user->ID );
		$logs = $shift ? Omni_POS_Shifts::get_shift_logs( $shift->id ) : array();

		return rest_ensure_response( array(
			'success'   => true,
			'has_shift' => ! empty( $shift ),
			'shift'     => $shift,
			'logs'      => $logs,
		) );
	}

	/**
	 * POST /omni-pos/v1/shifts/open
	 */
	public static function open_shift( $request ) {
		$user   = wp_get_current_user();
		$params = $request->get_json_params();

		$opening_float = isset( $params['opening_float'] ) ? (float) $params['opening_float'] : 0.0;
		$notes         = sanitize_textarea_field( $params['notes'] ?? '' );
		$cashier_name  = $user->display_name ?: $user->user_login;

		$shift = Omni_POS_Shifts::open_shift( $user->ID, $cashier_name, $opening_float, $notes );

		return rest_ensure_response( array(
			'success' => true,
			'shift'   => $shift,
			'message' => __( 'Register shift opened successfully.', 'omni-pos' ),
		) );
	}

	/**
	 * POST /omni-pos/v1/shifts/close
	 */
	public static function close_shift( $request ) {
		$user   = wp_get_current_user();
		$params = $request->get_json_params();

		$shift_id     = (int) ( $params['shift_id'] ?? 0 );
		$counted_cash = (float) ( $params['counted_cash'] ?? 0.0 );
		$notes        = sanitize_textarea_field( $params['notes'] ?? '' );

		if ( ! $shift_id ) {
			$current = Omni_POS_Shifts::get_current_shift( $user->ID );
			if ( $current ) {
				$shift_id = $current->id;
			}
		}

		if ( ! $shift_id ) {
			return new WP_Error( 'no_shift', __( 'No active shift found to close.', 'omni-pos' ), array( 'status' => 400 ) );
		}

		$closed_shift = Omni_POS_Shifts::close_shift( $shift_id, $counted_cash, $notes );

		if ( ! $closed_shift ) {
			return new WP_Error( 'close_failed', __( 'Could not close register shift.', 'omni-pos' ), array( 'status' => 500 ) );
		}

		return rest_ensure_response( array(
			'success' => true,
			'shift'   => $closed_shift,
			'message' => __( 'Register shift closed. Z-Report generated.', 'omni-pos' ),
		) );
	}

	/**
	 * POST /omni-pos/v1/shifts/cash-movement
	 */
	public static function cash_movement( $request ) {
		$user   = wp_get_current_user();
		$params = $request->get_json_params();

		$type   = sanitize_key( $params['type'] ?? 'in' ); // 'in' or 'out'
		$amount = abs( (float) ( $params['amount'] ?? 0.0 ) );
		$reason = sanitize_textarea_field( $params['reason'] ?? '' );

		if ( $amount <= 0 ) {
			return new WP_Error( 'invalid_amount', __( 'Amount must be greater than 0.', 'omni-pos' ), array( 'status' => 400 ) );
		}

		$shift = Omni_POS_Shifts::get_current_shift( $user->ID );
		if ( ! $shift ) {
			return new WP_Error( 'no_shift', __( 'Please open a shift before recording cash movements.', 'omni-pos' ), array( 'status' => 400 ) );
		}

		$cashier_name = $user->display_name ?: $user->user_login;
		Omni_POS_Shifts::add_cash_movement( $shift->id, $user->ID, $cashier_name, $type, $amount, $reason );

		$updated_shift = Omni_POS_Shifts::get_current_shift( $user->ID );
		$logs          = Omni_POS_Shifts::get_shift_logs( $shift->id );

		return rest_ensure_response( array(
			'success' => true,
			'shift'   => $updated_shift,
			'logs'    => $logs,
			'message' => __( 'Cash transaction logged successfully.', 'omni-pos' ),
		) );
	}

	/**
	 * GET /omni-pos/v1/shifts/history
	 */
	public static function get_shift_history( $request ) {
		$page     = max( 1, (int) $request->get_param( 'page' ) ?: 1 );
		$per_page = min( 50, max( 5, (int) $request->get_param( 'per_page' ) ?: 15 ) );

		$history = Omni_POS_Shifts::get_shift_history( $page, $per_page );

		return rest_ensure_response( array(
			'success'     => true,
			'shifts'      => $history['shifts'],
			'total'       => $history['total'],
			'total_pages' => $history['total_pages'],
			'page'        => $page,
		) );
	}

	/**
	 * GET /omni-pos/v1/admin/cashiers
	 */
	public static function admin_get_cashiers( $request ) {
		$args = array(
			'role__in' => array( 'administrator', 'shop_manager', 'omni_pos_cashier' ),
			'fields'   => 'all',
		);

		$users = get_users( $args );
		$cashiers = array();

		foreach ( $users as $u ) {
			$pin = get_user_meta( $u->ID, '_omni_pos_pin', true );
			$max_discount = get_user_meta( $u->ID, '_omni_pos_max_discount', true );
			$can_refund   = get_user_meta( $u->ID, '_omni_pos_can_refund', true );

			$cashiers[] = array(
				'id'           => $u->ID,
				'username'     => $u->user_login,
				'name'         => $u->display_name ?: $u->user_login,
				'email'        => $u->user_email,
				'roles'        => $u->roles,
				'is_admin'     => in_array( 'administrator', $u->roles, true ) || in_array( 'shop_manager', $u->roles, true ),
				'has_pin'      => ! empty( $pin ),
				'max_discount' => '' !== $max_discount ? (float) $max_discount : 100,
				'can_refund'   => 'no' !== $can_refund,
			);
		}

		return rest_ensure_response( array(
			'success'  => true,
			'cashiers' => $cashiers,
		) );
	}

	/**
	 * POST /omni-pos/v1/admin/cashiers
	 */
	public static function admin_create_cashier( $request ) {
		$params = $request->get_json_params();

		$username     = sanitize_user( $params['username'] ?? '' );
		$display_name = sanitize_text_field( $params['name'] ?? '' );
		$email        = sanitize_email( $params['email'] ?? '' );
		$pin          = sanitize_text_field( $params['pin'] ?? '' );
		$max_discount = isset( $params['max_discount'] ) ? (float) $params['max_discount'] : 100;
		$can_refund   = ! empty( $params['can_refund'] ) ? 'yes' : 'no';

		if ( empty( $username ) ) {
			return new WP_Error( 'missing_username', __( 'Username is required.', 'omni-pos' ), array( 'status' => 400 ) );
		}

		if ( empty( $email ) ) {
			$email = $username . '@omni-pos.local';
		}

		$password = wp_generate_password( 16, true );
		$user_id  = wp_create_user( $username, $password, $email );

		if ( is_wp_error( $user_id ) ) {
			return $user_id;
		}

		$user = new WP_User( $user_id );
		$user->set_role( 'omni_pos_cashier' );

		if ( ! empty( $display_name ) ) {
			wp_update_user( array(
				'ID'           => $user_id,
				'display_name' => $display_name,
			) );
		}

		if ( ! empty( $pin ) ) {
			update_user_meta( $user_id, '_omni_pos_pin', wp_hash_password( $pin ) );
		}

		update_user_meta( $user_id, '_omni_pos_max_discount', $max_discount );
		update_user_meta( $user_id, '_omni_pos_can_refund', $can_refund );

		return self::admin_get_cashiers( $request );
	}

	/**
	 * PUT /omni-pos/v1/admin/cashiers/{id}
	 */
	public static function admin_update_cashier( $request ) {
		$id     = (int) $request->get_param( 'id' );
		$params = $request->get_json_params();

		$user = get_user_by( 'id', $id );
		if ( ! $user ) {
			return new WP_Error( 'not_found', __( 'Cashier not found.', 'omni-pos' ), array( 'status' => 404 ) );
		}

		if ( isset( $params['name'] ) ) {
			wp_update_user( array(
				'ID'           => $id,
				'display_name' => sanitize_text_field( $params['name'] ),
			) );
		}

		if ( ! empty( $params['pin'] ) ) {
			update_user_meta( $id, '_omni_pos_pin', wp_hash_password( sanitize_text_field( $params['pin'] ) ) );
		}

		if ( isset( $params['max_discount'] ) ) {
			update_user_meta( $id, '_omni_pos_max_discount', (float) $params['max_discount'] );
		}

		if ( isset( $params['can_refund'] ) ) {
			update_user_meta( $id, '_omni_pos_can_refund', ! empty( $params['can_refund'] ) ? 'yes' : 'no' );
		}

		return self::admin_get_cashiers( $request );
	}

	/**
	 * POST /omni-pos/v1/cashiers/verify-pin
	 * Fast cashier switch via PIN
	 */
	public static function verify_cashier_pin( $request ) {
		$params = $request->get_json_params();
		$pin    = sanitize_text_field( $params['pin'] ?? '' );

		if ( empty( $pin ) ) {
			return new WP_Error( 'missing_pin', __( 'PIN is required.', 'omni-pos' ), array( 'status' => 400 ) );
		}

		// Search for user matching this PIN
		$users = get_users( array(
			'role__in' => array( 'administrator', 'shop_manager', 'omni_pos_cashier' ),
		) );

		foreach ( $users as $u ) {
			$saved_hash = get_user_meta( $u->ID, '_omni_pos_pin', true );
			if ( $saved_hash && wp_check_password( $pin, $saved_hash ) ) {
				// Set as current logged in user for this session
				wp_set_current_user( $u->ID );
				wp_set_auth_cookie( $u->ID );

				return rest_ensure_response( array(
					'success' => true,
					'cashier' => array(
						'id'           => $u->ID,
						'name'         => $u->display_name ?: $u->user_login,
						'email'        => $u->user_email,
						'capabilities' => array(
							'manage_pos'     => user_can( $u->ID, 'manage_woocommerce' ) || user_can( $u->ID, 'manage_options' ),
							'apply_discount' => true,
						),
					),
				) );
			}
		}

		return new WP_Error( 'invalid_pin', __( 'Invalid PIN code.', 'omni-pos' ), array( 'status' => 401 ) );
	}

	/**
	 * GET /omni-pos/v1/admin/reports
	 */
	public static function admin_get_reports( $request ) {
		$range       = sanitize_text_field( $request->get_param( 'range' ) ?: '7days' );
		$custom_from = sanitize_text_field( $request->get_param( 'date_from' ) ?: '' );
		$custom_to   = sanitize_text_field( $request->get_param( 'date_to' ) ?: '' );

		$data = Omni_POS_Helper::get_admin_reports_data( $range, $custom_from, $custom_to );

		return rest_ensure_response( array(
			'success' => true,
			'reports' => $data,
		) );
	}

	/**
	 * GET /omni-pos/v1/admin/customers
	 */
	public static function admin_get_customers( $request ) {
		$search   = sanitize_text_field( $request->get_param( 'search' ) ?: '' );
		$page     = max( 1, (int) $request->get_param( 'page' ) ?: 1 );
		$per_page = min( 50, max( 5, (int) $request->get_param( 'per_page' ) ?: 15 ) );

		$args = array(
			'role'    => 'customer',
			'number'  => $per_page,
			'paged'   => $page,
			'orderby' => 'registered',
			'order'   => 'DESC',
		);

		if ( ! empty( $search ) ) {
			$args['search'] = '*' . $search . '*';
			$args['search_columns'] = array( 'user_login', 'user_email', 'display_name', 'nicename' );
		}

		$query = new WP_User_Query( $args );
		$users = $query->get_results();
		$total = $query->get_total();

		$customers = array();
		foreach ( $users as $u ) {
			$wc_customer = new WC_Customer( $u->ID );
			$total_spent = (float) $wc_customer->get_total_spent();
			$order_count = (int) $wc_customer->get_order_count();
			$phone       = $wc_customer->get_billing_phone();
			$city        = $wc_customer->get_billing_city();
			$address     = $wc_customer->get_billing_address_1();

			$customers[] = array(
				'id'           => $u->ID,
				'name'         => $wc_customer->get_display_name() ?: ( $wc_customer->get_first_name() . ' ' . $wc_customer->get_last_name() ),
				'first_name'   => $wc_customer->get_first_name(),
				'last_name'    => $wc_customer->get_last_name(),
				'email'        => $u->user_email,
				'phone'        => $phone,
				'city'         => $city,
				'address'      => $address,
				'total_spent'  => round( $total_spent, 2 ),
				'orders_count' => $order_count,
				'registered'   => $u->user_registered,
			);
		}

		return rest_ensure_response( array(
			'success'     => true,
			'customers'   => $customers,
			'total'       => $total,
			'total_pages' => ceil( $total / max( 1, $per_page ) ),
			'page'        => $page,
		) );
	}

	/**
	 * POST /omni-pos/v1/admin/customers
	 */
	public static function admin_create_customer( $request ) {
		$params = $request->get_json_params();

		$first_name = sanitize_text_field( $params['first_name'] ?? '' );
		$last_name  = sanitize_text_field( $params['last_name'] ?? '' );
		$email      = sanitize_email( $params['email'] ?? '' );
		$phone      = sanitize_text_field( $params['phone'] ?? '' );
		$city       = sanitize_text_field( $params['city'] ?? '' );
		$address    = sanitize_text_field( $params['address'] ?? '' );

		if ( empty( $first_name ) && empty( $last_name ) && empty( $phone ) ) {
			return new WP_Error( 'missing_fields', __( 'Customer name or phone is required.', 'omni-pos' ), array( 'status' => 400 ) );
		}

		if ( empty( $email ) ) {
			$email = 'customer_' . wp_rand( 1000, 99999 ) . '@omni-pos.local';
		}

		$username = sanitize_user( current( explode( '@', $email ) ) );
		$username = wp_unique_id( $username . '_' );

		$password = wp_generate_password( 12, false );
		$user_id  = wp_create_user( $username, $password, $email );

		if ( is_wp_error( $user_id ) ) {
			return $user_id;
		}

		$customer = new WC_Customer( $user_id );
		$customer->set_first_name( $first_name );
		$customer->set_last_name( $last_name );
		$customer->set_display_name( trim( $first_name . ' ' . $last_name ) ?: $username );
		$customer->set_billing_first_name( $first_name );
		$customer->set_billing_last_name( $last_name );
		$customer->set_billing_phone( $phone );
		$customer->set_billing_email( $email );
		$customer->set_billing_city( $city );
		$customer->set_billing_address_1( $address );
		$customer->save();

		return rest_ensure_response( array(
			'success'  => true,
			'customer' => array(
				'id'           => $user_id,
				'name'         => $customer->get_display_name(),
				'first_name'   => $first_name,
				'last_name'    => $last_name,
				'email'        => $email,
				'phone'        => $phone,
				'city'         => $city,
				'address'      => $address,
				'total_spent'  => 0,
				'orders_count' => 0,
			),
			'message' => __( 'Customer created successfully.', 'omni-pos' ),
		) );
	}

	/**
	 * GET /omni-pos/v1/admin/customers/{id}
	 */
	public static function admin_get_customer_detail( $request ) {
		$id = (int) $request->get_param( 'id' );
		$user = get_user_by( 'id', $id );

		if ( ! $user ) {
			return new WP_Error( 'not_found', __( 'Customer not found.', 'omni-pos' ), array( 'status' => 404 ) );
		}

		$wc_customer = new WC_Customer( $id );
		$orders = wc_get_orders( array(
			'customer_id' => $id,
			'limit'       => 10,
			'orderby'     => 'date',
			'order'       => 'DESC',
		) );

		$orders_data = array();
		foreach ( $orders as $o ) {
			$orders_data[] = array(
				'id'             => $o->get_id(),
				'order_number'   => $o->get_order_number(),
				'date'           => $o->get_date_created() ? $o->get_date_created()->date( 'Y-m-d H:i' ) : '',
				'total'          => (float) $o->get_total(),
				'status'         => $o->get_status(),
				'payment_method' => $o->get_payment_method_title() ?: $o->get_payment_method(),
				'items_count'    => $o->get_item_count(),
			);
		}

		return rest_ensure_response( array(
			'success'  => true,
			'customer' => array(
				'id'           => $id,
				'name'         => $wc_customer->get_display_name(),
				'first_name'   => $wc_customer->get_first_name(),
				'last_name'    => $wc_customer->get_last_name(),
				'email'        => $user->user_email,
				'phone'        => $wc_customer->get_billing_phone(),
				'city'         => $wc_customer->get_billing_city(),
				'address'      => $wc_customer->get_billing_address_1(),
				'total_spent'  => (float) $wc_customer->get_total_spent(),
				'orders_count' => (int) $wc_customer->get_order_count(),
				'orders'       => $orders_data,
			),
		) );
	}

	/**
	 * PUT /omni-pos/v1/admin/customers/{id}
	 */
	public static function admin_update_customer( $request ) {
		$id     = (int) $request->get_param( 'id' );
		$params = $request->get_json_params();

		$wc_customer = new WC_Customer( $id );
		if ( ! $wc_customer->get_id() ) {
			return new WP_Error( 'not_found', __( 'Customer not found.', 'omni-pos' ), array( 'status' => 404 ) );
		}

		if ( isset( $params['first_name'] ) ) {
			$wc_customer->set_first_name( sanitize_text_field( $params['first_name'] ) );
			$wc_customer->set_billing_first_name( sanitize_text_field( $params['first_name'] ) );
		}
		if ( isset( $params['last_name'] ) ) {
			$wc_customer->set_last_name( sanitize_text_field( $params['last_name'] ) );
			$wc_customer->set_billing_last_name( sanitize_text_field( $params['last_name'] ) );
		}
		if ( isset( $params['name'] ) ) {
			$wc_customer->set_display_name( sanitize_text_field( $params['name'] ) );
		}
		if ( isset( $params['email'] ) && is_email( $params['email'] ) ) {
			$wc_customer->set_email( sanitize_email( $params['email'] ) );
			$wc_customer->set_billing_email( sanitize_email( $params['email'] ) );
		}
		if ( isset( $params['phone'] ) ) {
			$wc_customer->set_billing_phone( sanitize_text_field( $params['phone'] ) );
		}
		if ( isset( $params['city'] ) ) {
			$wc_customer->set_billing_city( sanitize_text_field( $params['city'] ) );
		}
		if ( isset( $params['address'] ) ) {
			$wc_customer->set_billing_address_1( sanitize_text_field( $params['address'] ) );
		}

		$wc_customer->save();

		return self::admin_get_customer_detail( $request );
	}

	/**
	 * GET /omni-pos/v1/admin/suppliers
	 */
	public static function admin_get_suppliers( $request ) {
		try {
			$search    = sanitize_text_field( $request->get_param( 'search' ) ?: '' );
			$suppliers = Omni_POS_Suppliers::get_suppliers( $search );

			return rest_ensure_response( array(
				'success'   => true,
				'suppliers' => $suppliers,
				'total'     => count( $suppliers ),
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'suppliers_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * POST /omni-pos/v1/admin/suppliers
	 */
	public static function admin_create_supplier( $request ) {
		try {
			$params   = $request->get_json_params();
			$supplier = Omni_POS_Suppliers::save_supplier( $params, 0 );

			return rest_ensure_response( array(
				'success'  => true,
				'supplier' => $supplier,
				'message'  => __( 'Supplier created successfully.', 'omni-pos' ),
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'supplier_create_failed', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * GET /omni-pos/v1/admin/suppliers/{id}
	 */
	public static function admin_get_single_supplier( $request ) {
		$id       = (int) $request->get_param( 'id' );
		$supplier = Omni_POS_Suppliers::get_supplier( $id );

		if ( ! $supplier ) {
			return new WP_Error( 'not_found', __( 'Supplier not found.', 'omni-pos' ), array( 'status' => 404 ) );
		}

		return rest_ensure_response( array(
			'success'  => true,
			'supplier' => $supplier,
		) );
	}

	/**
	 * PUT /omni-pos/v1/admin/suppliers/{id}
	 */
	public static function admin_update_supplier( $request ) {
		try {
			$id       = (int) $request->get_param( 'id' );
			$params   = $request->get_json_params();
			$supplier = Omni_POS_Suppliers::save_supplier( $params, $id );

			return rest_ensure_response( array(
				'success'  => true,
				'supplier' => $supplier,
				'message'  => __( 'Supplier updated successfully.', 'omni-pos' ),
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'supplier_update_failed', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * DELETE /omni-pos/v1/admin/suppliers/{id}
	 */
	public static function admin_delete_supplier( $request ) {
		$id = (int) $request->get_param( 'id' );
		Omni_POS_Suppliers::delete_supplier( $id );

		return rest_ensure_response( array(
			'success' => true,
			'message' => __( 'Supplier deleted successfully.', 'omni-pos' ),
		) );
	}

	/**
	 * GET /omni-pos/v1/admin/purchases
	 */
	public static function admin_get_purchases( $request ) {
		try {
			$args = array(
				'page'        => (int) $request->get_param( 'page' ) ?: 1,
				'per_page'    => (int) $request->get_param( 'per_page' ) ?: 20,
				'search'      => $request->get_param( 'search' ) ?: '',
				'supplier_id' => (int) $request->get_param( 'supplier_id' ) ?: 0,
				'status'      => $request->get_param( 'status' ) ?: '',
				'date_from'   => $request->get_param( 'date_from' ) ?: '',
				'date_to'     => $request->get_param( 'date_to' ) ?: '',
			);

			$data = Omni_POS_Suppliers::get_purchases( $args );

			return rest_ensure_response( array(
				'success'      => true,
				'purchases'    => $data['purchases'],
				'total'        => $data['total'],
				'total_pages'  => $data['total_pages'],
				'total_amount' => $data['total_amount'],
				'page'         => $data['page'],
				'per_page'     => $data['per_page'],
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'purchases_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * POST /omni-pos/v1/admin/purchases
	 */
	public static function admin_create_purchase( $request ) {
		try {
			$params   = $request->get_json_params();
			$purchase = Omni_POS_Suppliers::save_purchase( $params, 0 );

			return rest_ensure_response( array(
				'success'  => true,
				'purchase' => $purchase,
				'message'  => __( 'Stock received and purchase invoice created.', 'omni-pos' ),
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'purchase_create_failed', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * GET /omni-pos/v1/admin/purchases/{id}
	 */
	public static function admin_get_single_purchase( $request ) {
		$id       = (int) $request->get_param( 'id' );
		$purchase = Omni_POS_Suppliers::get_purchase( $id );

		if ( ! $purchase ) {
			return new WP_Error( 'not_found', __( 'Purchase invoice not found.', 'omni-pos' ), array( 'status' => 404 ) );
		}

		return rest_ensure_response( array(
			'success'  => true,
			'purchase' => $purchase,
		) );
	}

	/**
	 * PUT /omni-pos/v1/admin/purchases/{id}
	 */
	public static function admin_update_purchase( $request ) {
		try {
			$id       = (int) $request->get_param( 'id' );
			$params   = $request->get_json_params();
			$purchase = Omni_POS_Suppliers::save_purchase( $params, $id );

			return rest_ensure_response( array(
				'success'  => true,
				'purchase' => $purchase,
				'message'  => __( 'Purchase invoice updated.', 'omni-pos' ),
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'purchase_update_failed', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * DELETE /omni-pos/v1/admin/purchases/{id}
	 */
	public static function admin_delete_purchase( $request ) {
		$id = (int) $request->get_param( 'id' );
		Omni_POS_Suppliers::delete_purchase( $id );

		return rest_ensure_response( array(
			'success' => true,
			'message' => __( 'Purchase invoice deleted and stock adjusted.', 'omni-pos' ),
		) );
	}

	/**
	 * POST /omni-pos/v1/admin/import
	 * Import Categories, Products, Stock, Suppliers, and Purchases from Migration JSON
	 */
	public static function admin_import_data( $request ) {
		try {
			$params = $request->get_json_params();
			if ( empty( $params ) ) {
				return new WP_Error( 'missing_data', __( 'No import data provided.', 'omni-pos' ), array( 'status' => 400 ) );
			}

			// Prevent script execution timeout on large imports
			if ( function_exists( 'set_time_limit' ) ) {
				@set_time_limit( 300 );
			}
			if ( function_exists( 'wp_raise_memory_limit' ) ) {
				@wp_raise_memory_limit( 'admin' );
			}

			$options           = $params['options'] ?? array();
			$import_categories = ! empty( $params['categories'] ) && ( $options['import_categories'] ?? true );
			$import_suppliers  = ! empty( $params['suppliers'] ) && ( $options['import_suppliers'] ?? true );
			$import_purchases  = ! empty( $params['purchases'] ) && ( $options['import_purchases'] ?? true );
			$import_products   = ! empty( $params['products'] ) && ( $options['import_products'] ?? true );
			$update_existing   = ! empty( $options['update_existing'] );

			$counts = array(
				'categories' => 0,
				'suppliers'  => 0,
				'purchases'  => 0,
				'products'   => 0,
			);

			// 1. Import Categories
			$category_map = array(); // old_id => new_id
			if ( $import_categories ) {
				foreach ( $params['categories'] as $cat ) {
					$cat_name = sanitize_text_field( $cat['name'] ?? '' );
					$cat_slug = sanitize_title( $cat['slug'] ?? $cat_name );
					if ( empty( $cat_name ) ) continue;

					$term = get_term_by( 'slug', $cat_slug, 'product_cat' );
					if ( ! $term ) {
						$term = get_term_by( 'name', $cat_name, 'product_cat' );
					}

					if ( $term ) {
						$term_id = $term->term_id;
					} else {
						$res = wp_insert_term( $cat_name, 'product_cat', array(
							'slug'        => $cat_slug,
							'description' => sanitize_textarea_field( $cat['description'] ?? '' ),
						) );
						if ( ! is_wp_error( $res ) ) {
							$term_id = $res['term_id'];
							$counts['categories']++;
						} else {
							continue;
						}
					}

					if ( ! empty( $cat['id'] ) ) {
						$category_map[ (int) $cat['id'] ] = (int) $term_id;
					}
				}
			}

			// 2. Import Suppliers
			$supplier_map = array(); // old_id => new_id
			if ( $import_suppliers ) {
				foreach ( $params['suppliers'] as $supp ) {
					$saved = Omni_POS_Suppliers::save_supplier( $supp, 0 );
					if ( $saved && ! empty( $saved['id'] ) ) {
						$counts['suppliers']++;
						if ( ! empty( $supp['id'] ) ) {
							$supplier_map[ (int) $supp['id'] ] = (int) $saved['id'];
						}
					}
				}
			}

			// 3. Import Purchases
			if ( $import_purchases ) {
				foreach ( $params['purchases'] as $purch ) {
					$supp_id = (int) ( $purch['supplier_id'] ?? 0 );
					if ( isset( $supplier_map[ $supp_id ] ) ) {
						$purch['supplier_id'] = $supplier_map[ $supp_id ];
					}
					$saved = Omni_POS_Suppliers::save_purchase( $purch, 0 );
					if ( $saved ) {
						$counts['purchases']++;
					}
				}
			}

			// 4. Import Products & Variations
			if ( $import_products ) {
				foreach ( $params['products'] as $p ) {
					$name = sanitize_text_field( $p['name'] ?? '' );
					$sku  = sanitize_text_field( $p['sku'] ?? '' );
					$barcode = sanitize_text_field( $p['barcode'] ?? '' );
					if ( empty( $name ) ) continue;

					// Check existing product
					$existing_id = 0;
					if ( ! empty( $sku ) ) {
						$existing_id = (int) wc_get_product_id_by_sku( $sku );
					}
					if ( ! $existing_id && ! empty( $barcode ) ) {
						$existing_id = (int) Omni_POS_Helper::find_product_id_by_barcode( $barcode );
					}
					if ( ! $existing_id && ! empty( $p['id'] ) && $update_existing ) {
						$temp = wc_get_product( (int) $p['id'] );
						if ( $temp ) $existing_id = (int) $p['id'];
					}

					if ( $existing_id > 0 && ! $update_existing ) {
						continue; // Skip existing
					}

					$is_variable = ! empty( $p['variations'] );
					$product = $existing_id > 0 ? wc_get_product( $existing_id ) : ( $is_variable ? new WC_Product_Variable() : new WC_Product_Simple() );

					$product->set_name( $name );
					if ( ! empty( $sku ) ) {
						$product->set_sku( $sku );
					}

					$reg_price = isset( $p['regular_price'] ) ? (float) $p['regular_price'] : (float) ( $p['price'] ?? 0 );
					$sale_price = isset( $p['sale_price'] ) && '' !== $p['sale_price'] && null !== $p['sale_price'] ? (float) $p['sale_price'] : null;

					if ( ! $is_variable ) {
						$product->set_regular_price( $reg_price );
						if ( null !== $sale_price && $sale_price > 0 && $sale_price < $reg_price ) {
							$product->set_sale_price( $sale_price );
							$product->set_price( $sale_price );
						} else {
							$product->set_sale_price( '' );
							$product->set_price( $reg_price );
						}

						if ( isset( $p['stock_quantity'] ) || ! empty( $p['manage_stock'] ) ) {
							$stock_qty = (float) ( $p['stock_quantity'] ?? 0 );
							$product->set_manage_stock( true );
							$product->set_stock_quantity( $stock_qty );
							$product->set_stock_status( $stock_qty > 0 ? 'instock' : 'outofstock' );
						}
					}

					// Barcode meta
					if ( ! empty( $barcode ) ) {
						$product->update_meta_data( '_omni_pos_barcode', $barcode );
						$product->update_meta_data( '_barcode', $barcode );
					}

					// Cost price meta
					if ( ! empty( $p['cost_price'] ) ) {
						$product->update_meta_data( '_omni_pos_cost_price', (float) $p['cost_price'] );
						$product->update_meta_data( '_cost_price', (float) $p['cost_price'] );
					}

					// Map categories
					if ( ! empty( $p['category_ids'] ) && is_array( $p['category_ids'] ) ) {
						$new_cat_ids = array();
						foreach ( $p['category_ids'] as $old_cid ) {
							if ( isset( $category_map[ (int) $old_cid ] ) ) {
								$new_cat_ids[] = $category_map[ (int) $old_cid ];
							} else {
								$new_cat_ids[] = (int) $old_cid;
							}
						}
						$product->set_category_ids( $new_cat_ids );
					}

					$saved_id = $product->save();
					if ( $saved_id ) {
						$counts['products']++;

						// Save variations if variable product
						if ( $is_variable && is_array( $p['variations'] ) ) {
							foreach ( $p['variations'] as $var_data ) {
								$v_sku = sanitize_text_field( $var_data['sku'] ?? '' );
								$v_barcode = sanitize_text_field( $var_data['barcode'] ?? '' );
								$v_id = 0;
								if ( ! empty( $v_sku ) ) {
									$v_id = (int) wc_get_product_id_by_sku( $v_sku );
								}
								$variation = $v_id > 0 ? new WC_Product_Variation( $v_id ) : new WC_Product_Variation();
								$variation->set_parent_id( $saved_id );
								if ( ! empty( $var_data['name'] ) ) {
									$variation->set_name( sanitize_text_field( $var_data['name'] ) );
								}
								if ( ! empty( $v_sku ) ) {
									$variation->set_sku( $v_sku );
								}
								$v_reg = (float) ( $var_data['regular_price'] ?? $var_data['price'] ?? 0 );
								$variation->set_regular_price( $v_reg );
								$variation->set_price( $v_reg );
								if ( isset( $var_data['stock_quantity'] ) ) {
									$v_stock = (float) $var_data['stock_quantity'];
									$variation->set_manage_stock( true );
									$variation->set_stock_quantity( $v_stock );
									$variation->set_stock_status( $v_stock > 0 ? 'instock' : 'outofstock' );
								}
								if ( ! empty( $v_barcode ) ) {
									$variation->update_meta_data( '_omni_pos_barcode', $v_barcode );
									$variation->update_meta_data( '_barcode', $v_barcode );
								}
								if ( ! empty( $var_data['cost_price'] ) ) {
									$variation->update_meta_data( '_omni_pos_cost_price', (float) $var_data['cost_price'] );
									$variation->update_meta_data( '_cost_price', (float) $var_data['cost_price'] );
								}
								$variation->save();
							}
						}

						if ( function_exists( 'wc_delete_product_transients' ) ) {
							wc_delete_product_transients( $saved_id );
						}
					}
				}
			}

			// Clear global caches
			wp_cache_flush();

			return rest_ensure_response( array(
				'success'  => true,
				'imported' => $counts,
				'message'  => sprintf(
					__( 'Import completed successfully! %d categories, %d suppliers, %d invoices, %d products imported.', 'omni-pos' ),
					$counts['categories'],
					$counts['suppliers'],
					$counts['purchases'],
					$counts['products']
				),
			) );

		} catch ( \Throwable $e ) {
			return new WP_Error( 'import_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * GET /omni-pos/v1/admin/translations
	 */
	public static function admin_get_translations( $request ) {
		try {
			$lang = $request->get_param( 'lang' ) ?: get_option( 'omni_pos_language', 'auto' );
			$resolved_lang = 'auto' === $lang ? get_locale() : $lang;

			return rest_ensure_response( array(
				'success'               => true,
				'languages'             => Omni_POS_I18n::get_available_languages(),
				'active_language'       => get_option( 'omni_pos_language', 'auto' ),
				'resolved_language'     => $resolved_lang,
				'default_strings'       => Omni_POS_I18n::get_default_strings(),
				'custom_translations'   => get_option( 'omni_pos_custom_translations', array() ),
				'resolved_translations' => Omni_POS_I18n::get_resolved_translations( $resolved_lang ),
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'translations_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * POST /omni-pos/v1/admin/translations
	 */
	public static function admin_save_translations( $request ) {
		try {
			$params = $request->get_json_params() ?: array();

			if ( isset( $params['language'] ) ) {
				update_option( 'omni_pos_language', sanitize_text_field( $params['language'] ) );
			}

			if ( isset( $params['custom_translations'] ) && is_array( $params['custom_translations'] ) ) {
				Omni_POS_I18n::save_custom_translations( $params['custom_translations'] );
			}

			$active_lang = get_option( 'omni_pos_language', 'auto' );
			$resolved_lang = 'auto' === $active_lang ? get_locale() : $active_lang;

			return rest_ensure_response( array(
				'success'               => true,
				'message'               => __( 'Language settings and custom translations saved successfully!', 'omni-pos' ),
				'active_language'       => $active_lang,
				'custom_translations'   => get_option( 'omni_pos_custom_translations', array() ),
				'resolved_translations' => Omni_POS_I18n::get_resolved_translations( $resolved_lang ),
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'save_translations_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * POST /omni-pos/v1/admin/translations/scan
	 */
	public static function admin_scan_translations( $request ) {
		try {
			$scan_result = Omni_POS_I18n::scan_and_harvest_strings();

			return rest_ensure_response( array(
				'success'       => true,
				'message'       => sprintf(
					__( 'Scan complete: Analyzed %d files and harvested %d unique translation strings.', 'omni-pos' ),
					$scan_result['files_scanned'],
					$scan_result['total_strings']
				),
				'files_scanned' => $scan_result['files_scanned'],
				'total_strings' => $scan_result['total_strings'],
				'strings'       => $scan_result['strings'],
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'scan_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * POST /omni-pos/v1/admin/translations/auto-translate
	 */
	public static function admin_auto_translate( $request ) {
		try {
			$params = $request->get_json_params() ?: array();
			$target_lang = sanitize_text_field( $params['target_language'] ?? 'ka_GE' );

			$result = Omni_POS_I18n::auto_translate_all( $target_lang );

			return rest_ensure_response( array(
				'success'          => true,
				'message'          => sprintf(
					__( 'Auto-translation complete! Translated %d strings for %s.', 'omni-pos' ),
					$result['translated_count'],
					$target_lang
				),
				'files_scanned'    => $result['files_scanned'],
				'total_strings'    => $result['total_strings'],
				'translated_count' => $result['translated_count'],
				'custom_translations' => $result['overrides'],
				'resolved_translations' => $result['resolved'],
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'auto_translate_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * POST /omni-pos/v1/admin/translations/custom-string
	 */
	public static function admin_add_custom_string( $request ) {
		try {
			$params = $request->get_json_params() ?: array();
			$key = sanitize_key( $params['key'] ?? '' );
			$en = sanitize_text_field( $params['en'] ?? '' );
			$cat = sanitize_text_field( $params['cat'] ?? 'custom' );
			$translation = sanitize_text_field( $params['translation'] ?? '' );

			if ( empty( $key ) || empty( $en ) ) {
				return new WP_Error( 'invalid_data', __( 'String key and default English text are required', 'omni-pos' ), array( 'status' => 400 ) );
			}

			Omni_POS_I18n::add_user_defined_string( $key, $en, $cat, $translation );

			$active_lang = get_option( 'omni_pos_language', 'auto' );
			$resolved_lang = 'auto' === $active_lang ? get_locale() : $active_lang;

			return rest_ensure_response( array(
				'success'               => true,
				'message'               => __( 'Custom string added successfully!', 'omni-pos' ),
				'default_strings'       => Omni_POS_I18n::get_default_strings(),
				'custom_translations'   => get_option( 'omni_pos_custom_translations', array() ),
				'resolved_translations' => Omni_POS_I18n::get_resolved_translations( $resolved_lang ),
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'add_custom_string_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * DELETE /omni-pos/v1/admin/translations/custom-string/:key
	 */
	public static function admin_delete_custom_string( $request ) {
		try {
			$key = sanitize_key( $request['key'] ?? '' );
			if ( empty( $key ) ) {
				return new WP_Error( 'invalid_key', __( 'String key is required', 'omni-pos' ), array( 'status' => 400 ) );
			}

			Omni_POS_I18n::delete_user_defined_string( $key );

			$active_lang = get_option( 'omni_pos_language', 'auto' );
			$resolved_lang = 'auto' === $active_lang ? get_locale() : $active_lang;

			return rest_ensure_response( array(
				'success'               => true,
				'message'               => __( 'Custom string deleted successfully!', 'omni-pos' ),
				'default_strings'       => Omni_POS_I18n::get_default_strings(),
				'custom_translations'   => get_option( 'omni_pos_custom_translations', array() ),
				'resolved_translations' => Omni_POS_I18n::get_resolved_translations( $resolved_lang ),
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'delete_custom_string_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * POST /omni-pos/v1/admin/bulk-delete
	 */
	public static function admin_bulk_delete( $request ) {
		global $wpdb;
		try {
			$params = $request->get_json_params() ?: array();
			$type   = sanitize_key( $params['type'] ?? '' );
			$ids    = isset( $params['ids'] ) && is_array( $params['ids'] ) ? array_map( 'sanitize_text_field', $params['ids'] ) : array();

			if ( empty( $type ) || empty( $ids ) ) {
				return new WP_Error( 'missing_params', __( 'Type and IDs array are required.', 'omni-pos' ), array( 'status' => 400 ) );
			}

			$deleted_count = 0;

			switch ( $type ) {
				case 'products':
					foreach ( $ids as $id ) {
						$pid = (int) $id;
						if ( $pid > 0 ) {
							$res = wp_trash_post( $pid );
							if ( $res ) {
								$deleted_count++;
							}
						}
					}
					break;

				case 'orders':
					foreach ( $ids as $id ) {
						$oid = (int) $id;
						if ( $oid > 0 ) {
							$res = wp_trash_post( $oid );
							if ( $res ) {
								$deleted_count++;
							}
						}
					}
					break;

				case 'suppliers':
					$table = $wpdb->prefix . 'omni_pos_suppliers';
					$int_ids = array_map( 'intval', $ids );
					if ( ! empty( $int_ids ) ) {
						$placeholders = implode( ',', array_fill( 0, count( $int_ids ), '%d' ) );
						$deleted_count = (int) $wpdb->query( $wpdb->prepare( "DELETE FROM $table WHERE id IN ($placeholders)", $int_ids ) );
					}
					break;

				case 'purchases':
					$table = $wpdb->prefix . 'omni_pos_purchases';
					$int_ids = array_map( 'intval', $ids );
					if ( ! empty( $int_ids ) ) {
						$placeholders = implode( ',', array_fill( 0, count( $int_ids ), '%d' ) );
						$deleted_count = (int) $wpdb->query( $wpdb->prepare( "DELETE FROM $table WHERE id IN ($placeholders)", $int_ids ) );
					}
					break;

				case 'cashiers':
				case 'customers':
					$current_user_id = get_current_user_id();
					require_once ABSPATH . 'wp-admin/includes/user.php';
					foreach ( $ids as $id ) {
						$uid = (int) $id;
						if ( $uid > 0 && $uid !== $current_user_id ) {
							if ( wp_delete_user( $uid ) ) {
								$deleted_count++;
							}
						}
					}
					break;

				case 'shifts':
					$table = $wpdb->prefix . 'omni_pos_shifts';
					$int_ids = array_map( 'intval', $ids );
					if ( ! empty( $int_ids ) ) {
						$placeholders = implode( ',', array_fill( 0, count( $int_ids ), '%d' ) );
						$deleted_count = (int) $wpdb->query( $wpdb->prepare( "DELETE FROM $table WHERE id IN ($placeholders)", $int_ids ) );
					}
					break;

				case 'translations':
					foreach ( $ids as $key ) {
						Omni_POS_I18n::delete_user_defined_string( $key );
						$deleted_count++;
					}
					break;

				default:
					return new WP_Error( 'unsupported_type', __( 'Unsupported entity type for bulk deletion.', 'omni-pos' ), array( 'status' => 400 ) );
			}

			return rest_ensure_response( array(
				'success' => true,
				'message' => sprintf( __( 'Successfully deleted %d item(s).', 'omni-pos' ), $deleted_count ),
				'count'   => $deleted_count,
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'bulk_delete_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * GET /omni-pos/v1/admin/updates/check
	 */
	public static function admin_check_updates( $request ) {
		try {
			$force = $request->get_param( 'force' ) === 'true' || $request->get_param( 'force' ) === '1';
			$updater = Omni_POS_Updater::instance();
			$data = $updater->check_for_update( $force );

			return rest_ensure_response( array(
				'success'         => true,
				'has_update'      => ! empty( $data['has_update'] ),
				'current_version' => isset( $data['current_version'] ) ? $data['current_version'] : OMNI_POS_VERSION,
				'latest_version'  => isset( $data['latest_version'] ) ? $data['latest_version'] : OMNI_POS_VERSION,
				'release_name'    => isset( $data['release_name'] ) ? $data['release_name'] : '',
				'changelog'       => isset( $data['changelog'] ) ? $data['changelog'] : '',
				'published_at'    => isset( $data['published_at'] ) ? $data['published_at'] : '',
				'download_url'    => isset( $data['download_url'] ) ? $data['download_url'] : '',
				'github_url'      => isset( $data['github_url'] ) ? $data['github_url'] : '',
				'repo'            => $updater->get_github_repo(),
				'error'           => isset( $data['error'] ) ? $data['error'] : null,
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'check_updates_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * POST /omni-pos/v1/admin/updates/settings
	 */
	public static function admin_save_update_settings( $request ) {
		try {
			$body = $request->get_json_params();
			$repo = isset( $body['repo'] ) ? sanitize_text_field( $body['repo'] ) : '';
			$token = isset( $body['token'] ) ? sanitize_text_field( $body['token'] ) : '';

			if ( empty( $repo ) || strpos( $repo, '/' ) === false ) {
				return new WP_Error( 'invalid_repo', __( 'Invalid GitHub repository. Format must be owner/repository (e.g. username/omni-pos).', 'omni-pos' ), array( 'status' => 400 ) );
			}

			$updater = Omni_POS_Updater::instance();
			$updater->set_github_repo( $repo, $token );

			// Immediately recheck with new repo
			$data = $updater->check_for_update( true );

			return rest_ensure_response( array(
				'success' => true,
				'message' => __( 'GitHub repository settings saved successfully!', 'omni-pos' ),
				'repo'    => $updater->get_github_repo(),
				'update'  => $data,
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'save_update_settings_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * POST /omni-pos/v1/admin/updates/install
	 */
	public static function admin_install_update( $request ) {
		try {
			$updater = Omni_POS_Updater::instance();
			$res = $updater->perform_direct_update();

			if ( is_wp_error( $res ) ) {
				return $res;
			}

			return rest_ensure_response( $res );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'install_update_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * GET /omni-pos/v1/admin/extension/download
	 * Generates/Serves a clean 1-click zip bundle of the Chrome extension
	 */
	public static function admin_download_extension_zip( $request ) {
		try {
			$ext_dir = OMNI_POS_PATH . 'extension';
			if ( ! is_dir( $ext_dir ) ) {
				return new WP_Error( 'missing_dir', 'Extension folder not found in plugin.' );
			}

			$upload_dir = wp_upload_dir();
			$zip_file   = $upload_dir['basedir'] . '/omni-nicelabel-print-extension.zip';

			if ( class_exists( 'ZipArchive' ) ) {
				$zip = new ZipArchive();
				if ( $zip->open( $zip_file, ZipArchive::CREATE | ZipArchive::OVERWRITE ) === true ) {
					$files = new RecursiveIteratorIterator(
						new RecursiveDirectoryIterator( $ext_dir, RecursiveDirectoryIterator::SKIP_DOTS ),
						RecursiveIteratorIterator::LEAVES_ONLY
					);
					foreach ( $files as $name => $file ) {
						if ( ! $file->isDir() ) {
							$filePath     = $file->getRealPath();
							$relativePath = substr( $filePath, strlen( $ext_dir ) + 1 );
							$zip->addFile( $filePath, $relativePath );
						}
					}
					$zip->close();
				}
			}

			$download_url = $upload_dir['baseurl'] . '/omni-nicelabel-print-extension.zip?v=' . time();

			return rest_ensure_response( array(
				'success'      => true,
				'download_url' => $download_url,
				'filename'     => 'omni-nicelabel-print-extension.zip',
			) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'zip_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}
}

