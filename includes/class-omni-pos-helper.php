<?php
/**
 * Omni POS Helper Functions
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Omni_POS_Helper {

	/**
	 * In-memory category terms cache for zero-query formatting
	 */
	private static $terms_cache = null;

	/**
	 * In-memory image URLs cache
	 */
	private static $images_cache = array();

	/**
	 * Get product barcode supporting various meta formats (Vitepos, WooCommerce Global ID, custom fields)
	 *
	 * @param WC_Product $product
	 * @return string
	 */
	public static function get_product_barcode( $product ) {
		if ( ! ( $product instanceof WC_Product ) ) {
			return '';
		}

		$id = $product->get_id();

		// 1. WooCommerce standard global unique ID (GTIN, UPC, EAN, or ISBN)
		if ( method_exists( $product, 'get_global_unique_id' ) ) {
			$global_id = $product->get_global_unique_id();
			if ( ! empty( $global_id ) ) {
				return $global_id;
			}
		}

		// 2. Direct postmeta fallback for custom barcode
		$global_id_meta = get_post_meta( $id, '_global_unique_id', true );
		if ( ! empty( $global_id_meta ) ) {
			return (string) $global_id_meta;
		}

		// 3. Check popular barcode meta keys
		$meta_keys = array(
			'_vt_barcode',
			'_barcode',
			'barcode',
			'_gtin',
			'gtin',
			'_gtin_code',
			'_ean',
			'ean',
			'_ean_code',
			'_upc',
			'upc',
			'_upc_code',
			'_isbn',
			'isbn',
			'_isbn_code',
		);

		foreach ( $meta_keys as $key ) {
			$val = $product->get_meta( $key );
			if ( empty( $val ) ) {
				$val = get_post_meta( $id, $key, true );
			}
			if ( ! empty( $val ) ) {
				return (string) $val;
			}
		}

		// 4. Vitepos integration fallback
		if ( class_exists( '\VitePos\Libs\POS_Product' ) ) {
			$barcode = \VitePos\Libs\POS_Product::get_barcode_of_product( $product );
			if ( ! empty( $barcode ) ) {
				return (string) $barcode;
			}
		}

		// 5. Fallback to SKU
		$sku = $product->get_sku();
		if ( ! empty( $sku ) ) {
			return (string) $sku;
		}

		return '';
	}

	/**
	 * Find product ID by barcode or SKU using native WooCommerce queries
	 *
	 * @param string $barcode
	 * @return int
	 */
	public static function find_product_id_by_barcode( $barcode ) {
		if ( empty( $barcode ) ) {
			return 0;
		}

		$cache_key = 'omni_bc_' . md5( $barcode );
		$cached_id = wp_cache_get( $cache_key, 'omni_pos' );
		if ( false !== $cached_id && is_numeric( $cached_id ) ) {
			return (int) $cached_id;
		}

		// 1. By SKU
		$product_id = wc_get_product_id_by_sku( $barcode );

		// 2. By ID if numeric
		if ( ! $product_id && is_numeric( $barcode ) ) {
			$product_test = wc_get_product( (int) $barcode );
			if ( $product_test && $product_test->exists() ) {
				$product_id = $product_test->get_id();
			}
		}

		// 3. By Global Unique ID / GTIN via native WooCommerce
		if ( ! $product_id && function_exists( 'wc_get_products' ) ) {
			$found = wc_get_products( array(
				'limit'   => 1,
				'return'  => 'ids',
				'sku'     => $barcode,
				'status'  => 'publish',
			) );
			if ( ! empty( $found ) ) {
				$product_id = (int) $found[0];
			}
		}

		if ( $product_id > 0 ) {
			wp_cache_set( $cache_key, $product_id, 'omni_pos', 3600 );
			return $product_id;
		}

		return 0;
	}

	/**
	 * Format single product into lean POS structure
	 *
	 * @param WC_Product $product
	 * @return array
	 */
	public static function format_lean_product( $product ) {
		if ( ! ( $product instanceof WC_Product ) ) {
			return array();
		}

		$id = $product->get_id();
		$image_id = $product->get_image_id();
		
		$image_url = '';
		if ( $image_id > 0 ) {
			if ( ! isset( self::$images_cache[ $image_id ] ) ) {
				self::$images_cache[ $image_id ] = wp_get_attachment_image_url( $image_id, 'thumbnail' ) ?: wc_placeholder_img_src( 'thumbnail' );
			}
			$image_url = self::$images_cache[ $image_id ];
		} else {
			$image_url = wc_placeholder_img_src( 'thumbnail' );
		}

		// Categories (cached in-memory lookup)
		$category_ids = $product->get_category_ids();
		$categories = array();
		if ( ! empty( $category_ids ) ) {
			if ( null === self::$terms_cache ) {
				$all_terms = get_terms( array( 'taxonomy' => 'product_cat', 'hide_empty' => false ) );
				self::$terms_cache = array();
				if ( ! is_wp_error( $all_terms ) ) {
					foreach ( $all_terms as $t ) {
						self::$terms_cache[ $t->term_id ] = array(
							'id'   => $t->term_id,
							'name' => $t->name,
							'slug' => $t->slug,
						);
					}
				}
			}
			foreach ( $category_ids as $cat_id ) {
				if ( isset( self::$terms_cache[ $cat_id ] ) ) {
					$categories[] = self::$terms_cache[ $cat_id ];
				}
			}
		}

		$price = (float) $product->get_price();
		$regular_price = (float) $product->get_regular_price();
		$sale_price = $product->is_on_sale() ? (float) $product->get_sale_price() : null;

		$stock_qty = $product->get_stock_quantity();
		$manage_stock = $product->managing_stock();
		$is_in_stock = $product->is_in_stock();

		$data = array(
			'id'             => $id,
			'name'           => $product->get_name(),
			'sku'            => (string) $product->get_sku(),
			'barcode'        => self::get_product_barcode( $product ),
			'price'          => $price,
			'regular_price'  => $regular_price > 0 ? $regular_price : $price,
			'sale_price'     => $sale_price,
			'is_on_sale'     => $product->is_on_sale(),
			'manage_stock'   => $manage_stock,
			'stock_quantity' => $manage_stock ? (int) $stock_qty : 9999,
			'in_stock'       => $is_in_stock,
			'categories'     => $categories,
			'image'          => $image_url,
			'type'           => $product->get_type(),
			'tax_status'     => $product->get_tax_status(),
			'tax_class'      => $product->get_tax_class(),
			'updated_at'     => $product->get_date_modified() ? $product->get_date_modified()->getTimestamp() : time(),
		);

		// Handle Variable Products
		if ( $product->is_type( 'variable' ) ) {
			$variations_data = array();
			$children = $product->get_children();
			foreach ( $children as $child_id ) {
				$variation = wc_get_product( $child_id );
				if ( $variation && $variation->exists() ) {
					$var_image_id = $variation->get_image_id();
					$var_image = $var_image_id ? wp_get_attachment_image_url( $var_image_id, 'thumbnail' ) : $image_url;
					$var_price = (float) $variation->get_price();

					$variations_data[] = array(
						'id'             => $variation->get_id(),
						'name'           => $variation->get_name(),
						'attributes'     => $variation->get_attributes(),
						'sku'            => (string) $variation->get_sku(),
						'barcode'        => self::get_product_barcode( $variation ),
						'price'          => $var_price,
						'regular_price'  => (float) $variation->get_regular_price(),
						'sale_price'     => $variation->is_on_sale() ? (float) $variation->get_sale_price() : null,
						'stock_quantity' => $variation->managing_stock() ? (int) $variation->get_stock_quantity() : 9999,
						'in_stock'       => $variation->is_in_stock(),
						'image'          => $var_image,
					);
				}
			}
			$data['variations'] = $variations_data;
		}

		return $data;
	}

	/**
	 * Get General POS settings & Store metadata in English with i18n
	 *
	 * @return array
	 */
	public static function get_pos_init_data() {
		$current_user = wp_get_current_user();

		$currency_code = get_woocommerce_currency();
		$currency_symbol = html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5, 'UTF-8' );

		return array(
			'store' => array(
				'name'               => get_bloginfo( 'name' ),
				'description'        => get_bloginfo( 'description' ),
				'address'            => array(
					'address_1' => get_option( 'woocommerce_store_address', '' ),
					'address_2' => get_option( 'woocommerce_store_address_2', '' ),
					'city'      => get_option( 'woocommerce_store_city', '' ),
					'postcode'  => get_option( 'woocommerce_store_postcode', '' ),
					'country'   => get_option( 'woocommerce_default_country', 'US' ),
				),
				'phone'              => get_option( 'omni_pos_store_phone', '' ),
				'tax_number'         => get_option( 'omni_pos_store_tax_id', '' ),
				'currency'           => $currency_code,
				'currency_symbol'    => $currency_symbol,
				'currency_pos'       => get_option( 'woocommerce_currency_pos', 'right_space' ),
				'decimals'           => wc_get_price_decimals(),
				'decimal_sep'        => wc_get_price_decimal_separator(),
				'thousand_sep'       => wc_get_price_thousand_separator(),
				'tax_enabled'        => wc_tax_enabled(),
				'prices_include_tax' => wc_prices_include_tax(),
			),
			'cashier' => array(
				'id'           => $current_user->ID,
				'name'         => $current_user->display_name ?: $current_user->user_login,
				'email'        => $current_user->user_email,
				'capabilities' => array(
					'manage_pos'     => current_user_can( 'manage_woocommerce' ),
					'apply_discount' => current_user_can( 'edit_shop_orders' ),
				),
			),
			'settings' => array(
				'receipt_header' => get_option( 'omni_pos_receipt_header', __( "Thank you for your purchase!\nFast & Reliable Service", 'omni-pos' ) ),
				'receipt_footer' => get_option( 'omni_pos_receipt_footer', __( 'Please keep this receipt for warranty and returns.', 'omni-pos' ) ),
				'auto_print'     => get_option( 'omni_pos_auto_print', 'no' ) === 'yes',
				'sound_effects'  => get_option( 'omni_pos_sound_effects', 'yes' ) === 'yes',
				'barcode_delay'  => 50, // ms scanner threshold
			),
			'payment_methods' => self::get_all_payment_methods(),
			'stats' => array(
				'total_products' => (int) wp_count_posts( 'product' )->publish,
			),
		);
	}

	/**
	 * Get all active payment gateways including WooCommerce gateways
	 *
	 * @return array
	 */
	public static function get_all_payment_methods() {
		$methods = array(
			array( 'id' => 'cash', 'name' => __( 'Cash', 'omni-pos' ), 'icon' => 'banknotes', 'is_wc' => false ),
			array( 'id' => 'card', 'name' => __( 'Credit / Debit Card (POS)', 'omni-pos' ), 'icon' => 'credit-card', 'is_wc' => false ),
			array( 'id' => 'split', 'name' => __( 'Split Payment', 'omni-pos' ), 'icon' => 'arrows-right-left', 'is_wc' => false ),
		);

		if ( function_exists( 'WC' ) && WC()->payment_gateways() ) {
			$available_gateways = WC()->payment_gateways()->get_available_payment_gateways();
			if ( ! empty( $available_gateways ) ) {
				foreach ( $available_gateways as $gateway_id => $gateway ) {
					if ( strpos( $gateway_id, 'omni_pos_' ) === 0 ) {
						continue;
					}
					$methods[] = array(
						'id'          => $gateway_id,
						'name'        => $gateway->get_title() ?: $gateway->get_method_title(),
						'description' => $gateway->get_description(),
						'icon'        => 'credit-card',
						'is_wc'       => true,
					);
				}
			}
		}

		return $methods;
	}
}
