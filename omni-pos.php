<?php
/**
 * Plugin Name: Omni POS - Ultra Fast Point of Sale
 * Plugin URI: https://omni.ge
 * Description: Lightweight, ultra-fast React + IndexedDB Point of Sale (POS) system for WooCommerce.
 * Version: 1.0.3
 * Author: Omni Dev Team
 * Author URI: https://omni.ge
 * Text Domain: omni-pos
 * Domain Path: /languages
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 9.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

define( 'OMNI_POS_VERSION', '1.0.3' );
define( 'OMNI_POS_FILE', __FILE__ );
define( 'OMNI_POS_PATH', plugin_dir_path( __FILE__ ) );
define( 'OMNI_POS_URL', plugin_dir_url( __FILE__ ) );

/**
 * Prevent PHPMailer fatal crash if mail() function is disabled in php.ini on server
 */
add_filter( 'pre_wp_mail', function( $null, $atts = array() ) {
	if ( ! function_exists( 'mail' ) ) {
		return false; // Safely bypass wp_mail instead of crashing with undefined function mail()
	}
	return $null;
}, 1, 2 );

/**
 * Declare HPOS (High-Performance Order Storage) and Cart/Checkout Blocks compatibility
 */
add_action( 'before_woocommerce_init', function() {
	if ( class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'cart_checkout_blocks', __FILE__, true );
	}
} );

/**
 * Check if WooCommerce is active
 */
function omni_pos_check_woocommerce() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', function() {
			echo '<div class="error"><p>' . sprintf(
				/* translators: %s: Plugin name */
				esc_html__( '%s requires WooCommerce to be installed and active!', 'omni-pos' ),
				'<strong>Omni POS</strong>'
			) . '</p></div>';
		} );
		return false;
	}
	return true;
}

/**
 * Include core classes
 */
function omni_pos_init() {
	if ( ! omni_pos_check_woocommerce() ) {
		return;
	}

	require_once OMNI_POS_PATH . 'includes/class-omni-pos-gateways.php';
	require_once OMNI_POS_PATH . 'includes/class-omni-pos-helper.php';
	require_once OMNI_POS_PATH . 'includes/class-omni-pos-i18n.php';
	require_once OMNI_POS_PATH . 'includes/class-omni-pos-shifts.php';
	require_once OMNI_POS_PATH . 'includes/class-omni-pos-suppliers.php';
	require_once OMNI_POS_PATH . 'includes/class-omni-pos-updater.php';
	require_once OMNI_POS_PATH . 'includes/class-omni-pos-api.php';
	require_once OMNI_POS_PATH . 'includes/class-omni-pos-admin.php';

	// Init Updater
	Omni_POS_Updater::instance();

	// Init REST API
	Omni_POS_API::init();

	// Init Admin
	Omni_POS_Admin::init();
}
add_action( 'plugins_loaded', 'omni_pos_init' );

/**
 * Activation Hook - add custom cashier role, create tables and flush rewrite rules
 */
register_activation_hook( __FILE__, function() {
	// Add Cashier role if not exists
	add_role( 'omni_pos_cashier', __( 'POS Cashier', 'omni-pos' ), array(
		'read'                  => true,
		'edit_posts'            => false,
		'delete_posts'          => false,
		'manage_woocommerce'    => false,
		'view_admin_dashboard'  => true,
		'read_private_products' => true,
		'edit_shop_orders'      => true,
		'read_shop_orders'      => true,
	) );

	// Create shift and suppliers database tables
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-omni-pos-shifts.php';
	Omni_POS_Shifts::init_db();

	require_once plugin_dir_path( __FILE__ ) . 'includes/class-omni-pos-suppliers.php';
	Omni_POS_Suppliers::init_db();

	// Flush rewrite rules for custom REST API
	flush_rewrite_rules();
} );
