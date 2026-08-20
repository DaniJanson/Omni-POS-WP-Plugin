<?php
/**
 * Omni POS Custom WooCommerce Payment Gateways
 * 
 * Integrates POS payment methods directly into WooCommerce core
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Omni_POS_Gateways {

	public static function init() {
		add_filter( 'woocommerce_payment_gateways', array( __CLASS__, 'add_gateways' ) );
	}

	public static function add_gateways( $gateways ) {
		$gateways[] = 'Omni_POS_Gateway_Cash';
		$gateways[] = 'Omni_POS_Gateway_Card';
		$gateways[] = 'Omni_POS_Gateway_Split';
		return $gateways;
	}
}

add_action( 'plugins_loaded', function() {
	if ( ! class_exists( 'WC_Payment_Gateway' ) ) {
		return;
	}

	/**
	 * POS Cash Gateway
	 */
	class Omni_POS_Gateway_Cash extends WC_Payment_Gateway {
		public function __construct() {
			$this->id                 = 'omni_pos_cash';
			$this->method_title       = __( 'Omni POS - Cash', 'omni-pos' );
			$this->method_description = __( 'Accept cash payments via Omni POS register.', 'omni-pos' );
			$this->title              = __( 'Cash (POS)', 'omni-pos' );
			$this->has_fields         = false;
			$this->enabled            = 'yes';
		}
	}

	/**
	 * POS Card Gateway
	 */
	class Omni_POS_Gateway_Card extends WC_Payment_Gateway {
		public function __construct() {
			$this->id                 = 'omni_pos_card';
			$this->method_title       = __( 'Omni POS - Card', 'omni-pos' );
			$this->method_description = __( 'Accept card/terminal payments via Omni POS register.', 'omni-pos' );
			$this->title              = __( 'Credit / Debit Card (POS)', 'omni-pos' );
			$this->has_fields         = false;
			$this->enabled            = 'yes';
		}
	}

	/**
	 * POS Split Gateway
	 */
	class Omni_POS_Gateway_Split extends WC_Payment_Gateway {
		public function __construct() {
			$this->id                 = 'omni_pos_split';
			$this->method_title       = __( 'Omni POS - Split Payment', 'omni-pos' );
			$this->method_description = __( 'Accept split (cash + card) payments via Omni POS register.', 'omni-pos' );
			$this->title              = __( 'Split Payment (POS)', 'omni-pos' );
			$this->has_fields         = false;
			$this->enabled            = 'yes';
		}
	}

	Omni_POS_Gateways::init();
} );
