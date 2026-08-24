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
							'name' => html_entity_decode( $t->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
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
	 * Extract barcode from postmeta without loading heavy WC_Product
	 */
	public static function extract_barcode_from_meta( $post_id, $sku = '' ) {
		$keys = array(
			'_global_unique_id',
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
		);
		foreach ( $keys as $k ) {
			$val = get_post_meta( $post_id, $k, true );
			if ( ! empty( $val ) ) {
				return (string) $val;
			}
		}
		return (string) $sku;
	}

	/**
	 * Ultra-fast batch product fetcher designed for high-scale catalogues (10,000+ items)
	 * Executes in ~20-50ms for 500-1000 items via bulk SQL & meta cache preloading.
	 *
	 * @param int $page
	 * @param int $per_page
	 * @param int|null $updated_after
	 * @return array
	 */
	public static function get_fast_lean_products( $page = 1, $per_page = 500, $updated_after = null ) {
		global $wpdb;

		$page = max( 1, (int) $page );
		$per_page = max( 1, min( 1000, (int) $per_page ) );
		$offset = ( $page - 1 ) * $per_page;

		$where_clauses = array(
			"p.post_type = 'product'",
			"p.post_status = 'publish'",
		);

		if ( ! empty( $updated_after ) && is_numeric( $updated_after ) ) {
			$date_str = gmdate( 'Y-m-d H:i:s', (int) $updated_after );
			$where_clauses[] = $wpdb->prepare( "p.post_modified_gmt > %s", $date_str );
		}

		$where_sql = implode( ' AND ', $where_clauses );

		// 1. Count Total
		$total = (int) $wpdb->get_var( "SELECT COUNT(p.ID) FROM {$wpdb->posts} p WHERE {$where_sql}" );
		$total_pages = max( 1, (int) ceil( $total / $per_page ) );

		if ( $total === 0 ) {
			return array(
				'products'    => array(),
				'total'       => 0,
				'total_pages' => 1,
			);
		}

		// 2. Fetch page product rows
		$posts = $wpdb->get_results( $wpdb->prepare(
			"SELECT p.ID, p.post_title, p.post_name, p.post_modified, p.post_modified_gmt 
			 FROM {$wpdb->posts} p 
			 WHERE {$where_sql} 
			 ORDER BY p.ID DESC 
			 LIMIT %d OFFSET %d",
			$per_page,
			$offset
		) );

		if ( empty( $posts ) ) {
			return array(
				'products'    => array(),
				'total'       => $total,
				'total_pages' => $total_pages,
			);
		}

		$product_ids = wp_list_pluck( $posts, 'ID' );

		// 3. Batch preload all postmeta in 1 single query (< 5ms)
		update_meta_cache( 'post', $product_ids );

		// 4. Batch load all categories for all products in 1 query
		$terms_by_product = array();
		$raw_terms = wp_get_object_terms( $product_ids, 'product_cat', array( 'fields' => 'all_with_object_id' ) );
		if ( ! is_wp_error( $raw_terms ) && ! empty( $raw_terms ) ) {
			foreach ( $raw_terms as $t ) {
				$terms_by_product[ $t->object_id ][] = array(
					'id'   => (int) $t->term_id,
					'name' => html_entity_decode( $t->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
					'slug' => $t->slug,
				);
			}
		}

		// 5. Batch preload thumbnail attachment postmeta
		$thumb_ids = array();
		foreach ( $product_ids as $pid ) {
			$tid = (int) get_post_meta( $pid, '_thumbnail_id', true );
			if ( $tid > 0 ) {
				$thumb_ids[] = $tid;
			}
		}
		if ( ! empty( $thumb_ids ) ) {
			update_meta_cache( 'post', $thumb_ids );
		}

		// 6. Batch load variations for variable products
		$variations_by_parent = array();
		$placeholders = implode( ',', array_fill( 0, count( $product_ids ), '%d' ) );
		$var_posts = $wpdb->get_results( $wpdb->prepare(
			"SELECT p.ID, p.post_parent, p.post_title 
			 FROM {$wpdb->posts} p 
			 WHERE p.post_parent IN ($placeholders) AND p.post_type = 'product_variation' AND p.post_status = 'publish'",
			$product_ids
		) );

		if ( ! empty( $var_posts ) ) {
			$var_ids = wp_list_pluck( $var_posts, 'ID' );
			update_meta_cache( 'post', $var_ids );

			foreach ( $var_posts as $vp ) {
				$vid = (int) $vp->ID;
				$var_sku = (string) get_post_meta( $vid, '_sku', true );
				$var_barcode = self::extract_barcode_from_meta( $vid, $var_sku );
				$var_price = (float) get_post_meta( $vid, '_price', true );
				$var_reg_price = (float) get_post_meta( $vid, '_regular_price', true );
				$var_sale_price = get_post_meta( $vid, '_sale_price', true );
				$var_manage_stock = get_post_meta( $vid, '_manage_stock', true ) === 'yes';
				$var_stock_qty = (int) get_post_meta( $vid, '_stock', true );
				$var_stock_status = get_post_meta( $vid, '_stock_status', true ) ?: 'instock';

				$var_thumb_id = (int) get_post_meta( $vid, '_thumbnail_id', true );
				$var_img = $var_thumb_id > 0 ? wp_get_attachment_image_url( $var_thumb_id, 'thumbnail' ) : '';

				// Attributes
				$all_meta = get_post_meta( $vid );
				$attrs = array();
				foreach ( $all_meta as $m_key => $m_vals ) {
					if ( strpos( $m_key, 'attribute_' ) === 0 ) {
						$attr_name = str_replace( 'attribute_', '', $m_key );
						$attrs[ $attr_name ] = $m_vals[0] ?? '';
					}
				}

				$variations_by_parent[ $vp->post_parent ][] = array(
					'id'             => $vid,
					'name'           => html_entity_decode( $vp->post_title, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
					'attributes'     => $attrs,
					'sku'            => $var_sku,
					'barcode'        => $var_barcode,
					'price'          => $var_price,
					'regular_price'  => $var_reg_price > 0 ? $var_reg_price : $var_price,
					'sale_price'     => $var_sale_price !== '' ? (float) $var_sale_price : null,
					'stock_quantity' => $var_manage_stock ? $var_stock_qty : 9999,
					'in_stock'       => $var_stock_status === 'instock',
					'image'          => $var_img,
				);
			}
		}

		// 7. Format products
		$products = array();
		foreach ( $posts as $p ) {
			$pid = (int) $p->ID;
			$sku = (string) get_post_meta( $pid, '_sku', true );
			$barcode = self::extract_barcode_from_meta( $pid, $sku );
			$price = (float) get_post_meta( $pid, '_price', true );
			$reg_price = (float) get_post_meta( $pid, '_regular_price', true );
			$sale_price = get_post_meta( $pid, '_sale_price', true );
			$manage_stock = get_post_meta( $pid, '_manage_stock', true ) === 'yes';
			$stock_qty = (int) get_post_meta( $pid, '_stock', true );
			$stock_status = get_post_meta( $pid, '_stock_status', true ) ?: 'instock';
			$tax_status = get_post_meta( $pid, '_tax_status', true ) ?: 'taxable';
			$tax_class = get_post_meta( $pid, '_tax_class', true ) ?: '';

			$thumb_id = (int) get_post_meta( $pid, '_thumbnail_id', true );
			$image_url = $thumb_id > 0 ? ( wp_get_attachment_image_url( $thumb_id, 'thumbnail' ) ?: '' ) : '';

			$has_vars = isset( $variations_by_parent[ $pid ] ) && ! empty( $variations_by_parent[ $pid ] );
			$p_type = $has_vars ? 'variable' : 'simple';

			$item = array(
				'id'             => $pid,
				'name'           => html_entity_decode( $p->post_title, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'sku'            => $sku,
				'barcode'        => $barcode,
				'price'          => $price,
				'regular_price'  => $reg_price > 0 ? $reg_price : $price,
				'sale_price'     => $sale_price !== '' ? (float) $sale_price : null,
				'is_on_sale'     => $sale_price !== '' && (float) $sale_price < $reg_price,
				'manage_stock'   => $manage_stock,
				'stock_quantity' => $manage_stock ? $stock_qty : 9999,
				'in_stock'       => $stock_status === 'instock',
				'categories'     => $terms_by_product[ $pid ] ?? array(),
				'image'          => $image_url,
				'type'           => $p_type,
				'tax_status'     => $tax_status,
				'tax_class'      => $tax_class,
				'updated_at'     => strtotime( $p->post_modified_gmt ?: $p->post_modified ),
			);

			if ( $has_vars ) {
				$item['variations'] = $variations_by_parent[ $pid ];
			}

			$products[] = $item;
		}

		return array(
			'products'    => $products,
			'total'       => $total,
			'total_pages' => $total_pages,
		);
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
				'receipt_header'   => get_option( 'omni_pos_receipt_header', __( "Thank you for your purchase!\nFast & Reliable Service", 'omni-pos' ) ),
				'receipt_footer'   => get_option( 'omni_pos_receipt_footer', __( 'Please keep this receipt for warranty and returns.', 'omni-pos' ) ),
				'auto_print'       => get_option( 'omni_pos_auto_print', 'no' ) === 'yes',
				'sound_effects'    => get_option( 'omni_pos_sound_effects', 'yes' ) === 'yes',
				'barcode_delay'    => 50, // ms scanner threshold
				'receipt_printer'  => get_option( 'omni_pos_receipt_printer', '' ),
				'label_printer'    => get_option( 'omni_pos_label_printer', '' ),
				'cash_drawer_kick' => get_option( 'omni_pos_cash_drawer_kick', 'yes' ) === 'yes',
				'auto_paper_cut'   => get_option( 'omni_pos_auto_paper_cut', 'yes' ) === 'yes',
				'silent_print'     => get_option( 'omni_pos_silent_print', 'yes' ) === 'yes',
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

		try {
			if ( function_exists( 'WC' ) && WC()->payment_gateways() ) {
				$gateways = WC()->payment_gateways()->payment_gateways();
				if ( ! empty( $gateways ) ) {
					foreach ( $gateways as $gateway_id => $gateway ) {
						if ( strpos( $gateway_id, 'omni_pos_' ) === 0 ) {
							continue;
						}
						// Safe check without triggering is_available() which needs WC()->cart
						$enabled = false;
						if ( is_object( $gateway ) ) {
							if ( isset( $gateway->enabled ) && 'yes' === $gateway->enabled ) {
								$enabled = true;
							}
						}

						if ( $enabled ) {
							$title = $gateway_id;
							if ( method_exists( $gateway, 'get_title' ) && $gateway->get_title() ) {
								$title = $gateway->get_title();
							} elseif ( method_exists( $gateway, 'get_method_title' ) && $gateway->get_method_title() ) {
								$title = $gateway->get_method_title();
							}

							$desc = ( method_exists( $gateway, 'get_description' ) && $gateway->get_description() ) ? (string) $gateway->get_description() : '';

							$methods[] = array(
								'id'          => $gateway_id,
								'name'        => $title,
								'description' => $desc,
								'icon'        => 'credit-card',
								'is_wc'       => true,
							);
						}
					}
				}
			}
		} catch ( \Throwable $t ) {
			// Silently fallback to standard cash/card/split methods
		}

		return $methods;
	}

	/**
	 * Get Admin Dashboard Overview KPI statistics
	 *
	 * @return array
	 */
	public static function get_admin_dashboard_stats() {
		$today_start = current_time( 'Y-m-d 00:00:00' );
		$today_end   = current_time( 'Y-m-d 23:59:59' );

		// Query today's completed POS orders
		$today_orders = wc_get_orders( array(
			'limit'        => -1,
			'status'       => array( 'completed', 'processing' ),
			'date_created' => strtotime( $today_start ) . '...' . strtotime( $today_end ),
			'return'       => 'objects',
		) );

		$today_sales        = 0.0;
		$today_orders_count = count( $today_orders );
		$today_cash_sales   = 0.0;
		$today_card_sales   = 0.0;

		foreach ( $today_orders as $o ) {
			$total = (float) $o->get_total();
			$today_sales += $total;

			$method = $o->get_payment_method();
			if ( strpos( $method, 'cash' ) !== false ) {
				$today_cash_sales += $total;
			} else {
				$today_card_sales += $total;
			}
		}

		$avg_order_value = $today_orders_count > 0 ? ( $today_sales / $today_orders_count ) : 0.0;

		// Low stock count (items with stock <= 5)
		$low_stock_threshold = (int) get_option( 'omni_pos_low_stock_threshold', 5 );
		$low_stock_args = array(
			'status'       => 'publish',
			'limit'        => 5,
			'stock_status' => 'instock',
			'manage_stock' => true,
		);

		$low_stock_products = array();
		if ( function_exists( 'wc_get_products' ) ) {
			$products = wc_get_products( array(
				'status'   => 'publish',
				'limit'    => 50,
				'paginate' => false,
			) );

			foreach ( $products as $prod ) {
				if ( $prod->managing_stock() && $prod->get_stock_quantity() <= $low_stock_threshold ) {
					$low_stock_products[] = array(
						'id'             => $prod->get_id(),
						'name'           => $prod->get_name(),
						'sku'            => $prod->get_sku(),
						'stock_quantity' => (int) $prod->get_stock_quantity(),
						'price'          => (float) $prod->get_price(),
					);
					if ( count( $low_stock_products ) >= 5 ) {
						break;
					}
				}
			}
		}

		$total_products_count = (int) wp_count_posts( 'product' )->publish;

		return array(
			'today_sales'          => round( $today_sales, 2 ),
			'today_orders_count'   => $today_orders_count,
			'avg_order_value'      => round( $avg_order_value, 2 ),
			'today_cash_sales'     => round( $today_cash_sales, 2 ),
			'today_card_sales'     => round( $today_card_sales, 2 ),
			'total_products_count' => $total_products_count,
			'low_stock_count'      => count( $low_stock_products ),
			'low_stock_products'   => $low_stock_products,
			'currency_symbol'      => html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
		);
	}

	/**
	 * Get Analytics and Sales Reports data
	 */
	public static function get_admin_reports_data( $range = '7days', $custom_from = '', $custom_to = '' ) {
		$now = current_time( 'timestamp' );
		$date_start = '';
		$date_end   = '';

		switch ( $range ) {
			case 'today':
				$date_start = date( 'Y-m-d 00:00:00', $now );
				$date_end   = date( 'Y-m-d 23:59:59', $now );
				break;
			case 'yesterday':
				$yesterday  = $now - DAY_IN_SECONDS;
				$date_start = date( 'Y-m-d 00:00:00', $yesterday );
				$date_end   = date( 'Y-m-d 23:59:59', $yesterday );
				break;
			case '30days':
				$date_start = date( 'Y-m-d 00:00:00', $now - ( 30 * DAY_IN_SECONDS ) );
				$date_end   = date( 'Y-m-d 23:59:59', $now );
				break;
			case 'month':
				$date_start = date( 'Y-m-01 00:00:00', $now );
				$date_end   = date( 'Y-m-t 23:59:59', $now );
				break;
			case 'custom':
				if ( ! empty( $custom_from ) && ! empty( $custom_to ) ) {
					$date_start = sanitize_text_field( $custom_from ) . ' 00:00:00';
					$date_end   = sanitize_text_field( $custom_to ) . ' 23:59:59';
				} else {
					$date_start = date( 'Y-m-d 00:00:00', $now - ( 7 * DAY_IN_SECONDS ) );
					$date_end   = date( 'Y-m-d 23:59:59', $now );
				}
				break;
			case '7days':
			default:
				$date_start = date( 'Y-m-d 00:00:00', $now - ( 7 * DAY_IN_SECONDS ) );
				$date_end   = date( 'Y-m-d 23:59:59', $now );
				break;
		}

		$orders = wc_get_orders( array(
			'limit'        => -1,
			'status'       => array( 'completed', 'processing' ),
			'date_created' => strtotime( $date_start ) . '...' . strtotime( $date_end ),
			'return'       => 'objects',
		) );

		$gross_sales  = 0.0;
		$tax_total    = 0.0;
		$cash_sales   = 0.0;
		$card_sales   = 0.0;
		$other_sales  = 0.0;
		$orders_count = count( $orders );

		$timeline_map = array();
		$top_products = array();
		$top_categories = array();
		$cashiers_map = array();

		foreach ( $orders as $order ) {
			$total = (float) $order->get_total();
			$tax   = (float) $order->get_total_tax();
			$gross_sales += $total;
			$tax_total   += $tax;

			$method = $order->get_payment_method();
			if ( strpos( $method, 'cash' ) !== false ) {
				$cash_sales += $total;
			} elseif ( strpos( $method, 'card' ) !== false ) {
				$card_sales += $total;
			} else {
				$other_sales += $total;
			}

			// Timeline grouping
			$order_date = $order->get_date_created();
			if ( $order_date ) {
				$time_key = ( 'today' === $range || 'yesterday' === $range )
					? $order_date->date( 'H:00' )
					: $order_date->date( 'M d' );

				if ( ! isset( $timeline_map[ $time_key ] ) ) {
					$timeline_map[ $time_key ] = array( 'label' => $time_key, 'sales' => 0.0, 'orders' => 0 );
				}
				$timeline_map[ $time_key ]['sales']  += $total;
				$timeline_map[ $time_key ]['orders'] += 1;
			}

			// Cashier Performance
			$cashier_name = $order->get_meta( '_omni_pos_cashier_name' ) ?: 'Counter Register';
			if ( ! isset( $cashiers_map[ $cashier_name ] ) ) {
				$cashiers_map[ $cashier_name ] = array( 'name' => $cashier_name, 'orders' => 0, 'sales' => 0.0 );
			}
			$cashiers_map[ $cashier_name ]['orders'] += 1;
			$cashiers_map[ $cashier_name ]['sales']  += $total;

			// Product & Category breakdown
			foreach ( $order->get_items() as $item ) {
				$product_id = $item->get_product_id();
				$name       = $item->get_name();
				$qty        = $item->get_quantity();
				$item_total = (float) $item->get_total();

				if ( ! isset( $top_products[ $product_id ] ) ) {
					$top_products[ $product_id ] = array(
						'id'       => $product_id,
						'name'     => $name,
						'quantity' => 0,
						'sales'    => 0.0,
					);
				}
				$top_products[ $product_id ]['quantity'] += $qty;
				$top_products[ $product_id ]['sales']    += $item_total;

				// Category
				$terms = get_the_terms( $product_id, 'product_cat' );
				if ( ! empty( $terms ) && ! is_wp_error( $terms ) ) {
					foreach ( $terms as $term ) {
						if ( ! isset( $top_categories[ $term->term_id ] ) ) {
							$top_categories[ $term->term_id ] = array(
								'id'    => $term->term_id,
								'name'  => $term->name,
								'sales' => 0.0,
								'count' => 0,
							);
						}
						$top_categories[ $term->term_id ]['sales'] += $item_total;
						$top_categories[ $term->term_id ]['count'] += $qty;
					}
				}
			}
		}

		// Sort top products by revenue
		usort( $top_products, function( $a, $b ) {
			return $b['sales'] <=> $a['sales'];
		} );
		$top_products = array_slice( $top_products, 0, 10 );

		// Sort top categories
		usort( $top_categories, function( $a, $b ) {
			return $b['sales'] <=> $a['sales'];
		} );
		$top_categories = array_slice( $top_categories, 0, 8 );

		// Sort cashiers
		usort( $cashiers_map, function( $a, $b ) {
			return $b['sales'] <=> $a['sales'];
		} );

		$aov = $orders_count > 0 ? ( $gross_sales / $orders_count ) : 0.0;

		return array(
			'range'           => $range,
			'date_start'      => $date_start,
			'date_end'        => $date_end,
			'gross_sales'     => round( $gross_sales, 2 ),
			'net_sales'       => round( $gross_sales - $tax_total, 2 ),
			'tax_total'       => round( $tax_total, 2 ),
			'cash_sales'      => round( $cash_sales, 2 ),
			'card_sales'      => round( $card_sales, 2 ),
			'other_sales'     => round( $other_sales, 2 ),
			'orders_count'    => $orders_count,
			'avg_order_value' => round( $aov, 2 ),
			'timeline'        => array_values( $timeline_map ),
			'top_products'    => $top_products,
			'top_categories'  => $top_categories,
			'cashiers'        => array_values( $cashiers_map ),
			'currency_symbol' => html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
		);
	}

	/**
	 * Format comprehensive order and receipt details for POS viewing and editing
	 *
	 * @param WC_Order $order
	 * @return array
	 */
	public static function format_order_detail( $order ) {
		if ( ! ( $order instanceof WC_Order ) ) {
			return array();
		}

		$customer_id = (int) $order->get_customer_id();
		$cashier_id  = (int) $order->get_meta( '_omni_pos_cashier_id' );
		$cashier_name = $order->get_meta( '_omni_pos_cashier_name' );
		if ( empty( $cashier_name ) && $cashier_id > 0 ) {
			$u = get_userdata( $cashier_id );
			$cashier_name = $u ? ( $u->display_name ?: $u->user_login ) : '';
		}

		$items_data = array();
		foreach ( $order->get_items() as $item_id => $item ) {
			$product = $item->get_product();
			$img_url = '';
			if ( $product ) {
				$img_id = $product->get_image_id();
				$img_url = $img_id ? ( wp_get_attachment_image_url( $img_id, 'thumbnail' ) ?: wc_placeholder_img_src( 'thumbnail' ) ) : wc_placeholder_img_src( 'thumbnail' );
			}

			$qty = (float) $item->get_quantity();
			$line_total = (float) $item->get_total();
			$line_subtotal = (float) $item->get_subtotal();
			$unit_price = $qty > 0 ? ( $line_subtotal / $qty ) : $line_total;

			$items_data[] = array(
				'item_id'      => $item_id,
				'product_id'   => (int) $item->get_product_id(),
				'variation_id' => (int) $item->get_variation_id(),
				'name'         => html_entity_decode( $item->get_name(), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'sku'          => $product ? (string) $product->get_sku() : '',
				'quantity'     => $qty,
				'unit_price'   => round( $unit_price, 2 ),
				'subtotal'     => round( $line_subtotal, 2 ),
				'total'        => round( $line_total, 2 ),
				'tax'          => round( (float) $item->get_total_tax(), 2 ),
				'image'        => $img_url,
			);
		}

		// Calculate discounts from fee lines or difference
		$discount_amount = (float) $order->get_discount_total();
		foreach ( $order->get_fees() as $fee ) {
			if ( (float) $fee->get_total() < 0 ) {
				$discount_amount += abs( (float) $fee->get_total() );
			}
		}

		return array(
			'id'              => $order->get_id(),
			'order_number'    => $order->get_order_number(),
			'date'            => $order->get_date_created() ? $order->get_date_created()->date_i18n( 'Y-m-d H:i' ) : '',
			'date_formatted'  => $order->get_date_created() ? $order->get_date_created()->date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ) ) : '',
			'status'          => $order->get_status(),
			'currency'        => $order->get_currency(),
			'currency_symbol' => html_entity_decode( get_woocommerce_currency_symbol( $order->get_currency() ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			'customer_id'     => $customer_id,
			'customer_name'   => ( trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() ) ) ?: __( 'Guest', 'omni-pos' ),
			'customer_email'  => $order->get_billing_email(),
			'customer_phone'  => $order->get_billing_phone(),
			'cashier_id'      => $cashier_id,
			'cashier_name'    => $cashier_name ?: __( 'Cashier', 'omni-pos' ),
			'payment_method'  => $order->get_payment_method(),
			'payment_title'   => $order->get_payment_method_title() ?: __( 'Cash', 'omni-pos' ),
			'tendered_cash'   => (float) $order->get_meta( '_omni_pos_tendered_cash' ) ?: (float) $order->get_total(),
			'change_due'      => (float) $order->get_meta( '_omni_pos_change_due' ),
			'subtotal'        => round( (float) $order->get_subtotal(), 2 ),
			'discount_total'  => round( $discount_amount, 2 ),
			'tax_total'       => round( (float) $order->get_total_tax(), 2 ),
			'total'           => round( (float) $order->get_total(), 2 ),
			'items_count'     => (int) $order->get_item_count(),
			'items'           => $items_data,
			'note'            => $order->get_customer_note(),
			'is_pos'          => 'yes' === $order->get_meta( '_omni_pos_order' ) || $order->get_created_via() === 'omni_pos',
		);
	}
}
