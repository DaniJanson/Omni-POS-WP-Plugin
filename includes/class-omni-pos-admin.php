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
	 * Get clean direct URL for POS Register
	 */
	public static function get_pos_url() {
		return home_url( '/omni_pos' );
	}

	/**
	 * Get clean direct URL for Omni POS Standalone Admin Hub
	 */
	public static function get_admin_hub_url() {
		return home_url( '/omni_pos?view=admin' );
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
		register_setting( 'omni_pos_settings_group', 'omni_pos_inventory_mode', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		register_setting( 'omni_pos_settings_group', 'omni_pos_store_phone', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		register_setting( 'omni_pos_settings_group', 'omni_pos_store_tax_id', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		register_setting( 'omni_pos_settings_group', 'omni_pos_receipt_header', array( 'sanitize_callback' => 'sanitize_textarea_field' ) );
		register_setting( 'omni_pos_settings_group', 'omni_pos_receipt_footer', array( 'sanitize_callback' => 'sanitize_textarea_field' ) );
		register_setting( 'omni_pos_settings_group', 'omni_pos_auto_print', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		register_setting( 'omni_pos_settings_group', 'omni_pos_sound_effects', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		register_setting( 'omni_pos_settings_group', 'omni_pos_low_stock_threshold', array( 'sanitize_callback' => 'absint' ) );
		register_setting( 'omni_pos_settings_group', 'omni_pos_enable_discounts', array( 'sanitize_callback' => 'sanitize_text_field' ) );
		register_setting( 'omni_pos_settings_group', 'omni_pos_enable_custom_price', array( 'sanitize_callback' => 'sanitize_text_field' ) );
	}

	/**
	 * Render Launcher Dashboard Page
	 */
	public static function render_admin_page() {
		$launch_url   = self::get_pos_url();
		$admin_hub_url = self::get_admin_hub_url();
		$inventory_mode = get_option( 'omni_pos_inventory_mode', 'woocommerce' );
		?>
		<div class="wrap" style="max-width: 960px; margin-top: 30px;">
			<div style="background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; text-align: center;">
				<div style="display: inline-flex; align-items: center; justify-content: center; width: 68px; height: 68px; border-radius: 20px; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #fff; margin-bottom: 20px; font-size: 32px; box-shadow: 0 8px 24px rgba(37,99,235,0.3);">
					⚡
				</div>
				<h1 style="font-size: 30px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; letter-spacing: -0.5px;"><?php esc_html_e( 'Omni POS — Ultra Fast Point of Sale & Management', 'omni-pos' ); ?></h1>
				<p style="font-size: 16px; color: #64748b; margin-bottom: 28px; max-width: 620px; margin-left: auto; margin-right: auto; line-height: 1.6;">
					<?php esc_html_e( 'Lightweight, ultra-fast React + IndexedDB Point of Sale with a standalone modern Admin Panel, local barcode scanning, and instant receipt printing.', 'omni-pos' ); ?>
				</p>

					<!-- Launch Buttons -->
				<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px;">
					<a href="<?php echo esc_url( $launch_url ); ?>" target="_blank" style="display: inline-flex; align-items: center; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 16px rgba(37,99,235,0.35); transition: all 0.2s;">
						🏪 <span style="margin-left: 8px;"><?php esc_html_e( 'Open POS Register', 'omni-pos' ); ?></span>
					</a>

					<?php if ( 'omni_pos' === $inventory_mode && ( current_user_can( 'manage_woocommerce' ) || current_user_can( 'manage_options' ) ) ) : ?>
					<a href="<?php echo esc_url( $admin_hub_url ); ?>" target="_blank" style="display: inline-flex; align-items: center; background: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 16px rgba(15,23,42,0.25); transition: all 0.2s;">
						🛡️ <span style="margin-left: 8px;"><?php esc_html_e( 'Open Omni Admin Hub', 'omni-pos' ); ?></span>
					</a>
					<?php endif; ?>
				</div>

				<div style="display: inline-flex; align-items: center; background: #f8fafc; padding: 8px 18px; border-radius: 10px; font-family: monospace; font-size: 13px; color: #334155; border: 1px solid #e2e8f0;">
					<span style="color: #64748b; margin-right: 8px;"><?php esc_html_e( 'Inventory Management Mode:', 'omni-pos' ); ?></span>
					<strong style="color: #2563eb; text-transform: uppercase;"><?php echo esc_html( $inventory_mode === 'omni_pos' ? __( 'Omni POS Direct Control', 'omni-pos' ) : __( 'WooCommerce Standard', 'omni-pos' ) ); ?></strong>
				</div>

				<div style="margin-top: 40px; padding-top: 28px; border-top: 1px solid #f1f5f9; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: left;">
					<div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
						<strong style="color: #0f172a; display: block; margin-bottom: 6px; font-size: 15px;">⚡ <?php esc_html_e( 'Instant Local Cache', 'omni-pos' ); ?></strong>
						<span style="font-size: 13px; color: #64748b; line-height: 1.5;"><?php esc_html_e( 'IndexedDB cache delivers <3ms product searches and zero lag under high traffic.', 'omni-pos' ); ?></span>
					</div>
					<div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
						<strong style="color: #0f172a; display: block; margin-bottom: 6px; font-size: 15px;">🛡️ <?php esc_html_e( 'Standalone Admin Hub', 'omni-pos' ); ?></strong>
						<span style="font-size: 13px; color: #64748b; line-height: 1.5;"><?php esc_html_e( 'Manage catalog, stock adjustments, shifts, cashiers and analytics without wp-admin.', 'omni-pos' ); ?></span>
					</div>
					<div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
						<strong style="color: #0f172a; display: block; margin-bottom: 6px; font-size: 15px;">🧾 <?php esc_html_e( '80mm Thermal Receipt', 'omni-pos' ); ?></strong>
						<span style="font-size: 13px; color: #64748b; line-height: 1.5;"><?php esc_html_e( 'Ultra fast clean receipt output customized with store details, barcode and VAT info.', 'omni-pos' ); ?></span>
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
		$admin_hub_url = self::get_admin_hub_url();
		?>
		<div class="wrap" style="max-width: 860px;">
			<div style="display: flex; align-items: center; justify-content: space-between; margin-top: 20px; margin-bottom: 20px;">
				<h1 style="margin: 0; font-size: 24px; font-weight: 700;">⚙️ <?php esc_html_e( 'Omni POS Settings', 'omni-pos' ); ?></h1>
				<a href="<?php echo esc_url( $admin_hub_url ); ?>" target="_blank" class="button button-primary" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600; padding: 4px 16px; height: auto;">
					🛡️ <?php esc_html_e( 'Open Omni Admin Hub', 'omni-pos' ); ?>
				</a>
			</div>

			<form method="post" action="options.php" style="background: #fff; padding: 28px; border-radius: 12px; border: 1px solid #ccd0d4; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
				<?php
				settings_fields( 'omni_pos_settings_group' );
				do_settings_sections( 'omni_pos_settings_group' );
				$inventory_mode = get_option( 'omni_pos_inventory_mode', 'woocommerce' );
				?>
				<h2 style="margin-top: 0; font-size: 17px; font-weight: 600; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;"><?php esc_html_e( '📦 Management Mode & General', 'omni-pos' ); ?></h2>
				<table class="form-table">
					<tr valign="top">
						<th scope="row"><?php esc_html_e( 'Inventory & Products Control', 'omni-pos' ); ?></th>
						<td>
							<fieldset>
								<label style="display: block; margin-bottom: 8px;">
									<input type="radio" name="omni_pos_inventory_mode" value="woocommerce" <?php checked( $inventory_mode, 'woocommerce' ); ?> />
									<strong><?php esc_html_e( 'WooCommerce Standard', 'omni-pos' ); ?></strong>
									<span class="description" style="display: block; margin-left: 24px;"><?php esc_html_e( 'Products and stock levels are primarily managed via default WooCommerce Products menu.', 'omni-pos' ); ?></span>
								</label>
								<label style="display: block; margin-top: 10px;">
									<input type="radio" name="omni_pos_inventory_mode" value="omni_pos" <?php checked( $inventory_mode, 'omni_pos' ); ?> />
									<strong><?php esc_html_e( 'Omni POS Direct Control (Recommended for Retail)', 'omni-pos' ); ?></strong>
									<span class="description" style="display: block; margin-left: 24px;"><?php esc_html_e( 'Enables direct rapid stock adjustment, barcode management, and POS-tailored catalog tools in Omni Admin Hub.', 'omni-pos' ); ?></span>
								</label>
							</fieldset>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row"><?php esc_html_e( 'Low Stock Alert Threshold', 'omni-pos' ); ?></th>
						<td>
							<input type="number" min="1" max="1000" name="omni_pos_low_stock_threshold" value="<?php echo esc_attr( get_option( 'omni_pos_low_stock_threshold', 5 ) ); ?>" class="small-text" />
							<p class="description"><?php esc_html_e( 'Show warning badge in POS and Admin Hub when item stock falls to or below this quantity.', 'omni-pos' ); ?></p>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row"><?php esc_html_e( 'Direct POS Register URL', 'omni-pos' ); ?></th>
						<td>
							<code><a href="<?php echo esc_url( self::get_pos_url() ); ?>" target="_blank"><?php echo esc_html( self::get_pos_url() ); ?></a></code>
							<p class="description"><?php esc_html_e( 'Direct cashier register link.', 'omni-pos' ); ?></p>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row"><?php esc_html_e( 'Direct Admin Hub URL', 'omni-pos' ); ?></th>
						<td>
							<code><a href="<?php echo esc_url( $admin_hub_url ); ?>" target="_blank"><?php echo esc_html( $admin_hub_url ); ?></a></code>
							<p class="description"><?php esc_html_e( 'Direct standalone manager/admin panel link.', 'omni-pos' ); ?></p>
						</td>
					</tr>
				</table>

				<h2 style="margin-top: 24px; font-size: 17px; font-weight: 600; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;"><?php esc_html_e( '🧾 Receipt & Hardware', 'omni-pos' ); ?></h2>
				<table class="form-table">
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
		if ( class_exists( 'Omni_POS_I18n' ) ) {
			return Omni_POS_I18n::get_resolved_translations();
		}
		return array();
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

		// Register BPG DejaVu Sans & Google Fonts
		wp_enqueue_style(
			'omni-pos-font-dejavu',
			'https://cdn.web-fonts.ge/fonts/bpg-dejavu-sans/css/bpg-dejavu-sans.min.css',
			array(),
			OMNI_POS_VERSION
		);
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

			// Enqueue CSS with automatic cache busting
			foreach ( $css_files as $idx => $css_rel ) {
				$css_ver = file_exists( $build_dir . $css_rel ) ? (string) filemtime( $build_dir . $css_rel ) : OMNI_POS_VERSION;
				wp_enqueue_style(
					'omni-pos-app-' . $idx,
					$build_url . $css_rel,
					array(),
					$css_ver
				);
			}

			// Enqueue JS with localized configuration
			if ( $js_file ) {
				$js_ver = file_exists( $build_dir . $js_file ) ? (string) filemtime( $build_dir . $js_file ) : OMNI_POS_VERSION;
				wp_enqueue_script(
					'omni-pos-app',
					$build_url . $js_file,
					array(),
					$js_ver,
					true
				);

				$requested_view = isset( $_GET['view'] ) ? sanitize_key( $_GET['view'] ) : 'register';
				$is_admin_user  = current_user_can( 'manage_woocommerce' ) || current_user_can( 'manage_options' );
				$inventory_mode = get_option( 'omni_pos_inventory_mode', 'woocommerce' );

				// If admin panel is accessed but WooCommerce Standard mode is active, redirect to POS terminal
				if ( 'admin' === $requested_view && ( 'omni_pos' !== $inventory_mode || ! $is_admin_user ) ) {
					wp_safe_redirect( self::get_pos_url() );
					exit;
				}

				$config_data = array(
					'restUrl'        => $rest_url,
					'posApiUrl'      => $rest_url . 'omni-pos/v1/',
					'nonce'          => $nonce,
					'adminUrl'       => admin_url(),
					'posUrl'         => $pos_url,
					'adminHubUrl'    => self::get_admin_hub_url(),
					'logoutUrl'      => wp_logout_url( $pos_url ),
					'locale'         => get_locale(),
					'version'        => OMNI_POS_VERSION,
					'isAdmin'        => $is_admin_user,
					'inventoryMode'  => $inventory_mode,
					'initialView'    => ( $is_admin_user && 'omni_pos' === $inventory_mode && 'admin' === $requested_view ) ? 'admin' : 'pos',
					'initialTab'     => isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'dashboard',
					'i18n'           => self::get_frontend_translations(),
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
