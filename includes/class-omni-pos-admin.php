<?php
/**
 * Omni POS Admin & App Launcher
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Omni_POS_Admin {

	/**
	 * Init admin hooks
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		
		// Admin actions
		add_action( 'admin_action_omni_pos', array( __CLASS__, 'render_fullscreen_app' ) );
		add_action( 'admin_action_omni_pos_app', array( __CLASS__, 'render_fullscreen_app' ) );

		// Custom short clean URL: /omni_pos
		add_action( 'init', array( __CLASS__, 'register_rewrite_rules' ) );
		add_filter( 'query_vars', array( __CLASS__, 'register_query_vars' ) );
		add_action( 'template_redirect', array( __CLASS__, 'handle_direct_pos_route' ) );

		// Add type="module" to React Vite bundle script
		add_filter( 'script_loader_tag', array( __CLASS__, 'add_module_type_to_script' ), 10, 3 );
	}

	/**
	 * Add type="module" attribute to enqueued Vite script
	 */
	public static function add_module_type_to_script( $tag, $handle, $src ) {
		if ( 'omni-pos-app' === $handle ) {
			$tag = str_replace( '<script ', '<script type="module" ', $tag );
		}
		return $tag;
	}

	/**
	 * Get clean direct URL for POS
	 */
	public static function get_pos_url() {
		return home_url( '/omni_pos' );
	}

	/**
	 * Register clean URL rewrite rules
	 */
	public static function register_rewrite_rules() {
		add_rewrite_rule( '^omni_pos/?$', 'index.php?omni_pos=1', 'top' );
		add_rewrite_rule( '^omni-pos/?$', 'index.php?omni_pos=1', 'top' );
	}

	/**
	 * Register query vars
	 */
	public static function register_query_vars( $vars ) {
		$vars[] = 'omni_pos';
		return $vars;
	}

	/**
	 * Handle direct /omni_pos route
	 */
	public static function handle_direct_pos_route() {
		global $wp_query;

		$is_omni_pos = false;

		if ( get_query_var( 'omni_pos' ) ) {
			$is_omni_pos = true;
		} else {
			$req_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
			$parsed_path = wp_parse_url( $req_uri, PHP_URL_PATH );
			$req = $parsed_path ? trim( $parsed_path, '/' ) : '';
			// Check if URL ends with omni_pos or omni/omni_pos
			if ( preg_match( '/(^|\/)omni_pos$/i', $req ) || preg_match( '/(^|\/)omni-pos$/i', $req ) ) {
				$is_omni_pos = true;
			}
		}

		if ( $is_omni_pos ) {
			// Require login
			if ( ! is_user_logged_in() ) {
				auth_redirect();
				exit;
			}

			// Render POS SPA
			self::render_fullscreen_app();
			exit;
		}
	}

	/**
	 * Add menu in WP Admin sidebar
	 */
	public static function add_admin_menu() {
		// Main Menu Link
		add_menu_page(
			__( 'Omni POS', 'omni-pos' ),
			__( 'Omni POS', 'omni-pos' ),
			'read',
			'omni-pos',
			array( __CLASS__, 'render_admin_page' ),
			'dashicons-store',
			56
		);

		// Submenu Settings
		add_submenu_page(
			'omni-pos',
			__( 'Settings', 'omni-pos' ),
			__( 'Settings', 'omni-pos' ),
			'manage_woocommerce',
			'omni-pos-settings',
			array( __CLASS__, 'render_settings_page' )
		);
	}

	/**
	 * Register settings fields with explicit sanitization callbacks
	 */
	public static function register_settings() {
		register_setting( 'omni_pos_settings_group', 'omni_pos_store_phone', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		register_setting( 'omni_pos_settings_group', 'omni_pos_store_tax_id', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		register_setting( 'omni_pos_settings_group', 'omni_pos_receipt_header', array( 'sanitize_callback' => 'sanitize_textarea_field' ) );
		register_setting( 'omni_pos_settings_group', 'omni_pos_receipt_footer', array( 'sanitize_callback' => 'sanitize_textarea_field' ) );
		register_setting( 'omni_pos_settings_group', 'omni_pos_auto_print', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		register_setting( 'omni_pos_settings_group', 'omni_pos_sound_effects', array( 'sanitize_callback' => 'sanitize_text_field' ) );
	}

	/**
	 * Render Launcher Dashboard Page
	 */
	public static function render_admin_page() {
		$launch_url = self::get_pos_url();
		?>
		<div class="wrap" style="max-width: 900px; margin-top: 30px;">
			<div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; text-align: center;">
				<div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #fff; margin-bottom: 20px; font-size: 30px;">
					🏪
				</div>
				<h1 style="font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 10px 0;"><?php esc_html_e( 'Omni POS — Ultra Fast Point of Sale', 'omni-pos' ); ?></h1>
				<p style="font-size: 16px; color: #64748b; margin-bottom: 24px; max-width: 600px; margin-left: auto; margin-right: auto;">
					<?php esc_html_e( 'React + IndexedDB powered POS system for WooCommerce. Instant local barcode scanning, offline caching, and 80mm thermal receipt printing.', 'omni-pos' ); ?>
				</p>

				<div style="margin-bottom: 28px;">
					<a href="<?php echo esc_url( $launch_url ); ?>" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 36px; font-size: 18px; font-weight: 600; border-radius: 10px; box-shadow: 0 4px 14px rgba(37,99,235,0.4); transition: all 0.2s;">
						🚀 <?php esc_html_e( 'Open POS Register', 'omni-pos' ); ?> (<?php echo esc_html( $launch_url ); ?>)
					</a>
				</div>

				<div style="display: inline-flex; align-items: center; background: #f1f5f9; padding: 8px 16px; border-radius: 8px; font-family: monospace; font-size: 13px; color: #334155; border: 1px solid #cbd5e1;">
					<span style="color: #64748b; margin-right: 8px;">Direct POS Link:</span>
					<strong><a href="<?php echo esc_url( $launch_url ); ?>" target="_blank" style="color: #2563eb; text-decoration: none;"><?php echo esc_html( $launch_url ); ?></a></strong>
				</div>

				<div style="margin-top: 36px; padding-top: 24px; border-top: 1px solid #f1f5f9; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: left;">
					<div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
						<strong style="color: #0f172a; display: block; margin-bottom: 4px;">⚡ <?php esc_html_e( 'Local IndexedDB Cache', 'omni-pos' ); ?></strong>
						<span style="font-size: 13px; color: #64748b;"><?php esc_html_e( 'Catalogue is cached in browser memory for instantaneous (<3ms) response.', 'omni-pos' ); ?></span>
					</div>
					<div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
						<strong style="color: #0f172a; display: block; margin-bottom: 4px;">📷 <?php esc_html_e( 'Hardware Barcode Scanner', 'omni-pos' ); ?></strong>
						<span style="font-size: 13px; color: #64748b;"><?php esc_html_e( 'Global key listener detects 1D/2D hand and presentation scanners.', 'omni-pos' ); ?></span>
					</div>
					<div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
						<strong style="color: #0f172a; display: block; margin-bottom: 4px;">🧾 <?php esc_html_e( '80mm Thermal Receipt', 'omni-pos' ); ?></strong>
						<span style="font-size: 13px; color: #64748b;"><?php esc_html_e( 'Custom print layout for standard POS thermal receipt printers.', 'omni-pos' ); ?></span>
					</div>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Render Settings Page
	 */
	public static function render_settings_page() {
		?>
		<div class="wrap" style="max-width: 800px;">
			<h1>⚙️ <?php esc_html_e( 'Omni POS Settings', 'omni-pos' ); ?></h1>
			<form method="post" action="options.php" style="background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #ccd0d4; margin-top: 16px;">
				<?php
				settings_fields( 'omni_pos_settings_group' );
				do_settings_sections( 'omni_pos_settings_group' );
				?>
				<table class="form-table">
					<tr valign="top">
						<th scope="row"><?php esc_html_e( 'Direct POS URL', 'omni-pos' ); ?></th>
						<td>
							<code><a href="<?php echo esc_url( self::get_pos_url() ); ?>" target="_blank"><?php echo esc_html( self::get_pos_url() ); ?></a></code>
							<p class="description"><?php esc_html_e( 'Use this clean short link to open the POS register directly on cashier terminals.', 'omni-pos' ); ?></p>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row"><?php esc_html_e( 'Store Phone for Receipt', 'omni-pos' ); ?></th>
						<td>
							<input type="text" name="omni_pos_store_phone" value="<?php echo esc_attr( get_option( 'omni_pos_store_phone' ) ); ?>" class="regular-text" placeholder="+1 (555) 000-0000" />
						</td>
					</tr>
					<tr valign="top">
						<th scope="row"><?php esc_html_e( 'Tax ID / Company Number', 'omni-pos' ); ?></th>
						<td>
							<input type="text" name="omni_pos_store_tax_id" value="<?php echo esc_attr( get_option( 'omni_pos_store_tax_id' ) ); ?>" class="regular-text" placeholder="e.g. 12-3456789" />
						</td>
					</tr>
					<tr valign="top">
						<th scope="row"><?php esc_html_e( 'Receipt Header Text', 'omni-pos' ); ?></th>
						<td>
							<textarea name="omni_pos_receipt_header" rows="3" class="large-text"><?php echo esc_textarea( get_option( 'omni_pos_receipt_header', __( "Thank you for your purchase!\nFast & Reliable Service", 'omni-pos' ) ) ); ?></textarea>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row"><?php esc_html_e( 'Receipt Footer Text', 'omni-pos' ); ?></th>
						<td>
							<textarea name="omni_pos_receipt_footer" rows="3" class="large-text"><?php echo esc_textarea( get_option( 'omni_pos_receipt_footer', __( 'Please keep this receipt for warranty and returns.', 'omni-pos' ) ) ); ?></textarea>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row"><?php esc_html_e( 'Auto Print Receipt', 'omni-pos' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="omni_pos_auto_print" value="yes" <?php checked( get_option( 'omni_pos_auto_print' ), 'yes' ); ?> />
								<?php esc_html_e( 'Automatically trigger receipt print dialog upon successful checkout', 'omni-pos' ); ?>
							</label>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row"><?php esc_html_e( 'Sound Effects', 'omni-pos' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="omni_pos_sound_effects" value="yes" <?php checked( get_option( 'omni_pos_sound_effects', 'yes' ), 'yes' ); ?> />
								<?php esc_html_e( 'Enable audio beep for barcode scan and melodic chime on checkout', 'omni-pos' ); ?>
							</label>
						</td>
					</tr>
				</table>
				<?php submit_button( __( 'Save Changes', 'omni-pos' ) ); ?>
			</form>
		</div>
		<?php
	}

	/**
	 * Get Frontend Translation Strings
	 */
	public static function get_frontend_translations() {
		return array(
			'all'                   => __( 'All', 'omni-pos' ),
			'search_placeholder'    => __( 'Search products or scan barcode...', 'omni-pos' ),
			'auto'                  => __( 'Auto', 'omni-pos' ),
			'products_loading'      => __( 'Loading products...', 'omni-pos' ),
			'no_products_found'     => __( 'No products found', 'omni-pos' ),
			'no_products_desc'      => __( 'Try a different search query, change category, or sync catalogue from server.', 'omni-pos' ),
			'full_sync_button'      => __( 'Full Catalogue Sync', 'omni-pos' ),
			'in_stock_unit'         => __( 'units', 'omni-pos' ),
			'out_of_stock'          => __( 'Out of Stock', 'omni-pos' ),
			'variations'            => __( 'variations', 'omni-pos' ),
			'customer'              => __( 'Customer', 'omni-pos' ),
			'walk_in_customer'      => __( 'Walk-in Customer (Guest)', 'omni-pos' ),
			'clear_cart'            => __( 'Clear Cart', 'omni-pos' ),
			'cart_empty'            => __( 'Cart is empty', 'omni-pos' ),
			'cart_empty_desc'       => __( 'Scan a barcode or click a product to add to cart', 'omni-pos' ),
			'subtotal'              => __( 'Subtotal', 'omni-pos' ),
			'discount'              => __( 'Discount', 'omni-pos' ),
			'add_discount'          => __( 'Add discount', 'omni-pos' ),
			'total_payable'         => __( 'Total Payable', 'omni-pos' ),
			'pay'                   => __( 'Pay', 'omni-pos' ),
			'payment_checkout'      => __( 'Payment Checkout', 'omni-pos' ),
			'select_payment_method' => __( 'Select payment method', 'omni-pos' ),
			'payable_amount'        => __( 'Payable Amount', 'omni-pos' ),
			'cash'                  => __( 'Cash', 'omni-pos' ),
			'card'                  => __( 'Credit / Debit Card (POS)', 'omni-pos' ),
			'split'                 => __( 'Split Payment', 'omni-pos' ),
			'tendered_cash'         => __( 'Tendered Cash', 'omni-pos' ),
			'exact'                 => __( 'Exact', 'omni-pos' ),
			'change_due'            => __( 'Change Due:', 'omni-pos' ),
			'order_note'            => __( 'Order note (optional)', 'omni-pos' ),
			'order_note_placeholder'=> __( 'e.g. Table 4, discount applied...', 'omni-pos' ),
			'cancel'                => __( 'Cancel', 'omni-pos' ),
			'processing'            => __( 'Processing...', 'omni-pos' ),
			'complete_payment'      => __( 'Complete Payment', 'omni-pos' ),
			'payment_success'       => __( 'Payment Successful!', 'omni-pos' ),
			'print_receipt'         => __( 'Print Receipt (80mm)', 'omni-pos' ),
			'new_sale'              => __( 'New Sale', 'omni-pos' ),
			'recent_orders'         => __( 'Recent Orders History', 'omni-pos' ),
			'completed_sales'       => __( 'Completed sales list', 'omni-pos' ),
			'order_number'          => __( 'Order #', 'omni-pos' ),
			'date'                  => __( 'Date', 'omni-pos' ),
			'units'                 => __( 'Items', 'omni-pos' ),
			'amount'                => __( 'Total', 'omni-pos' ),
			'status'                => __( 'Status', 'omni-pos' ),
			'select_customer'       => __( 'Select Customer', 'omni-pos' ),
			'attach_customer_desc'  => __( 'Attach customer to this sale', 'omni-pos' ),
			'add_new_customer'      => __( 'Add New Customer', 'omni-pos' ),
			'first_name'            => __( 'First Name', 'omni-pos' ),
			'last_name'             => __( 'Last Name', 'omni-pos' ),
			'phone_number'          => __( 'Phone Number', 'omni-pos' ),
			'email'                 => __( 'Email', 'omni-pos' ),
			'save_and_select'       => __( 'Save & Select', 'omni-pos' ),
			'back'                  => __( 'Back', 'omni-pos' ),
			'syncing'               => __( 'Syncing...', 'omni-pos' ),
			'sync_catalogue'        => __( 'Sync Catalogue', 'omni-pos' ),
			'history'               => __( 'History', 'omni-pos' ),
			'cashier'               => __( 'Cashier', 'omni-pos' ),
			'fullscreen'            => __( 'Fullscreen', 'omni-pos' ),
			'logout'                => __( 'Logout', 'omni-pos' ),
			'offline_ready'         => __( 'Offline Ready (IndexedDB)', 'omni-pos' ),
			'catalogue_synced'      => __( 'Catalogue synced successfully', 'omni-pos' ),
			'sync_error'            => __( 'Sync error', 'omni-pos' ),
			'added_to_cart'         => __( 'Added to cart', 'omni-pos' ),
			'product_not_found'     => __( 'Product not found with barcode', 'omni-pos' ),
			'order_created'         => __( 'Order created successfully!', 'omni-pos' ),
		);
	}

	/**
	 * Render Fullscreen Dedicated POS SPA Wrapper
	 */
	public static function render_fullscreen_app() {
		if ( ! current_user_can( 'read' ) ) {
			wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'omni-pos' ) );
		}

		// Hide WordPress Admin Bar & remove 32px top bump on dedicated POS screen
		add_filter( 'show_admin_bar', '__return_false' );
		remove_action( 'wp_head', '_admin_bar_bump_cb' );

		$nonce     = wp_create_nonce( 'wp_rest' );
		$rest_url  = esc_url_raw( rest_url() );
		$build_dir = OMNI_POS_PATH . 'build/';
		$build_url = OMNI_POS_URL . 'build/';
		$pos_url   = self::get_pos_url();

		$has_build = file_exists( $build_dir . 'index.html' ) || file_exists( $build_dir . 'assets' );

		// Register Google Fonts
		wp_enqueue_style(
			'omni-pos-fonts',
			'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap',
			array(),
			OMNI_POS_VERSION
		);

		// Enqueue Vite Assets
		if ( $has_build ) {
			$manifest_path = $build_dir . '.vite/manifest.json';
			$css_files = array();
			$js_file = '';

			if ( file_exists( $manifest_path ) ) {
				$manifest = json_decode( file_get_contents( $manifest_path ), true );
				if ( isset( $manifest['index.html']['css'] ) ) {
					$css_files = (array) $manifest['index.html']['css'];
				}
				if ( isset( $manifest['index.html']['file'] ) ) {
					$js_file = $manifest['index.html']['file'];
				}
			} else {
				$css_globs = glob( $build_dir . 'assets/*.css' );
				if ( $css_globs ) {
					foreach ( $css_globs as $cg ) {
						$css_files[] = 'assets/' . basename( $cg );
					}
				}
				$js_globs = glob( $build_dir . 'assets/*.js' );
				if ( $js_globs ) {
					$js_file = 'assets/' . basename( $js_globs[0] );
				}
			}

			// Enqueue CSS
			foreach ( $css_files as $idx => $css_rel ) {
				wp_enqueue_style(
					'omni-pos-app-' . $idx,
					$build_url . $css_rel,
					array(),
					OMNI_POS_VERSION
				);
			}

			// Enqueue JS with localized configuration
			if ( $js_file ) {
				wp_enqueue_script(
					'omni-pos-app',
					$build_url . $js_file,
					array(),
					OMNI_POS_VERSION,
					true
				);

				$config_data = array(
					'restUrl'   => $rest_url,
					'posApiUrl' => $rest_url . 'omni-pos/v1/',
					'nonce'     => $nonce,
					'adminUrl'  => admin_url(),
					'posUrl'    => $pos_url,
					'logoutUrl' => wp_logout_url( $pos_url ),
					'locale'    => get_locale(),
					'version'   => OMNI_POS_VERSION,
					'i18n'      => self::get_frontend_translations(),
				);

				$inline_script = 'window.omniPosConfig = ' . wp_json_encode( $config_data ) . ';';
				wp_add_inline_script( 'omni-pos-app', $inline_script, 'before' );
			}
		}

		?>
		<!DOCTYPE html>
		<html lang="<?php echo esc_attr( get_locale() ); ?>">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
			<title><?php esc_html_e( 'Omni POS — Ultra Fast Point of Sale', 'omni-pos' ); ?></title>
			<script>
				(function() {
					var theme = localStorage.getItem('omni_pos_theme');
					if (theme === 'light') {
						document.documentElement.classList.remove('dark');
						document.documentElement.classList.add('light');
					} else {
						document.documentElement.classList.add('dark');
						document.documentElement.classList.remove('light');
					}
				})();
			</script>
			<?php wp_head(); ?>
			<style id="omni-pos-fullscreen-reset">
				html, body {
					margin: 0 !important;
					padding: 0 !important;
					margin-top: 0 !important;
					padding-top: 0 !important;
					height: 100% !important;
					height: 100vh !important;
					height: 100dvh !important;
					overflow: hidden !important;
				}
				#wpadminbar {
					display: none !important;
					height: 0 !important;
					visibility: hidden !important;
				}
			</style>
		</head>
		<body class="bg-slate-100 text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100 antialiased overflow-hidden select-none">
			<div id="root" class="h-screen w-screen">
				<?php if ( ! $has_build ) : ?>
					<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px;">
						<div style="font-size: 50px; margin-bottom: 16px;">⚡</div>
						<h2 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;"><?php esc_html_e( 'Omni POS Backend is Ready!', 'omni-pos' ); ?></h2>
						<p style="color: #94a3b8; max-width: 480px; margin-bottom: 24px;"><?php esc_html_e( 'REST API endpoints registered. Front-End building in progress...', 'omni-pos' ); ?></p>
						<code style="background: #1e293b; padding: 12px 20px; border-radius: 8px; font-family: monospace; color: #38bdf8;">GET <?php echo esc_html( $rest_url . 'omni-pos/v1/init' ); ?></code>
					</div>
				<?php endif; ?>
			</div>
			<?php wp_footer(); ?>
		</body>
		</html>
		<?php
		exit;
	}
}
