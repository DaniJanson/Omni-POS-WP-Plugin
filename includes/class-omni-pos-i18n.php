<?php
/**
 * Omni POS Internationalization & Translation Manager
 *
 * Provides central translation dictionary, Loco Translate compatibility,
 * built-in language presets (Georgian, English, German, Spanish, French, Russian),
 * and custom in-app merchant string overrides.
 *
 * @package Omni_POS
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Omni_POS_I18n {

	/**
	 * Available Supported Languages
	 */
	public static function get_available_languages() {
		return array(
			array(
				'code'  => 'auto',
				'label' => __( 'Auto (WordPress Default)', 'omni-pos' ),
				'flag'  => '🌐',
			),
			array(
				'code'  => 'ka_GE',
				'label' => 'ქართული (Georgian)',
				'flag'  => '🇬🇪',
			),
			array(
				'code'  => 'en_US',
				'label' => 'English (US)',
				'flag'  => '🇺🇸',
			),
			array(
				'code'  => 'de_DE',
				'label' => 'Deutsch (German)',
				'flag'  => '🇩🇪',
			),
			array(
				'code'  => 'es_ES',
				'label' => 'Español (Spanish)',
				'flag'  => '🇪🇸',
			),
			array(
				'code'  => 'fr_FR',
				'label' => 'Français (French)',
				'flag'  => '🇫🇷',
			),
			array(
				'code'  => 'ru_RU',
				'label' => 'Русский (Russian)',
				'flag'  => '🇷🇺',
			),
		);
	}

	/**
	 * Get Active Locale
	 */
	public static function get_active_language() {
		$saved = get_option( 'omni_pos_language', 'auto' );
		if ( 'auto' === $saved || empty( $saved ) ) {
			return get_locale();
		}
		return $saved;
	}

	/**
	 * Master Dictionary: All UI Strings with category classification
	 */
	public static function get_default_strings() {
		return array(
			// ==========================================
			// 1. General & Navigation
			// ==========================================
			'all'                   => array( 'cat' => 'general', 'en' => 'All' ),
			'search'                => array( 'cat' => 'general', 'en' => 'Search' ),
			'search_placeholder'    => array( 'cat' => 'general', 'en' => 'Search products or scan barcode...' ),
			'auto'                  => array( 'cat' => 'general', 'en' => 'Auto' ),
			'cancel'                => array( 'cat' => 'general', 'en' => 'Cancel' ),
			'save'                  => array( 'cat' => 'general', 'en' => 'Save' ),
			'save_changes'          => array( 'cat' => 'general', 'en' => 'Save Changes' ),
			'delete'                => array( 'cat' => 'general', 'en' => 'Delete' ),
			'edit'                  => array( 'cat' => 'general', 'en' => 'Edit' ),
			'view'                  => array( 'cat' => 'general', 'en' => 'View' ),
			'back'                  => array( 'cat' => 'general', 'en' => 'Back' ),
			'close'                 => array( 'cat' => 'general', 'en' => 'Close' ),
			'actions'               => array( 'cat' => 'general', 'en' => 'Actions' ),
			'status'                => array( 'cat' => 'general', 'en' => 'Status' ),
			'date'                  => array( 'cat' => 'general', 'en' => 'Date' ),
			'total'                 => array( 'cat' => 'general', 'en' => 'Total' ),
			'quantity'              => array( 'cat' => 'general', 'en' => 'Quantity' ),
			'price'                 => array( 'cat' => 'general', 'en' => 'Price' ),
			'items'                 => array( 'cat' => 'general', 'en' => 'Items' ),
			'item'                  => array( 'cat' => 'general', 'en' => 'Item' ),
			'qty'                   => array( 'cat' => 'general', 'en' => 'Qty' ),
			'units'                 => array( 'cat' => 'general', 'en' => 'Units' ),
			'amount'                => array( 'cat' => 'general', 'en' => 'Amount' ),
			'notes'                 => array( 'cat' => 'general', 'en' => 'Notes' ),
			'processing'            => array( 'cat' => 'general', 'en' => 'Processing...' ),
			'loading'               => array( 'cat' => 'general', 'en' => 'Loading...' ),
			'success'               => array( 'cat' => 'general', 'en' => 'Success' ),
			'error'                 => array( 'cat' => 'general', 'en' => 'Error' ),
			'fullscreen'            => array( 'cat' => 'general', 'en' => 'Fullscreen' ),
			'logout'                => array( 'cat' => 'general', 'en' => 'Logout' ),
			'theme'                 => array( 'cat' => 'general', 'en' => 'Theme' ),
			'offline_ready'         => array( 'cat' => 'general', 'en' => 'Offline Ready (IndexedDB)' ),
			'back_to_pos'           => array( 'cat' => 'general', 'en' => 'Back to POS Terminal' ),
			'dashboard'             => array( 'cat' => 'general', 'en' => 'Dashboard' ),
			'receipts_sales'        => array( 'cat' => 'general', 'en' => 'Receipts & Sales' ),
			'suppliers_intake'      => array( 'cat' => 'general', 'en' => 'Suppliers & Intake' ),
			'products_stock'        => array( 'cat' => 'general', 'en' => 'Products & Stock' ),
			'register_shifts_tab'   => array( 'cat' => 'general', 'en' => 'Register & Shifts' ),
			'cashiers_staff'        => array( 'cat' => 'general', 'en' => 'Cashiers & Staff' ),
			'sales_reports_tab'     => array( 'cat' => 'general', 'en' => 'Sales Reports' ),
			'customers_tab'         => array( 'cat' => 'general', 'en' => 'Customers' ),
			'translations_tab'      => array( 'cat' => 'general', 'en' => 'Translations & i18n' ),
			'migration_tab'         => array( 'cat' => 'general', 'en' => 'Data Migration' ),
			'pos_settings_tab'      => array( 'cat' => 'general', 'en' => 'POS Settings' ),
			'open_receipt_manager'  => array( 'cat' => 'general', 'en' => 'Open Receipts Manager' ),

			// ==========================================
			// 2. POS Register & Products
			// ==========================================
			'products_loading'      => array( 'cat' => 'pos', 'en' => 'Loading products...' ),
			'no_products_found'     => array( 'cat' => 'pos', 'en' => 'No products found' ),
			'no_products_desc'      => array( 'cat' => 'pos', 'en' => 'Try a different search query, change category, or sync catalogue from server.' ),
			'full_sync_button'      => array( 'cat' => 'pos', 'en' => 'Full Catalogue Sync' ),
			'sync_catalogue'        => array( 'cat' => 'pos', 'en' => 'Sync Catalogue' ),
			'syncing'               => array( 'cat' => 'pos', 'en' => 'Syncing...' ),
			'catalogue_synced'      => array( 'cat' => 'pos', 'en' => 'Catalogue synced successfully' ),
			'in_stock_unit'         => array( 'cat' => 'pos', 'en' => 'units' ),
			'out_of_stock'          => array( 'cat' => 'pos', 'en' => 'Out of Stock' ),
			'in_stock'              => array( 'cat' => 'pos', 'en' => 'In Stock' ),
			'variations'            => array( 'cat' => 'pos', 'en' => 'variations' ),
			'select_variation'      => array( 'cat' => 'pos', 'en' => 'Select Variation' ),
			'sku'                   => array( 'cat' => 'pos', 'en' => 'SKU' ),
			'barcode'               => array( 'cat' => 'pos', 'en' => 'Barcode' ),
			'added_to_cart'         => array( 'cat' => 'pos', 'en' => 'Added to cart' ),
			'product_not_found'     => array( 'cat' => 'pos', 'en' => 'Product not found with barcode' ),
			'cost_price'            => array( 'cat' => 'pos', 'en' => 'Cost Price' ),
			'regular_price'         => array( 'cat' => 'pos', 'en' => 'Regular Price' ),
			'sale_price'            => array( 'cat' => 'pos', 'en' => 'Sale Price' ),

			// ==========================================
			// 3. Cart & Customer
			// ==========================================
			'cart_empty'            => array( 'cat' => 'cart', 'en' => 'Cart is empty' ),
			'cart_empty_desc'       => array( 'cat' => 'cart', 'en' => 'Scan a barcode or click a product to add to cart' ),
			'clear_cart'            => array( 'cat' => 'cart', 'en' => 'Clear Cart' ),
			'subtotal'              => array( 'cat' => 'cart', 'en' => 'Subtotal' ),
			'tax'                   => array( 'cat' => 'cart', 'en' => 'Tax / VAT' ),
			'discount'              => array( 'cat' => 'cart', 'en' => 'Discount' ),
			'add_discount'          => array( 'cat' => 'cart', 'en' => 'Add discount' ),
			'apply_discount'        => array( 'cat' => 'cart', 'en' => 'Apply Discount' ),
			'discount_percentage'   => array( 'cat' => 'cart', 'en' => 'Percentage (%)' ),
			'discount_fixed'        => array( 'cat' => 'cart', 'en' => 'Fixed Amount' ),
			'total_payable'         => array( 'cat' => 'cart', 'en' => 'Total Payable' ),
			'pay'                   => array( 'cat' => 'cart', 'en' => 'Pay' ),
			'customer'              => array( 'cat' => 'cart', 'en' => 'Customer' ),
			'walk_in_customer'      => array( 'cat' => 'cart', 'en' => 'Walk-in Customer (Guest)' ),
			'select_customer'       => array( 'cat' => 'cart', 'en' => 'Select Customer' ),
			'attach_customer_desc'  => array( 'cat' => 'cart', 'en' => 'Attach customer to this sale' ),
			'add_new_customer'      => array( 'cat' => 'cart', 'en' => 'Add New Customer' ),
			'first_name'            => array( 'cat' => 'cart', 'en' => 'First Name' ),
			'last_name'             => array( 'cat' => 'cart', 'en' => 'Last Name' ),
			'phone_number'          => array( 'cat' => 'cart', 'en' => 'Phone Number' ),
			'email'                 => array( 'cat' => 'cart', 'en' => 'Email' ),
			'save_and_select'       => array( 'cat' => 'cart', 'en' => 'Save & Select' ),
			'order_note'            => array( 'cat' => 'cart', 'en' => 'Order note (optional)' ),
			'order_note_placeholder'=> array( 'cat' => 'cart', 'en' => 'e.g. Table 4, discount applied...' ),

			// ==========================================
			// 4. Checkout & Payment
			// ==========================================
			'payment_checkout'      => array( 'cat' => 'payment', 'en' => 'Payment Checkout' ),
			'select_payment_method' => array( 'cat' => 'payment', 'en' => 'Select payment method' ),
			'payable_amount'        => array( 'cat' => 'payment', 'en' => 'Payable Amount' ),
			'cash'                  => array( 'cat' => 'payment', 'en' => 'Cash' ),
			'card'                  => array( 'cat' => 'payment', 'en' => 'Credit / Debit Card (POS)' ),
			'split'                 => array( 'cat' => 'payment', 'en' => 'Split Payment' ),
			'tendered_cash'         => array( 'cat' => 'payment', 'en' => 'Tendered Cash' ),
			'exact'                 => array( 'cat' => 'payment', 'en' => 'Exact' ),
			'change_due'            => array( 'cat' => 'payment', 'en' => 'Change Due:' ),
			'complete_payment'      => array( 'cat' => 'payment', 'en' => 'Complete Payment' ),
			'payment_success'       => array( 'cat' => 'payment', 'en' => 'Payment Successful!' ),
			'order_created'         => array( 'cat' => 'payment', 'en' => 'Order created successfully!' ),
			'print_receipt'         => array( 'cat' => 'payment', 'en' => 'Print Receipt (80mm)' ),
			'new_sale'              => array( 'cat' => 'payment', 'en' => 'New Sale' ),

			// ==========================================
			// 5. Orders & Receipts
			// ==========================================
			'recent_orders'         => array( 'cat' => 'orders', 'en' => 'Recent Orders History' ),
			'completed_sales'       => array( 'cat' => 'orders', 'en' => 'Completed sales list' ),
			'order_number'          => array( 'cat' => 'orders', 'en' => 'Order #' ),
			'receipt_number'        => array( 'cat' => 'orders', 'en' => 'Receipt #' ),
			'receipt_manager'       => array( 'cat' => 'orders', 'en' => 'Receipts & Sales Manager' ),
			'receipt_details'       => array( 'cat' => 'orders', 'en' => 'Receipt Inspector & Live Editor' ),
			'add_product_to_order'  => array( 'cat' => 'orders', 'en' => 'Add product from catalog...' ),
			'update_order'          => array( 'cat' => 'orders', 'en' => 'Save Order Changes & Recalculate' ),
			'delete_order'          => array( 'cat' => 'orders', 'en' => 'Void / Delete Order' ),
			'reprint_receipt'       => array( 'cat' => 'orders', 'en' => 'Reprint Receipt' ),
			'units_sold'            => array( 'cat' => 'orders', 'en' => 'Units Sold' ),

			// ==========================================
			// 6. Suppliers & Stock Intake
			// ==========================================
			'suppliers'             => array( 'cat' => 'suppliers', 'en' => 'Suppliers & Distribution' ),
			'suppliers_directory'   => array( 'cat' => 'suppliers', 'en' => 'Suppliers Directory' ),
			'stock_inward'          => array( 'cat' => 'suppliers', 'en' => 'Stock Inward & Invoices' ),
			'new_stock_intake'      => array( 'cat' => 'suppliers', 'en' => 'New Stock Intake (მიღება)' ),
			'invoice_number'        => array( 'cat' => 'suppliers', 'en' => 'Invoice / Waybill #' ),
			'supplier_name'         => array( 'cat' => 'suppliers', 'en' => 'Supplier / Distributor' ),
			'date_received'         => array( 'cat' => 'suppliers', 'en' => 'Date Received' ),
			'add_supplier'          => array( 'cat' => 'suppliers', 'en' => 'Add New Supplier' ),
			'edit_supplier'         => array( 'cat' => 'suppliers', 'en' => 'Edit Supplier' ),
			'company_name'          => array( 'cat' => 'suppliers', 'en' => 'Company Name' ),
			'contact_person'        => array( 'cat' => 'suppliers', 'en' => 'Contact Person' ),
			'tax_number'            => array( 'cat' => 'suppliers', 'en' => 'Tax / ID Code' ),
			'receive_stock_btn'     => array( 'cat' => 'suppliers', 'en' => 'Receive Stock & Save Invoice' ),

			// ==========================================
			// 7. Shifts & Cash Register
			// ==========================================
			'cashier'               => array( 'cat' => 'shifts', 'en' => 'Cashier' ),
			'register_shifts'       => array( 'cat' => 'shifts', 'en' => 'Register & Shifts' ),
			'open_shift'            => array( 'cat' => 'shifts', 'en' => 'Open Shift' ),
			'close_shift'           => array( 'cat' => 'shifts', 'en' => 'Close Shift' ),
			'opening_cash'          => array( 'cat' => 'shifts', 'en' => 'Opening Cash Balance' ),
			'closing_cash'          => array( 'cat' => 'shifts', 'en' => 'Closing Cash Counted' ),
			'expected_cash'         => array( 'cat' => 'shifts', 'en' => 'Expected Cash in Drawer' ),
			'cash_difference'       => array( 'cat' => 'shifts', 'en' => 'Difference / Variance' ),
			'x_report'              => array( 'cat' => 'shifts', 'en' => 'X-Report (Mid-Shift Summary)' ),
			'z_report'              => array( 'cat' => 'shifts', 'en' => 'Z-Report (End of Shift)' ),
			'cash_in'               => array( 'cat' => 'shifts', 'en' => 'Cash In (Deposit)' ),
			'cash_out'              => array( 'cat' => 'shifts', 'en' => 'Cash Out (Expense)' ),
			'open_shift_modal_title'=> array( 'cat' => 'shifts', 'en' => 'Open Register Shift' ),
			'close_shift_modal_title'=> array( 'cat' => 'shifts', 'en' => 'Close Register Shift' ),
			'active_shift_in_progress'=> array( 'cat' => 'shifts', 'en' => 'Active Register Shift in Progress' ),
			'resume_shift_desc'     => array( 'cat' => 'shifts', 'en' => 'A previously opened shift is still active on this register. Would you like to continue using this shift or close it and start a new one?' ),
			'continue_shift'        => array( 'cat' => 'shifts', 'en' => 'Continue Active Shift' ),
			'close_and_new'         => array( 'cat' => 'shifts', 'en' => 'Close & Open New Shift' ),
			'opening_float_desc'    => array( 'cat' => 'shifts', 'en' => 'Opening Cash Float (Initial drawer cash)' ),
			'counted_cash_in_drawer'=> array( 'cat' => 'shifts', 'en' => 'Actual Counted Cash in Drawer *' ),
			'exact_match'           => array( 'cat' => 'shifts', 'en' => 'Exact Match (No Discrepancy)' ),
			'cash_over'             => array( 'cat' => 'shifts', 'en' => 'Cash Over' ),
			'cash_short'            => array( 'cat' => 'shifts', 'en' => 'Cash Short' ),
			'closing_notes'         => array( 'cat' => 'shifts', 'en' => 'Closing Notes / Discrepancy Explanation' ),
			'close_shift_btn'       => array( 'cat' => 'shifts', 'en' => 'Close Shift & Generate Z-Report' ),
			'print_z_report'        => array( 'cat' => 'shifts', 'en' => 'Print Z-Report' ),
			'cash_drawer_movement'  => array( 'cat' => 'shifts', 'en' => 'Cash Drawer Movement' ),
			'movement_type'         => array( 'cat' => 'shifts', 'en' => 'Movement Type' ),
			'record_cash_in'        => array( 'cat' => 'shifts', 'en' => 'Record Cash In' ),
			'record_cash_out'       => array( 'cat' => 'shifts', 'en' => 'Record Cash Out' ),
			'pin_switch_title'      => array( 'cat' => 'shifts', 'en' => 'Switch Cashier with PIN' ),
			'enter_pin'             => array( 'cat' => 'shifts', 'en' => 'Enter 4-digit PIN' ),
			'switch_cashier_btn'    => array( 'cat' => 'shifts', 'en' => 'Switch Cashier' ),
			'open_shift_btn'        => array( 'cat' => 'shifts', 'en' => 'Open Shift & Start Selling' ),
			'finish_and_logout'     => array( 'cat' => 'shifts', 'en' => 'Finish & Logout' ),
			'shift_closed_logout_notice' => array( 'cat' => 'shifts', 'en' => 'Shift closed successfully. Print your Z-Report and log out.' ),
			'shift_required_prompt' => array( 'cat' => 'shifts', 'en' => 'Please open a register shift before scanning or selling products!' ),
			'register_shift_locked' => array( 'cat' => 'shifts', 'en' => 'Register Shift is Closed' ),
			'register_shift_locked_desc' => array( 'cat' => 'shifts', 'en' => 'Product sales are locked. Open a register shift with opening float to begin scanning and selling.' ),
			'open_shift_to_sell'    => array( 'cat' => 'shifts', 'en' => 'Open Register Shift' ),
			'select_all'            => array( 'cat' => 'general', 'en' => 'Select All' ),
			'selected_count'        => array( 'cat' => 'general', 'en' => 'Selected' ),
			'bulk_actions'          => array( 'cat' => 'general', 'en' => 'Bulk Actions' ),
			'delete_selected'       => array( 'cat' => 'general', 'en' => 'Delete Selected' ),
			'confirm_bulk_delete'   => array( 'cat' => 'general', 'en' => 'Are you sure you want to delete the selected items?' ),
			'items_deleted_success' => array( 'cat' => 'general', 'en' => 'Selected items deleted successfully!' ),

			// QZ Tray & Hardware Settings
			'hardware_settings'     => array( 'cat' => 'general', 'en' => 'Hardware & Printers (QZ Tray)' ),
			'hardware_tab'          => array( 'cat' => 'general', 'en' => 'Hardware & Printers' ),
			'qz_tray_status'        => array( 'cat' => 'general', 'en' => 'QZ Tray Service Status' ),
			'qz_connected'          => array( 'cat' => 'general', 'en' => 'Connected (Active)' ),
			'qz_connecting'         => array( 'cat' => 'general', 'en' => 'Connecting to QZ Tray...' ),
			'qz_disconnected'       => array( 'cat' => 'general', 'en' => 'Disconnected (Offline)' ),
			'qz_not_running'        => array( 'cat' => 'general', 'en' => 'QZ Tray is not running' ),
			'qz_setup_title'        => array( 'cat' => 'general', 'en' => 'QZ Tray Hardware Bridge' ),
			'qz_setup_desc'         => array( 'cat' => 'general', 'en' => 'Enable instant silent thermal receipt printing, barcode stickers, and automatic cash drawer kick.' ),
			'qz_install_launch_btn' => array( 'cat' => 'general', 'en' => '🚀 Setup & Launch QZ Tray' ),
			'qz_step_download'      => array( 'cat' => 'general', 'en' => '1. Downloading Installer' ),
			'qz_step_launch'        => array( 'cat' => 'general', 'en' => '2. Launching Service' ),
			'qz_step_connect'       => array( 'cat' => 'general', 'en' => '3. Connecting WebSocket Bridge' ),
			'qz_step_ready'         => array( 'cat' => 'general', 'en' => '4. Ready & Connected' ),
			'receipt_printer'       => array( 'cat' => 'general', 'en' => 'Thermal Receipt Printer' ),
			'label_printer'         => array( 'cat' => 'general', 'en' => 'Barcode Sticker Printer' ),
			'select_printer'        => array( 'cat' => 'general', 'en' => 'Select Printer...' ),
			'cash_drawer_kick'      => array( 'cat' => 'general', 'en' => 'Open Cash Drawer on Sale' ),
			'cash_drawer_kick_desc' => array( 'cat' => 'general', 'en' => 'Send pulse signal to open electronic cash drawer upon checkout' ),
			'auto_paper_cut'        => array( 'cat' => 'general', 'en' => 'Auto Paper Cut' ),
			'auto_paper_cut_desc'   => array( 'cat' => 'general', 'en' => 'Send ESC/POS cut command after receipt print' ),
			'silent_print'          => array( 'cat' => 'general', 'en' => 'Silent Printing (No Popups)' ),
			'silent_print_desc'     => array( 'cat' => 'general', 'en' => 'Print receipts instantly via QZ Tray without opening browser print dialog' ),
			'test_print_btn'        => array( 'cat' => 'general', 'en' => '🖨️ Test Print Receipt' ),
			'test_drawer_btn'       => array( 'cat' => 'general', 'en' => '💵 Test Cash Drawer' ),
			'test_print_sent'       => array( 'cat' => 'general', 'en' => 'Test receipt sent to printer!' ),
			'test_drawer_sent'      => array( 'cat' => 'general', 'en' => 'Pulse signal sent to cash drawer!' ),
			'reconnect_qz'          => array( 'cat' => 'general', 'en' => 'Reconnect' ),
			'download_qz_manual'    => array( 'cat' => 'general', 'en' => 'Download Manually' ),
			'qz_running_guide'      => array( 'cat' => 'general', 'en' => 'Make sure QZ Tray is running in your system tray (near clock). Click "Allow" when prompted.' ),

			// NiceLabel & Barcode Hub
			'barcode_hub_title'     => array( 'cat' => 'general', 'en' => 'NiceLabel Barcode & Label Print Hub' ),
			'barcode_hub_btn'       => array( 'cat' => 'general', 'en' => '🏷️ Barcode Print Hub' ),
			'barcode_hub_desc'      => array( 'cat' => 'general', 'en' => 'Select products, set label quantities, and print directly to NiceLabel thermal printers.' ),
			'nicelabel_extension_title' => array( 'cat' => 'general', 'en' => 'NiceLabel & Barcode Thermal Bridge (Chrome Extension)' ),
			'nicelabel_extension_desc'  => array( 'cat' => 'general', 'en' => 'Direct silent label printing to NiceLabel Automation & thermal barcode printers.' ),
			'extension_setup_title' => array( 'cat' => 'general', 'en' => 'Omni NiceLabel Print Extension' ),
			'extension_setup_subtitle' => array( 'cat' => 'general', 'en' => '1-Click Silent Thermal Printing & NiceLabel Bridge' ),
			'extension_active'      => array( 'cat' => 'general', 'en' => 'Chrome Extension Active' ),
			'extension_not_installed' => array( 'cat' => 'general', 'en' => 'Extension Not Detected' ),
			'extension_ready_desc'  => array( 'cat' => 'general', 'en' => 'Ready for direct silent printing to NiceLabel & thermal printers.' ),
			'extension_missing_desc'=> array( 'cat' => 'general', 'en' => 'Please install the extension on this browser to enable 1-click printing.' ),
			'print_queue'           => array( 'cat' => 'general', 'en' => 'Print Queue' ),
			'all_to_stock'          => array( 'cat' => 'general', 'en' => 'All to Stock' ),
			'print_on_nicelabel'    => array( 'cat' => 'general', 'en' => 'Print on NiceLabel' ),
			'install_extension_btn' => array( 'cat' => 'general', 'en' => 'Install Extension' ),
			'reconnect_guide'       => array( 'cat' => 'general', 'en' => 'Reconnect / Guide' ),
			'test_nicelabel_btn'    => array( 'cat' => 'general', 'en' => '🏷️ Test NiceLabel Print' ),
			'recent_10_products'    => array( 'cat' => 'general', 'en' => 'Recent 10 Products' ),
			'search_products_barcode' => array( 'cat' => 'general', 'en' => 'Search by title, barcode, or SKU...' ),

			// ==========================================
			// 8. Reports & Analytics
			// ==========================================
			'sales_reports'         => array( 'cat' => 'reports', 'en' => 'Sales Reports' ),
			'reports_desc'          => array( 'cat' => 'reports', 'en' => 'Real-time financial performance, product sales rankings, cashier breakdown and sales curves.' ),
			'total_revenue'         => array( 'cat' => 'reports', 'en' => 'Total Revenue' ),
			'total_orders'          => array( 'cat' => 'reports', 'en' => 'Total Orders' ),
			'total_receipts'        => array( 'cat' => 'reports', 'en' => 'Total Orders' ),
			'total_sales'           => array( 'cat' => 'reports', 'en' => 'Gross Sales' ),
			'average_order_value'   => array( 'cat' => 'reports', 'en' => 'Average Order Value' ),
			'avg_order_value'       => array( 'cat' => 'reports', 'en' => 'Avg Order Value' ),
			'top_selling_products'  => array( 'cat' => 'reports', 'en' => 'Top Selling Products' ),
			'top_products'          => array( 'cat' => 'reports', 'en' => 'Top Best-Selling Products' ),
			'today'                 => array( 'cat' => 'reports', 'en' => 'Today' ),
			'yesterday'             => array( 'cat' => 'reports', 'en' => 'Yesterday' ),
			'this_week'             => array( 'cat' => 'reports', 'en' => 'This Week' ),
			'this_month'            => array( 'cat' => 'reports', 'en' => 'This Month' ),
			'last_7_days'           => array( 'cat' => 'reports', 'en' => '7 Days' ),
			'last_30_days'          => array( 'cat' => 'reports', 'en' => '30 Days' ),
			'sales_trend_chart'     => array( 'cat' => 'reports', 'en' => 'Revenue Trend Over Time' ),
			'sales_period'          => array( 'cat' => 'reports', 'en' => 'Sales performance for selected period' ),

			// ==========================================
			// 9. Migration & Import
			// ==========================================
			'data_migration'        => array( 'cat' => 'migration', 'en' => 'Data Import & Migration' ),
			'import_hub'            => array( 'cat' => 'migration', 'en' => 'Data Import & Migration Hub' ),
			'import_hub_desc'       => array( 'cat' => 'migration', 'en' => 'Import products, stock, barcodes, categories, suppliers and invoices from VitePOS or JSON backups' ),
			'import_package'        => array( 'cat' => 'migration', 'en' => 'Select JSON Migration Package' ),
			'select_json_file'      => array( 'cat' => 'migration', 'en' => 'Select or Drop your JSON Migration Package' ),
			'import_instructions'   => array( 'cat' => 'migration', 'en' => 'Upload the JSON file exported from the VitePOS Migrator plugin' ),
			'browse_file'           => array( 'cat' => 'migration', 'en' => 'Browse File' ),
			'change_file'           => array( 'cat' => 'migration', 'en' => 'Change File' ),
			'detected_records'      => array( 'cat' => 'migration', 'en' => 'Detected Records in Migration File' ),
			'import_settings'       => array( 'cat' => 'migration', 'en' => 'Import Settings' ),
			'update_existing_records'=> array( 'cat' => 'migration', 'en' => 'Update existing products if SKU or Barcode already exists' ),
			'importing_progress'    => array( 'cat' => 'migration', 'en' => 'Importing data into WooCommerce & Omni POS...' ),
			'start_import_now'      => array( 'cat' => 'migration', 'en' => 'Start Import & Migration Now' ),
			'start_migration'       => array( 'cat' => 'migration', 'en' => 'Start Import & Migration Now' ),
			'migration_completed'   => array( 'cat' => 'migration', 'en' => 'Migration Completed Successfully!' ),
			'import_success'        => array( 'cat' => 'migration', 'en' => 'Migration Completed Successfully!' ),

			// ==========================================
			// 10. Translation Manager
			// ==========================================
			'languages_translations'=> array( 'cat' => 'general', 'en' => 'Language & In-App Translations' ),
			'languages_desc'        => array( 'cat' => 'general', 'en' => 'Scan system strings, add custom phrases, edit translations, or translate with Loco Translate' ),
			'add_custom_string'     => array( 'cat' => 'general', 'en' => 'Add String (დამატება)' ),
			'custom_string_desc'    => array( 'cat' => 'general', 'en' => 'Register a new string key and provide its translation' ),
			'string_key'            => array( 'cat' => 'general', 'en' => 'String Key (Unique Identifier)' ),
			'default_english'       => array( 'cat' => 'general', 'en' => 'Default English' ),
			'active_system_text'    => array( 'cat' => 'general', 'en' => 'Active System Text' ),
			'custom_translation_col'=> array( 'cat' => 'general', 'en' => 'Custom Translation (ხელით თარგმნა)' ),
			'copy_default'          => array( 'cat' => 'general', 'en' => 'Copy active translation into custom input' ),
			'clear_override'        => array( 'cat' => 'general', 'en' => 'Clear custom override' ),
			'string_added_success'  => array( 'cat' => 'general', 'en' => 'Custom string added & saved successfully!' ),
			'scan_system'           => array( 'cat' => 'general', 'en' => 'Scan System' ),
			'scanning'              => array( 'cat' => 'general', 'en' => 'Scanning...' ),
			'auto_translate_all'    => array( 'cat' => 'general', 'en' => 'Auto-Translate All' ),
			'all_strings'           => array( 'cat' => 'general', 'en' => 'All Strings' ),
			'general_ui'            => array( 'cat' => 'general', 'en' => 'General & UI' ),
			'pos_products'          => array( 'cat' => 'general', 'en' => 'POS & Products' ),
			'cart_customer'         => array( 'cat' => 'general', 'en' => 'Cart & Customer' ),
			'checkout_payment'      => array( 'cat' => 'general', 'en' => 'Checkout & Payment' ),
			'orders_receipts'       => array( 'cat' => 'general', 'en' => 'Orders & Receipts' ),
			'shifts_register'       => array( 'cat' => 'general', 'en' => 'Shifts & Register' ),
			'custom_strings'        => array( 'cat' => 'general', 'en' => 'Custom User Strings' ),

			// ==========================================
			// 11. Settings & Admin Forms
			// ==========================================
			'settings_saved'        => array( 'cat' => 'settings', 'en' => 'Settings saved successfully!' ),
			'error_saving_settings' => array( 'cat' => 'settings', 'en' => 'Failed to save settings' ),
			'settings_title'        => array( 'cat' => 'settings', 'en' => 'System & POS Settings' ),
			'settings_desc'         => array( 'cat' => 'settings', 'en' => 'Configure management modes, stock alerts, receipt templates and cashier parameters.' ),
			'inventory_control_mode'=> array( 'cat' => 'settings', 'en' => 'Inventory & Products Control Mode' ),
			'omni_direct_mode'      => array( 'cat' => 'settings', 'en' => 'Omni POS Direct Control (Fastest, Autonomous)' ),
			'wc_standard_mode'      => array( 'cat' => 'settings', 'en' => 'WooCommerce Standard Mode (Synced)' ),
			'store_phone'           => array( 'cat' => 'settings', 'en' => 'Store Phone Number' ),
			'store_tax_id'          => array( 'cat' => 'settings', 'en' => 'Store Tax / ID Code' ),
			'receipt_header_txt'    => array( 'cat' => 'settings', 'en' => 'Receipt Header Text' ),
			'receipt_footer_txt'    => array( 'cat' => 'settings', 'en' => 'Receipt Footer Text' ),
			'auto_print_receipt'    => array( 'cat' => 'settings', 'en' => 'Auto-Print Receipt after checkout' ),
			'sound_effects'         => array( 'cat' => 'settings', 'en' => 'Sound Effects (Beep on barcode scan)' ),
			'low_stock_alert_level' => array( 'cat' => 'settings', 'en' => 'Low Stock Warning Threshold' ),
			'allow_pos_discounts'   => array( 'cat' => 'settings', 'en' => 'Enable Order Discounts at Checkout' ),
			'allow_custom_price'    => array( 'cat' => 'settings', 'en' => 'Allow Custom Price Entry per Item' ),
			'all_settings_updated'  => array( 'cat' => 'settings', 'en' => 'All settings updated and synchronized across terminals!' ),
			'save_settings'         => array( 'cat' => 'settings', 'en' => 'Save Settings' ),

			// ==========================================
			// 12. Dashboard & Cards
			// ==========================================
			'live_pos_hub'          => array( 'cat' => 'dashboard', 'en' => 'Live POS Hub' ),
			'realtime_stats'        => array( 'cat' => 'dashboard', 'en' => 'Real-time stats' ),
			'omni_pos_dashboard'    => array( 'cat' => 'dashboard', 'en' => 'Omni POS Dashboard' ),
			'dashboard_subtitle'    => array( 'cat' => 'dashboard', 'en' => 'Centralized management for registers, inventory levels, cashier shifts, and sales performance.' ),
			'today_sales'           => array( 'cat' => 'dashboard', 'en' => "Today's Sales" ),
			'today_orders'          => array( 'cat' => 'dashboard', 'en' => "Today's Orders" ),
			'per_customer_basket'   => array( 'cat' => 'dashboard', 'en' => 'Per customer basket' ),
			'low_stock_items'       => array( 'cat' => 'dashboard', 'en' => 'Low Stock Items' ),
			'below_threshold'       => array( 'cat' => 'dashboard', 'en' => 'Below threshold (≤ 5 units)' ),
			'stock_alert_health'    => array( 'cat' => 'dashboard', 'en' => 'Stock Alert & Health' ),
			'products_requiring_restock' => array( 'cat' => 'dashboard', 'en' => 'Products requiring restock or attention' ),
			'view_all_products'     => array( 'cat' => 'dashboard', 'en' => 'View all products' ),
			'remaining_stock'       => array( 'cat' => 'dashboard', 'en' => 'Remaining Stock' ),
			'all_stock_healthy'     => array( 'cat' => 'dashboard', 'en' => 'All stock levels look healthy!' ),
			'no_items_below_threshold' => array( 'cat' => 'dashboard', 'en' => 'No items are currently below the low stock threshold.' ),
			'quick_controls'        => array( 'cat' => 'dashboard', 'en' => 'Quick Controls' ),
			'launch_pos_register'   => array( 'cat' => 'dashboard', 'en' => 'Launch POS Register' ),
			'wp_admin_backend'      => array( 'cat' => 'dashboard', 'en' => 'WP Admin Backend' ),
			'performance_metrics'   => array( 'cat' => 'dashboard', 'en' => 'Performance Metrics' ),
			'total_catalog_items'   => array( 'cat' => 'dashboard', 'en' => 'Total Catalog Items' ),
			'indexeddb_lookup'      => array( 'cat' => 'dashboard', 'en' => 'IndexedDB Lookup' ),
			'thermal_output'        => array( 'cat' => 'dashboard', 'en' => 'Thermal Output' ),

			// ==========================================
			// 13. Product Forms & Modals
			// ==========================================
			'add_product'           => array( 'cat' => 'products', 'en' => 'Add Product' ),
			'edit_product'          => array( 'cat' => 'products', 'en' => 'Edit Product' ),
			'product_name'          => array( 'cat' => 'products', 'en' => 'Product Name' ),
			'product_name_placeholder'=> array( 'cat' => 'products', 'en' => 'e.g. Espresso Coffee Beans 1kg' ),
			'generate_barcode'      => array( 'cat' => 'products', 'en' => 'Generate EAN Barcode' ),
			'generating'            => array( 'cat' => 'products', 'en' => 'Generating...' ),
			'manage_stock_checkbox' => array( 'cat' => 'products', 'en' => 'Track stock quantity for this product' ),
			'stock_quantity'        => array( 'cat' => 'products', 'en' => 'Stock Quantity' ),
			'product_category'      => array( 'cat' => 'products', 'en' => 'Product Category' ),
			'select_category'       => array( 'cat' => 'products', 'en' => 'Select Category' ),
			'all_categories'        => array( 'cat' => 'products', 'en' => 'All Categories' ),
			'product_prices'        => array( 'cat' => 'products', 'en' => 'Product Pricing' ),
			'product_saved_success' => array( 'cat' => 'products', 'en' => 'Product saved successfully!' ),
			'product_moved_trash'   => array( 'cat' => 'products', 'en' => 'Product moved to trash' ),
			'barcode_labels'        => array( 'cat' => 'products', 'en' => 'Print Barcode Labels' ),
			'number_of_copies'      => array( 'cat' => 'products', 'en' => 'Number of Copies' ),
			'label_format'          => array( 'cat' => 'products', 'en' => 'Label Format' ),
			'thermal_preview'       => array( 'cat' => 'products', 'en' => 'Thermal Label Preview' ),
			'categories'            => array( 'cat' => 'products', 'en' => 'Categories' ),
			'products'              => array( 'cat' => 'products', 'en' => 'Products' ),

			// ==========================================
			// 14. Cashiers & Customers Forms
			// ==========================================
			'add_cashier'           => array( 'cat' => 'cashiers', 'en' => 'Add Cashier' ),
			'edit_cashier'          => array( 'cat' => 'cashiers', 'en' => 'Edit Cashier' ),
			'username'              => array( 'cat' => 'cashiers', 'en' => 'Username / Login' ),
			'cashier_pin'           => array( 'cat' => 'cashiers', 'en' => 'Cashier PIN Code (4 digits)' ),
			'max_discount_allowed'  => array( 'cat' => 'cashiers', 'en' => 'Max Discount Allowed (%)' ),
			'can_refund_orders'     => array( 'cat' => 'cashiers', 'en' => 'Can Refund / Void Orders' ),
			'total_spent'           => array( 'cat' => 'customers', 'en' => 'Total Spent' ),
			'orders_placed'         => array( 'cat' => 'customers', 'en' => 'Orders Placed' ),
			'customer_details'      => array( 'cat' => 'customers', 'en' => 'Customer Details' ),
			'address'               => array( 'cat' => 'customers', 'en' => 'Address' ),
			'city'                  => array( 'cat' => 'customers', 'en' => 'City' ),

			// Shifts helpers
			'no_shift_open'         => array( 'cat' => 'shifts', 'en' => 'No Active Shift Open' ),
			'active_shift'          => array( 'cat' => 'shifts', 'en' => 'Current Register Shift' ),
			'start_shift_prompt'    => array( 'cat' => 'shifts', 'en' => 'Start a shift with opening cash float to begin register tracking.' ),
			'close_shift_z_report'  => array( 'cat' => 'shifts', 'en' => 'Close Shift & Z-Report' ),
			'cash_movements'        => array( 'cat' => 'shifts', 'en' => 'Cash Movements in Active Shift' ),
			'shifts_history'        => array( 'cat' => 'shifts', 'en' => 'Shift History & Z-Reports Archive' ),
			'shift_control'         => array( 'cat' => 'shifts', 'en' => 'Shift #' ),
			'opening_float'         => array( 'cat' => 'shifts', 'en' => 'Opening Float' ),
			'cash_sales'            => array( 'cat' => 'shifts', 'en' => 'Cash Sales' ),
			'card_sales'            => array( 'cat' => 'shifts', 'en' => 'Card Sales' ),
			'cash_discrepancy'      => array( 'cat' => 'shifts', 'en' => 'Discrepancy (Over/Short)' ),
			'in_progress'           => array( 'cat' => 'shifts', 'en' => 'In progress...' ),
			'no_orders'             => array( 'cat' => 'general', 'en' => 'No records found' ),
			'optional'              => array( 'cat' => 'general', 'en' => 'Optional' ),

			// ==========================================
			// 15. GitHub Updates & Releases
			// ==========================================
			'updates'               => array( 'cat' => 'updates', 'en' => 'Updates' ),
			'system_updates'        => array( 'cat' => 'updates', 'en' => 'System Updates & Releases' ),
			'updates_desc'          => array( 'cat' => 'updates', 'en' => 'Check GitHub for new plugin versions, view changelog and perform 1-click in-place updates.' ),
			'current_version'       => array( 'cat' => 'updates', 'en' => 'Current Version' ),
			'latest_version'        => array( 'cat' => 'updates', 'en' => 'Latest Version' ),
			'check_updates_btn'     => array( 'cat' => 'updates', 'en' => 'Check for Updates' ),
			'checking_updates'      => array( 'cat' => 'updates', 'en' => 'Checking GitHub...' ),
			'install_update_btn'    => array( 'cat' => 'updates', 'en' => '🚀 Install Update Now (1-Click)' ),
			'installing_update'     => array( 'cat' => 'updates', 'en' => 'Downloading & Upgrading...' ),
			'up_to_date'            => array( 'cat' => 'updates', 'en' => 'Omni POS is Up to Date!' ),
			'up_to_date_desc'       => array( 'cat' => 'updates', 'en' => 'You are running the latest official version.' ),
			'update_available'      => array( 'cat' => 'updates', 'en' => 'New Version Available!' ),
			'release_notes'         => array( 'cat' => 'updates', 'en' => 'Release Notes & Changelog' ),
			'github_repo_config'    => array( 'cat' => 'updates', 'en' => 'GitHub Repository Configuration' ),
			'repo_slug_label'       => array( 'cat' => 'updates', 'en' => 'GitHub Repository (owner/repo)' ),
			'github_token_label'    => array( 'cat' => 'updates', 'en' => 'Personal Access Token (For Private Repositories)' ),
			'save_repo_btn'         => array( 'cat' => 'updates', 'en' => 'Save Repo Settings' ),

			// ==========================================
			// 16. Currency & Price Formatting
			// ==========================================
			'currency_settings'     => array( 'cat' => 'settings', 'en' => 'Currency & Price Formatting' ),
			'currency_settings_desc'=> array( 'cat' => 'settings', 'en' => 'Configure store currency, symbol position, and decimal separators synchronized with WooCommerce.' ),
			'currency_label'        => array( 'cat' => 'settings', 'en' => 'Store Currency' ),
			'currency_pos_label'    => array( 'cat' => 'settings', 'en' => 'Currency Position' ),
			'decimals_label'        => array( 'cat' => 'settings', 'en' => 'Number of Decimals' ),
			'decimal_sep_label'     => array( 'cat' => 'settings', 'en' => 'Decimal Separator' ),
			'thousand_sep_label'    => array( 'cat' => 'settings', 'en' => 'Thousand Separator' ),
			'currency_preview'      => array( 'cat' => 'settings', 'en' => 'Live Price Preview' ),
			'pos_left'              => array( 'cat' => 'settings', 'en' => 'Left (₾10.00)' ),
			'pos_right'             => array( 'cat' => 'settings', 'en' => 'Right (10.00₾)' ),
			'pos_left_space'        => array( 'cat' => 'settings', 'en' => 'Left with space (₾ 10.00)' ),
			'pos_right_space'       => array( 'cat' => 'settings', 'en' => 'Right with space (10.00 ₾)' ),
		);

		// Merge user-defined custom strings created via UI
		$user_strings = get_option( 'omni_pos_user_defined_strings', array() );
		if ( is_array( $user_strings ) && ! empty( $user_strings ) ) {
			foreach ( $user_strings as $k => $item ) {
				$defaults[ $k ] = array(
					'cat'          => isset( $item['cat'] ) ? $item['cat'] : 'custom',
					'en'           => isset( $item['en'] ) ? $item['en'] : $k,
					'custom_added' => true,
				);
			}
		}

		return $defaults;
	}

	/**
	 * Add or Update a User-Defined Custom String
	 */
	public static function add_user_defined_string( $key, $en, $cat = 'custom', $translation = '' ) {
		$key = sanitize_key( $key );
		if ( empty( $key ) ) {
			return false;
		}

		$user_strings = get_option( 'omni_pos_user_defined_strings', array() );
		if ( ! is_array( $user_strings ) ) {
			$user_strings = array();
		}

		$user_strings[ $key ] = array(
			'cat' => sanitize_text_field( $cat ),
			'en'  => sanitize_text_field( $en ),
		);

		update_option( 'omni_pos_user_defined_strings', $user_strings );

		if ( '' !== trim( $translation ) ) {
			$custom = get_option( 'omni_pos_custom_translations', array() );
			if ( ! is_array( $custom ) ) {
				$custom = array();
			}
			$custom[ $key ] = sanitize_text_field( $translation );
			update_option( 'omni_pos_custom_translations', $custom );
		}

		return true;
	}

	/**
	 * Delete a User-Defined Custom String
	 */
	public static function delete_user_defined_string( $key ) {
		$key = sanitize_key( $key );
		if ( empty( $key ) ) {
			return false;
		}

		$user_strings = get_option( 'omni_pos_user_defined_strings', array() );
		if ( is_array( $user_strings ) && isset( $user_strings[ $key ] ) ) {
			unset( $user_strings[ $key ] );
			update_option( 'omni_pos_user_defined_strings', $user_strings );
		}

		$custom = get_option( 'omni_pos_custom_translations', array() );
		if ( is_array( $custom ) && isset( $custom[ $key ] ) ) {
			unset( $custom[ $key ] );
			update_option( 'omni_pos_custom_translations', $custom );
		}

		return true;
	}

	/**
	 * Built-in Language Presets
	 */
	public static function get_locale_presets() {
		return array(
			// Georgian / ქართული
			'ka_GE' => array(
				'all'                   => 'ყველა',
				'search'                => 'ძებნა',
				'search_placeholder'    => 'მოძებნეთ პროდუქტი ან დაასკანერეთ ბარკოდი...',
				'auto'                  => 'ავტო',
				'cancel'                => 'გაუქმება',
				'save'                  => 'შენახვა',
				'save_changes'          => 'ცვლილებების შენახვა',
				'delete'                => 'წაშლა',
				'edit'                  => 'რედაქტირება',
				'view'                  => 'ნახვა',
				'back'                  => 'უკან',
				'close'                 => 'დახურვა',
				'actions'               => 'მოქმედებები',
				'status'                => 'სტატუსი',
				'date'                  => 'თარიღი',
				'total'                 => 'ჯამი',
				'quantity'              => 'რაოდენობა',
				'price'                 => 'ფასი',
				'items'                 => 'პროდუქცია',
				'notes'                 => 'შენიშვნები',
				'processing'            => 'მუშავდება...',
				'loading'               => 'იტვირთება...',
				'success'               => 'წარმატება',
				'error'                 => 'შეცდომა',
				'fullscreen'            => 'სრული ეკრანი',
				'logout'                => 'გამოსვლა',
				'theme'                 => 'თემა',
				'offline_ready'         => 'მზადაა ოფლაინისთვის (IndexedDB)',
				'products_loading'      => 'პროდუქტები იტვირთება...',
				'no_products_found'     => 'პროდუქტები ვერ მოიძებნა',
				'no_products_desc'      => 'სცადეთ სხვა საძიებო სიტყვა, შეცვალეთ კატეგორია ან დაასინქრონეთ კატალოგი.',
				'full_sync_button'      => 'კატალოგის სრული სინქრონიზაცია',
				'sync_catalogue'        => 'სინქრონიზაცია',
				'syncing'               => 'სინქრონდება...',
				'catalogue_synced'      => 'კატალოგი წარმატებით დასინქრონდა',
				'in_stock_unit'         => 'ცალი',
				'out_of_stock'          => 'მარაგი ამოიწურა',
				'in_stock'              => 'მარაგშია',
				'variations'            => 'ვარიაცია',
				'select_variation'      => 'აირჩიეთ ვარიაცია',
				'sku'                   => 'არტიკული (SKU)',
				'barcode'               => 'ბარკოდი',
				'added_to_cart'         => 'დაემატა კალათაში',
				'product_not_found'     => 'ბარკოდით პროდუქტი ვერ მოიძებნა',
				'cost_price'            => 'თვითღირებულება',
				'regular_price'         => 'ძირითადი ფასი',
				'sale_price'            => 'ფასდაკლების ფასი',
				'cart_empty'            => 'კალათა ცარიელია',
				'cart_empty_desc'       => 'დაასკანერეთ ბარკოდი ან დააჭირეთ პროდუქტს კალათაში დასამატებლად',
				'clear_cart'            => 'კალათის გასუფთავება',
				'subtotal'              => 'ქვეჯამი',
				'tax'                   => 'დღგ',
				'discount'              => 'ფასდაკლება',
				'add_discount'          => 'ფასდაკლების დამატება',
				'apply_discount'        => 'ფასდაკლების მინიჭება',
				'discount_percentage'   => 'პროცენტი (%)',
				'discount_fixed'        => 'ფიქსირებული თანხა',
				'total_payable'         => 'გადასახდელი ჯამი',
				'pay'                   => 'გადახდა',
				'customer'              => 'მყიდველი',
				'walk_in_customer'      => 'რიგითი მომხმარებელი (სტუმარი)',
				'select_customer'       => 'მომხმარებლის არჩევა',
				'attach_customer_desc'  => 'მიაბით მომხმარებელი ამ ჩეკს',
				'add_new_customer'      => 'ახალი მომხმარებლის დამატება',
				'first_name'            => 'სახელი',
				'last_name'             => 'გვარი',
				'phone_number'          => 'ტელეფონის ნომერი',
				'email'                 => 'ელ. ფოსტა',
				'save_and_select'       => 'შენახვა და არჩევა',
				'order_note'            => 'ჩეკის შენიშვნა (არასავალდებულო)',
				'order_note_placeholder'=> 'მაგ. მაგიდა 4, ფასდაკლება...',
				'payment_checkout'      => 'გადახდის გაფორმება',
				'select_payment_method' => 'აირჩიეთ გადახდის მეთოდი',
				'payable_amount'        => 'გადასახდელი თანხა',
				'cash'                  => 'ნაღდი ფული',
				'card'                  => 'ბარათი (POS ტერმინალი)',
				'split'                 => 'გაყოფილი გადახდა',
				'tendered_cash'         => 'მიღებული თანხა',
				'exact'                 => 'ზუსტი თანხა',
				'change_due'            => 'ხურდა დასაბრუნებელი:',
				'complete_payment'      => 'გადახდის დასრულება',
				'payment_success'       => 'გადახდა წარმატებით შესრულდა!',
				'order_created'         => 'ჩეკი წარმატებით შეიქმნა!',
				'print_receipt'         => 'ჩეკის ამობეჭდვა (80მმ)',
				'new_sale'              => 'ახალი გაყიდვა',
				'recent_orders'         => 'გაყიდული ჩეკების ისტორია',
				'completed_sales'       => 'დასრულებული ჩეკების სია',
				'order_number'          => 'ჩეკი #',
				'receipt_manager'       => 'ჩეკებისა და გაყიდვების მართვა',
				'receipt_details'       => 'ჩეკის დეტალები & რედაქტორი',
				'add_product_to_order'  => 'პროდუქტის დამატება კატალოგიდან...',
				'update_order'          => 'ჩეკის განახლება და გადათვლა',
				'delete_order'          => 'ჩეკის გაუქმება / წაშლა',
				'reprint_receipt'       => 'ჩეკის თავიდან ამობეჭდვა',
				'units_sold'            => 'გაყიდული რაოდენობა',
				'suppliers'             => 'მომწოდებლები & დისტრიბუცია',
				'suppliers_directory'   => 'მომწოდებლების ბაზა',
				'stock_inward'          => 'საქონლის მიღება & ზედნადებები',
				'new_stock_intake'      => 'ახალი მიღების აქტი (მიღება)',
				'invoice_number'        => 'ინვოისი / ზედნადები #',
				'supplier_name'         => 'მომწოდებელი / დისტრიბუტორი',
				'date_received'         => 'მიღების თარიღი',
				'add_supplier'          => 'ახალი მომწოდებლის დამატება',
				'edit_supplier'         => 'მომწოდებლის რედაქტირება',
				'company_name'          => 'კომპანიის სახელი',
				'contact_person'        => 'საკონტაქტო პირი',
				'tax_number'            => 'საიდენტიფიკაციო კოდი',
				'receive_stock_btn'     => 'საქონლის მიღება და შენახვა',
				'cashier'               => 'მოლარე',
				'register_shifts'       => 'სალარო & ცვლები',
				'open_shift'            => 'ცვლის გახსნა',
				'close_shift'           => 'ცვლის დახურვა',
				'opening_cash'          => 'საწყისი ნაღდი თანხა',
				'closing_cash'          => 'დათვლილი თანხა დახურვისას',
				'expected_cash'         => 'მოსალოდნელი თანხა სალაროში',
				'cash_difference'       => 'სხვაობა (დანაკლისი / მეტობა)',
				'x_report'              => 'X-ანგარიში (მიმდინარე)',
				'z_report'              => 'Z-ანგარიში (დღის დახურვა)',
				'cash_in'               => 'თანხის შეტანა (დეპოზიტი)',
				'cash_out'              => 'თანხის გატანა (ხარჯი)',
				'sales_reports'         => 'გაყიდვების რეპორტები',
				'reports_desc'          => 'ფინანსური შედეგები რეალურ დროში, გაყიდვების რეიტინგი, მოლარეების სტატისტიკა და გრაფიკები.',
				'total_revenue'         => 'ჯამური შემოსავალი',
				'total_orders'          => 'სულ შეკვეთები',
				'total_receipts'        => 'სულ ჩეკები',
				'total_sales'           => 'ჯამური გაყიდვები',
				'average_order_value'   => 'საშუალო ჩეკი',
				'avg_order_value'       => 'საშუალო ჩეკი',
				'top_selling_products'  => 'ყველაზე გაყიდვადი პროდუქტები',
				'top_products'          => 'ყველაზე გაყიდვადი პროდუქტები',
				'today'                 => 'დღეს',
				'yesterday'             => 'გუშინ',
				'this_week'             => 'ამ კვირაში',
				'this_month'            => 'მიმდინარე თვე',
				'last_7_days'           => 'ბოლო 7 დღე',
				'last_30_days'          => 'ბოლო 30 დღე',
				'sales_trend_chart'     => 'შემოსავლების დინამიკა დროში',
				'sales_period'          => 'გაყიდვების მაჩვენებლები პერიოდისთვის',
				'item'                  => 'პროდუქტი',
				'qty'                   => 'რაოდ.',
				'units'                 => 'ცალი',
				'amount'                => 'თანხა',
				'back_to_pos'           => 'POS სალაროში დაბრუნება',
				'dashboard'             => 'მართვის პანელი',
				'receipts_sales'        => 'გაყიდული ჩეკები & გაყიდვები',
				'suppliers_intake'      => 'მომწოდებლები & მიღება',
				'products_stock'        => 'პროდუქტები & მარაგები',
				'register_shifts_tab'   => 'სალარო & ცვლები',
				'cashiers_staff'        => 'მოლარეები & პერსონალი',
				'sales_reports_tab'     => 'გაყიდვების რეპორტები',
				'customers_tab'         => 'კლიენტები & მყიდველები',
				'translations_tab'      => 'თარგმნა & ენები',
				'migration_tab'         => 'მონაცემთა მიგრაცია',
				'pos_settings_tab'      => 'სალაროს პარამეტრები',
				'open_receipt_manager'  => 'ჩეკების მართვის გახსნა',
				'receipt_number'        => 'ჩეკი #',
				'open_shift_modal_title'=> 'სალაროს ცვლის გახსნა',
				'close_shift_modal_title'=> 'სალაროს ცვლის დახურვა',
				'active_shift_in_progress'=> 'აქტიური ცვლა მიმდინარეობს',
				'resume_shift_desc'     => 'სალაროში გახსნილია წინა აქტიური ცვლა. გსურთ ამ ცვლის გაგრძელება თუ მისი დახურვა და ახლის დაწყება?',
				'continue_shift'        => 'ცვლის გაგრძელება',
				'close_and_new'         => 'დახურვა და ახალი ცვლის გახსნა',
				'opening_float_desc'    => 'საწყისი ნაღდი თანხა (სალაროს ნაშთი)',
				'counted_cash_in_drawer'=> 'დათვლილი ნაღდი თანხა სალაროში *',
				'exact_match'           => 'ზუსტი დამთხვევა (სხვაობის გარეშე)',
				'cash_over'             => 'მეტობა',
				'cash_short'            => 'დანაკლისი',
				'closing_notes'         => 'დახურვის შენიშვნა / სხვაობის ახსნა',
				'close_shift_btn'       => 'ცვლის დახურვა & Z-ანგარიში',
				'print_z_report'        => 'Z-ანგარიშის ბეჭდვა',
				'cash_drawer_movement'  => 'სალაროდან თანხის მოძრაობა',
				'movement_type'         => 'მოძრაობის ტიპი',
				'record_cash_in'        => 'თანხის შეტანის დაფიქსირება',
				'record_cash_out'       => 'თანხის გატანის დაფიქსირება',
				'pin_switch_title'      => 'მოლარის შეცვლა PIN კოდით',
				'enter_pin'             => 'შეიყვანეთ 4-ნიშნა PIN კოდი',
				'switch_cashier_btn'    => 'მოლარის შეცვლა',
				'open_shift_btn'        => 'ცვლის გახსნა & ვაჭრობის დაწყება',
				'finish_and_logout'     => 'ცვლის დასრულება & გასვლა (Logout)',
				'shift_closed_logout_notice' => 'ცვლა ოფიციალურად დაიხურა. ამობეჭდეთ Z-ანგარიში და დააჭირეთ გასვლას.',
				'shift_required_prompt' => 'გთხოვთ გახსნათ სალაროს ცვლა პროდუქციის გატარებამდე ან გაყიდვამდე!',
				'register_shift_locked' => 'სალაროს ცვლა დახურულია',
				'register_shift_locked_desc' => 'პროდუქციის გატარება დაბლოკილია. გაყიდვების დასაწყებად გახსენით ცვლა საწყისი ნაღდი თანხით.',
				'open_shift_to_sell'    => 'ცვლის გახსნა & ვაჭრობის დაწყება',
				'select_all'            => 'ყველას მონიშვნა',
				'selected_count'        => 'მონიშნულია',
				'bulk_actions'          => 'ჯგუფური მოქმედებები',
				'delete_selected'       => 'მონიშნულების წაშლა',
				'confirm_bulk_delete'   => 'დარწმუნებული ხართ, რომ გსურთ მონიშნული ჩანაწერების წაშლა?',
				'items_deleted_success' => 'მონიშნული ჩანაწერები წარმატებით წაიშალა!',

				// QZ Tray & Hardware Georgian
				'hardware_settings'     => 'აპარატურა & პრინტერები (QZ Tray)',
				'hardware_tab'          => 'აპარატურა & პრინტერები',
				'qz_tray_status'        => 'QZ Tray სერვისის სტატუსი',
				'qz_connected'          => 'დაკავშირებულია (აქტიური)',
				'qz_connecting'         => 'QZ Tray-თან დაკავშირება...',
				'qz_disconnected'       => 'გათიშულია (ოფლაინ)',
				'qz_not_running'        => 'QZ Tray არ არის გაშვებული',
				'qz_setup_title'        => 'QZ Tray პრინტერების მოდული',
				'qz_setup_desc'         => 'ჩართეთ მომენტალური ჩუმი ბეჭდვა, სტიკერების ბეჭდვა და ფულის უჯრის ავტომატური გაღება.',
				'qz_install_launch_btn' => '🚀 QZ Tray-ის დაყენება & გაშვება',
				'qz_step_download'      => '1. ინსტალერის გადმოწერა',
				'qz_step_launch'        => '2. სერვისის გაშვება',
				'qz_step_connect'       => '3. WebSocket ხიდის დაკავშირება',
				'qz_step_ready'         => '4. მზადაა & დაკავშირებულია',
				'receipt_printer'       => 'ჩეკის თერმული პრინტერი',
				'label_printer'         => 'შტრიხკოდის / სტიკერის პრინტერი',
				'select_printer'        => 'აირჩიეთ პრინტერი...',
				'cash_drawer_kick'      => 'ფულის უჯრის ავტო-გაღება გაყიდვისას',
				'cash_drawer_kick_desc' => 'გაყიდვის დასრულებისას პულსური სიგნალის გაგზავნა ფულის უჯრის გასაღებად',
				'auto_paper_cut'        => 'ქაღალდის ავტო-მოჭრა',
				'auto_paper_cut_desc'   => 'ჩეკის დაბეჭდვის შემდეგ ESC/POS მოჭრის ბრძანების გაგზავნა',
				'silent_print'          => 'ჩუმი ბეჭდვა (ფანჯრის გარეშე)',
				'silent_print_desc'     => 'ჩეკის პირდაპირი ბეჭდვა QZ Tray-ით ბრაუზერის Print ფანჯრის გარეშე',
				'test_print_btn'        => '🖨️ სატესტო ჩეკის დაბეჭდვა',
				'test_drawer_btn'       => '💵 ფულის უჯრის ტესტი',
				'test_print_sent'       => 'სატესტო ჩეკი გაეგზავნა პრინტერს!',
				'test_drawer_sent'      => 'სიგნალი გაეგზავნა ფულის უჯრას!',
				'reconnect_qz'          => 'თავიდან დაკავშირება',
				'download_qz_manual'    => 'ხელით გადმოწერა',
				'qz_running_guide'      => 'დარწმუნდით, რომ QZ Tray გაშვებულია საათთან (Tray-ში). თუ ფანჯარა გამოჩნდება, დააჭირეთ "Allow"-ს.',
				'no_shift_open'         => 'აქტიური ცვლა არ არის გახსნილი',
				'active_shift'          => 'მიმდინარე სალაროს ცვლა',
				'start_shift_prompt'    => 'გახსენით ცვლა საწყისი ნაღდი თანხით სალაროს აღრიცხვის დასაწყებად.',
				'close_shift_z_report'  => 'ცვლის დახურვა & Z-ანგარიში',
				'cash_movements'        => 'თანხის მოძრაობა მიმდინარე ცვლაში',
				'shifts_history'        => 'ცვლების ისტორია & Z-ანგარიშების არქივი',
				'shift_control'         => 'ცვლა #',
				'opening_float'         => 'საწყისი თანხა',
				'cash_sales'            => 'ნაღდი გაყიდვები',
				'card_sales'            => 'ბარათით გაყიდვები',
				'cash_discrepancy'      => 'სხვაობა (დანაკლისი / მეტობა)',
				'in_progress'           => 'მიმდინარეობს...',
				'no_orders'             => 'ჩანაწერები არ მოიძებნა',
				'optional'              => 'არასავალდებულო',
				'settings_saved'        => 'პარამეტრები წარმატებით შეინახა!',
				'error_saving_settings' => 'პარამეტრების შენახვა ვერ მოხერხდა',
				'settings_title'        => 'სისტემისა და სალაროს პარამეტრები',
				'settings_desc'         => 'მართვის რეჟიმები, მარაგის შეტყობინებები, ჩეკის შაბლონი და მოლარეების პარამეტრები.',
				'inventory_control_mode'=> 'მარაგებისა და პროდუქციის მართვის რეჟიმი',
				'omni_direct_mode'      => 'Omni POS პირდაპირი კონტროლი (სწრაფი, ავტონომიური)',
				'wc_standard_mode'      => 'WooCommerce სტანდარტული რეჟიმი (სინქრონიზებული)',
				'store_phone'           => 'მაღაზიის ტელეფონი',
				'store_tax_id'          => 'საიდენტიფიკაციო კოდი',
				'receipt_header_txt'    => 'ჩეკის ზედა ტექსტი (Header)',
				'receipt_footer_txt'    => 'ჩეკის ქვედა ტექსტი (Footer)',
				'auto_print_receipt'    => 'ჩეკის ავტომატური ბეჭდვა გადახდისას',
				'sound_effects'         => 'ხმოვანი ეფექტები (ბიპი სკანირებისას)',
				'low_stock_alert_level' => 'მცირე მარაგის შეტყობინების ზღვარი',
				'allow_pos_discounts'   => 'ფასდაკლების უფლება სალაროში',
				'allow_custom_price'    => 'ფასის ხელით შეცვლის უფლება სალაროში',
				'all_settings_updated'  => 'ყველა პარამეტრი განახლდა და დასინქრონდა ყველა ტერმინალზე!',
				'save_settings'         => 'პარამეტრების შენახვა',
				'live_pos_hub'          => 'ლაივ სალარო',
				'realtime_stats'        => 'სტატისტიკა რეალურ დროში',
				'omni_pos_dashboard'    => 'Omni POS მართვის პანელი',
				'dashboard_subtitle'    => 'სალაროების, მარაგების, ცვლებისა და გაყიდვების ცენტრალიზებული მართვა.',
				'today_sales'           => 'დღევანდელი გაყიდვები',
				'today_orders'          => 'დღევანდელი შეკვეთები',
				'per_customer_basket'   => 'საშუალოდ ერთ მომხმარებელზე',
				'low_stock_items'       => 'მცირე მარაგის პროდუქტები',
				'below_threshold'       => 'ზღვარს ქვემოთ (≤ 5 ცალი)',
				'stock_alert_health'    => 'მარაგების ანალიზი & სტატუსი',
				'products_requiring_restock' => 'პროდუქტები, რომლებსაც შევსება ესაჭიროება',
				'view_all_products'     => 'ყველა პროდუქტის ნახვა',
				'remaining_stock'       => 'დარჩენილი მარაგი',
				'all_stock_healthy'     => 'ყველა პროდუქტის მარაგი წესრიგშია!',
				'no_items_below_threshold' => 'ამ ეტაპზე კრიტიკულად მცირე მარაგის მქონე პროდუქტი არ არის.',
				'quick_controls'        => 'სწრაფი მართვა',
				'launch_pos_register'   => 'სალაროს ტერმინალის გახსნა',
				'wp_admin_backend'      => 'WordPress-ის ადმინპანელი',
				'performance_metrics'   => 'სისტემის წარმადობა',
				'total_catalog_items'   => 'სულ კატალოგის პროდუქცია',
				'indexeddb_lookup'      => 'IndexedDB ძიების სისწრაფე',
				'thermal_output'        => 'თერმული ბეჭდვა',
				'add_product'           => 'პროდუქტის დამატება',
				'edit_product'          => 'პროდუქტის რედაქტირება',
				'product_name'          => 'პროდუქტის დასახელება',
				'product_name_placeholder'=> 'მაგ. ყავის მარცვალი 1კგ',
				'generate_barcode'      => 'EAN ბარკოდის გენერაცია',
				'generating'            => 'გენერირდება...',
				'manage_stock_checkbox' => 'ამ პროდუქტზე მარაგის კონტროლი',
				'stock_quantity'        => 'მარაგის რაოდენობა',
				'product_category'      => 'პროდუქტის კატეგორია',
				'select_category'       => 'აირჩიეთ კატეგორია',
				'all_categories'        => 'ყველა კატეგორია',
				'product_prices'        => 'პროდუქტის ფასები',
				'product_saved_success' => 'პროდუქტი წარმატებით შეინახა!',
				'product_moved_trash'   => 'პროდუქტი გადავიდა სანაგვეში',
				'barcode_labels'        => 'ბარკოდის ეტიკეტების ბეჭდვა',
				'number_of_copies'      => 'ასლების რაოდენობა',
				'label_format'          => 'ეტიკეტის ზომა / ფორმატი',
				'thermal_preview'       => 'თერმული ეტიკეტის პრევიუ',
				'categories'            => 'კატეგორიები',
				'products'              => 'პროდუქტები',
				'add_cashier'           => 'მოლარის დამატება',
				'edit_cashier'          => 'მოლარის რედაქტირება',
				'username'              => 'მომხმარებლის სახელი (Login)',
				'cashier_pin'           => 'მოლარის PIN კოდი (4 ციფრი)',
				'max_discount_allowed'  => 'მაქსიმალური ფასდაკლების უფლება (%)',
				'can_refund_orders'     => 'ჩეკის გაუქმების / წაშლის უფლება',
				'total_spent'           => 'სულ დახარჯული თანხა',
				'orders_placed'         => 'სულ შეკვეთები',
				'customer_details'      => 'კლიენტის დეტალები',
				'address'               => 'მისამართი',
				'city'                  => 'ქალაქი',
				'data_migration'        => 'მონაცემთა იმპორტი & მიგრაცია',
				'import_hub'            => 'მონაცემთა იმპორტი & მიგრაციის ცენტრი',
				'import_hub_desc'       => 'პროდუქტების, მარაგების, ბარკოდების, კატეგორიების, მომწოდებლებისა და ინვოისების იმპორტი VitePOS-დან ან JSON ფაილიდან',
				'import_package'        => 'აირჩიეთ JSON მიგრაციის ფაილი',
				'select_json_file'      => 'აირჩიეთ ან გადმოიტანეთ JSON მიგრაციის ფაილი',
				'import_instructions'   => 'ატვირთეთ VitePOS Migrator პლაგინიდან ექსპორტირებული JSON ფაილი',
				'browse_file'           => 'ფაილის არჩევა',
				'change_file'           => 'ფაილის შეცვლა',
				'detected_records'      => 'მიგრაციის ფაილში აღმოჩენილი ჩანაწერები',
				'import_settings'       => 'იმპორტის პარამეტრები',
				'update_existing_records'=> 'არსებული პროდუქტის განახლება თუ არტიკული ან ბარკოდი უკვე არსებობს',
				'importing_progress'    => 'მონაცემების იმპორტი WooCommerce-სა და Omni POS-ში...',
				'start_import_now'      => 'იმპორტისა და მიგრაციის დაწყება',
				'start_migration'       => 'მიგრაციის დაწყება',
				'migration_completed'   => 'მიგრაცია წარმატებით დასრულდა!',
				'import_success'        => 'მიგრაცია წარმატებით დასრულდა!',
				'languages_translations'=> 'ენები & სისტემური თარგმნა',
				'languages_desc'        => 'სისტემური სტრინგების სკანირება, ფრაზების დამატება, რედაქტირება და თარგმნა Loco Translate-ით',
				'add_custom_string'     => 'სტრინგის დამატება',
				'custom_string_desc'    => 'ახალი სტრინგის რეგისტრაცია და მისი თარგმანი',
				'string_key'            => 'სტრინგის გასაღები (Key)',
				'default_english'       => 'ძირითადი ინგლისური',
				'active_system_text'    => 'აქტიური სისტემური ტექსტი',
				'custom_translation_col'=> 'მორგებული თარგმანი (ხელით)',
				'copy_default'          => 'აქტიური თარგმანის კოპირება',
				'clear_override'        => 'ცვლილების გასუფთავება',
				'string_added_success'  => 'ახალი სტრინგი წარმატებით დაემატა!',
				'scan_system'           => 'სისტემის სკანირება',
				'scanning'              => 'სკანირდება...',
				'auto_translate_all'    => 'ყველაფრის ავტო-თარგმნა',
				'all_strings'           => 'ყველა სტრინგი',
				'general_ui'            => 'ზოგადი & ინტერფეისი',
				'pos_products'          => 'სალარო & პროდუქცია',
				'cart_customer'         => 'კალათა & კლიენტი',
				'checkout_payment'      => 'გადახდა & ანგარიშსწორება',
				'orders_receipts'       => 'ჩეკები & ისტორია',
				'custom_strings'        => 'მომხმარებლის სტრინგები',
				'print_barcode'         => 'ბეჭდვა',
				'updates'               => 'განახლებები',
				'system_updates'        => 'სისტემის განახლებები & რელიზები',
				'updates_desc'          => 'GitHub-ზე ახალი ვერსიების შემოწმება, ცვლილებების სია (Changelog) და 1-კლიკით პირდაპირი განახლება.',
				'current_version'       => 'მიმდინარე ვერსია',
				'latest_version'        => 'უახლესი ვერსია',
				'check_updates_btn'     => 'განახლებების შემოწმება',
				'checking_updates'      => 'GitHub-ის შემოწმება...',
				'install_update_btn'    => '🚀 განახლება 1-კლიკით (Install Update)',
				'installing_update'     => 'იტვირთება და ახლდება...',
				'up_to_date'            => 'Omni POS განახლებულია!',
				'up_to_date_desc'       => 'თქვენ იყენებთ ოფიციალურ უახლეს ვერსიას.',
				'update_available'      => 'ხელმისაწვდომია ახალი ვერსია!',
				'release_notes'         => 'რელიზის დეტალები & Changelog',
				'github_repo_config'    => 'GitHub რეპოზიტორიის პარამეტრები',
				'repo_slug_label'       => 'GitHub რეპოზიტორია (owner/repo)',
				'github_token_label'    => 'პირადი Access Token (დახურული რეპოზიტორიისთვის)',
				'save_repo_btn'         => 'რეპოზიტორიის შენახვა',
				'currency_settings'     => 'ვალუტა & ფასის ფორმატირება',
				'currency_settings_desc'=> 'მაღაზიის ვალუტის, სიმბოლოს პოზიციისა და ათწილადების მართვა (სინქრონიზებულია WooCommerce-თან).',
				'currency_label'        => 'მაღაზიის ვალუტა (Currency)',
				'currency_pos_label'    => 'ვალუტის სიმბოლოს პოზიცია',
				'decimals_label'        => 'ათწილადების რაოდენობა',
				'decimal_sep_label'     => 'ათწილადის გამყოფი სიმბოლო',
				'thousand_sep_label'    => 'ათასეულის გამყოფი სიმბოლო',
				'currency_preview'      => 'ფასის ცოცხალი ნიმუში',
				'pos_left'              => 'მარცხნივ (₾10.00)',
				'pos_right'             => 'მარჯვნივ (10.00₾)',
				'pos_left_space'        => 'მარცხნივ დაშორებით (₾ 10.00)',
				'pos_right_space'       => 'მარჯვნივ დაშორებით (10.00 ₾)',
			),

			// German / Deutsch
			'de_DE' => array(
				'all'                   => 'Alle',
				'search'                => 'Suchen',
				'search_placeholder'    => 'Produkte suchen oder Barcode scannen...',
				'auto'                  => 'Auto',
				'cancel'                => 'Abbrechen',
				'save'                  => 'Speichern',
				'save_changes'          => 'Änderungen speichern',
				'delete'                => 'Löschen',
				'edit'                  => 'Bearbeiten',
				'cart_empty'            => 'Warenkorb ist leer',
				'subtotal'              => 'Zwischensumme',
				'total_payable'         => 'Gesamtbetrag',
				'pay'                   => 'Bezahlen',
				'cash'                  => 'Bargeld',
				'card'                  => 'Kartenzahlung',
				'change_due'            => 'Rückgeld:',
				'print_receipt'         => 'Beleg drucken',
				'new_sale'              => 'Neuer Verkauf',
			),

			// Spanish / Español
			'es_ES' => array(
				'all'                   => 'Todos',
				'search'                => 'Buscar',
				'search_placeholder'    => 'Buscar productos o escanear código...',
				'auto'                  => 'Auto',
				'cancel'                => 'Cancelar',
				'save'                  => 'Guardar',
				'save_changes'          => 'Guardar cambios',
				'delete'                => 'Eliminar',
				'edit'                  => 'Editar',
				'cart_empty'            => 'El carrito está vacío',
				'subtotal'              => 'Subtotal',
				'total_payable'         => 'Total a pagar',
				'pay'                   => 'Pagar',
				'cash'                  => 'Efectivo',
				'card'                  => 'Tarjeta',
				'change_due'            => 'Cambio:',
				'print_receipt'         => 'Imprimir recibo',
				'new_sale'              => 'Nueva venta',
			),
		);
	}

	/**
	 * Get Resolved Dictionary for the Frontend
	 * Priority order:
	 * 1. Custom in-app merchant overrides from get_option('omni_pos_custom_translations_' . $locale)
	 * 2. Built-in locale presets (ka_GE, de_DE, es_ES, etc.)
	 * 3. WordPress gettext translations (__()) from Loco Translate / .mo files
	 * 4. Default English string
	 */
	public static function get_resolved_translations( $locale = '' ) {
		if ( empty( $locale ) ) {
			$locale = self::get_active_language();
		}

		$defaults = self::get_default_strings();
		$presets  = self::get_locale_presets();
		$preset   = isset( $presets[ $locale ] ) ? $presets[ $locale ] : array();

		// Custom overrides per locale or legacy global
		$custom_locale = get_option( 'omni_pos_custom_translations_' . $locale, null );
		if ( null === $custom_locale ) {
			if ( 'ka_GE' === $locale || ( 'auto' === $locale && strpos( get_locale(), 'ka' ) !== false ) ) {
				$custom_locale = get_option( 'omni_pos_custom_translations', array() );
			} else {
				$custom_locale = array();
			}
		}
		if ( ! is_array( $custom_locale ) ) {
			$custom_locale = array();
		}

		$dictionary = array();

		foreach ( $defaults as $key => $item ) {
			$val = $item['en'];

			// If English is explicitly requested, return English default (or custom en override if any)
			if ( 'en_US' === $locale ) {
				if ( isset( $custom_locale[ $key ] ) && '' !== trim( $custom_locale[ $key ] ) ) {
					$val = $custom_locale[ $key ];
				}
				$dictionary[ $key ] = $val;
				continue;
			}

			// 1. Check built-in preset (e.g. ka_GE, de_DE, etc.)
			if ( isset( $preset[ $key ] ) && ! empty( $preset[ $key ] ) ) {
				$val = $preset[ $key ];
			}

			// 2. Check WordPress gettext filter (Loco Translate / WPML) for this locale
			if ( 'auto' === $locale || $locale === get_locale() ) {
				$gettext_val = translate( $item['en'], 'omni-pos' );
				if ( $gettext_val !== $item['en'] ) {
					$val = $gettext_val;
				}
			}

			// 3. Check custom in-app merchant override
			if ( isset( $custom_locale[ $key ] ) && '' !== trim( $custom_locale[ $key ] ) ) {
				$val = $custom_locale[ $key ];
			}

			$dictionary[ $key ] = $val;
		}

		return $dictionary;
	}

	/**
	 * Save Custom In-App Translations
	 */
	public static function save_custom_translations( $translations = array(), $locale = '' ) {
		if ( ! is_array( $translations ) ) {
			$translations = array();
		}
		if ( empty( $locale ) ) {
			$locale = self::get_active_language();
		}

		$cleaned = array();
		foreach ( $translations as $k => $v ) {
			$key = sanitize_key( $k );
			$val = sanitize_text_field( $v );
			if ( ! empty( $val ) ) {
				$cleaned[ $key ] = $val;
			}
		}

		update_option( 'omni_pos_custom_translations_' . $locale, $cleaned );
		if ( 'ka_GE' === $locale || 'auto' === $locale ) {
			update_option( 'omni_pos_custom_translations', $cleaned );
		}
		return $cleaned;
	}

	/**
	 * Automatically scan all plugin files (PHP and TSX) and harvest every translatable string
	 */
	public static function scan_and_harvest_strings() {
		$files_scanned = 0;
		$harvested     = array();
		$defaults      = self::get_default_strings();

		$paths_to_scan = array(
			OMNI_POS_PATH . 'omni-pos.php',
		);

		// Scan includes/*.php
		$php_files = glob( OMNI_POS_PATH . 'includes/*.php' );
		if ( $php_files ) {
			$paths_to_scan = array_merge( $paths_to_scan, $php_files );
		}

		// Scan src-pos/src/**/*.tsx and src/**/*.ts
		$src_dir = OMNI_POS_PATH . 'src-pos/src';
		if ( is_dir( $src_dir ) ) {
			$iterator = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $src_dir ) );
			foreach ( $iterator as $file ) {
				if ( $file->isFile() && in_array( $file->getExtension(), array( 'ts', 'tsx', 'js', 'jsx' ), true ) ) {
					$paths_to_scan[] = $file->getPathname();
				}
			}
		}

		// Regex patterns for PHP gettext and TSX t() helper
		$patterns = array(
			// t('key', 'Default text')
			'/t\(\s*[\'"]([a-zA-Z0-9_\-]+)[\'"]\s*,\s*[\'"](.*?)[\'"]\s*\)/s',
			// __('Text', 'omni-pos')
			'/__\(\s*[\'"](.*?)[\'"]\s*,\s*[\'"]omni-pos[\'"]\s*\)/s',
			// esc_html__('Text', 'omni-pos')
			'/esc_html__\(\s*[\'"](.*?)[\'"]\s*,\s*[\'"]omni-pos[\'"]\s*\)/s',
			// _e('Text', 'omni-pos')
			'/_e\(\s*[\'"](.*?)[\'"]\s*,\s*[\'"]omni-pos[\'"]\s*\)/s',
			// esc_attr__('Text', 'omni-pos')
			'/esc_attr__\(\s*[\'"](.*?)[\'"]\s*,\s*[\'"]omni-pos[\'"]\s*\)/s',
		);

		foreach ( $paths_to_scan as $file_path ) {
			if ( ! file_exists( $file_path ) ) {
				continue;
			}
			$files_scanned++;
			$content = file_get_contents( $file_path );
			$rel_name = str_replace( OMNI_POS_PATH, '', $file_path );

			// 1. Check t('key', 'default')
			if ( preg_match_all( $patterns[0], $content, $matches, PREG_SET_ORDER ) ) {
				foreach ( $matches as $m ) {
					$key = sanitize_key( $m[1] );
					$en  = trim( $m[2] );
					if ( ! empty( $key ) && ! empty( $en ) ) {
						$harvested[ $key ] = array(
							'cat'  => isset( $defaults[ $key ]['cat'] ) ? $defaults[ $key ]['cat'] : 'general',
							'en'   => $en,
							'file' => $rel_name,
						);
					}
				}
			}

			// 2. Check gettext functions
			for ( $i = 1; $i <= 4; $i++ ) {
				if ( preg_match_all( $patterns[ $i ], $content, $matches, PREG_SET_ORDER ) ) {
					foreach ( $matches as $m ) {
						$en  = trim( $m[1] );
						if ( empty( $en ) || strlen( $en ) < 2 || strpos( $en, '%' ) === 0 ) {
							continue;
						}
						$key = sanitize_key( str_replace( array( ' ', '-', '/', '\\', '.', ':', '(', ')' ), '_', strtolower( substr( $en, 0, 40 ) ) ) );
						if ( ! isset( $harvested[ $key ] ) ) {
							$harvested[ $key ] = array(
								'cat'  => isset( $defaults[ $key ]['cat'] ) ? $defaults[ $key ]['cat'] : 'general',
								'en'   => $en,
								'file' => $rel_name,
							);
						}
					}
				}
			}
		}

		// Merge with master defaults so nothing is missed
		foreach ( $defaults as $k => $item ) {
			if ( ! isset( $harvested[ $k ] ) ) {
				$harvested[ $k ] = array(
					'cat'  => $item['cat'],
					'en'   => $item['en'],
					'file' => 'includes/class-omni-pos-i18n.php',
				);
			}
		}

		return array(
			'files_scanned' => $files_scanned,
			'total_strings' => count( $harvested ),
			'strings'       => $harvested,
		);
	}

	/**
	 * Auto-Translate all strings into target language using dictionary & contextual mapping
	 */
	public static function auto_translate_all( $target_lang = 'ka_GE' ) {
		$scan_result = self::scan_and_harvest_strings();
		$harvested   = $scan_result['strings'];
		$presets     = self::get_locale_presets();
		$preset      = isset( $presets[ $target_lang ] ) ? $presets[ $target_lang ] : ( isset( $presets['ka_GE'] ) ? $presets['ka_GE'] : array() );
		$existing    = get_option( 'omni_pos_custom_translations', array() );
		if ( ! is_array( $existing ) ) {
			$existing = array();
		}

		$translated_count = 0;
		$new_overrides    = $existing;

		// Comprehensive translation dictionary for Georgian & other languages
		$dictionary_map = array(
			'all' => 'ყველა',
			'search' => 'ძებნა',
			'search_placeholder' => 'მოძებნეთ პროდუქტი ან დაასკანერეთ ბარკოდი...',
			'cancel' => 'გაუქმება',
			'save' => 'შენახვა',
			'save_changes' => 'ცვლილებების შენახვა',
			'delete' => 'წაშლა',
			'edit' => 'რედაქტირება',
			'view' => 'ნახვა',
			'back' => 'უკან',
			'close' => 'დახურვა',
			'actions' => 'მოქმედებები',
			'status' => 'სტატუსი',
			'date' => 'თარიღი',
			'total' => 'ჯამი',
			'quantity' => 'რაოდენობა',
			'price' => 'ფასი',
			'items' => 'პროდუქცია',
			'notes' => 'შენიშვნები',
			'processing' => 'მუშავდება...',
			'loading' => 'იტვირთება...',
			'success' => 'წარმატება',
			'error' => 'შეცდომა',
			'fullscreen' => 'სრული ეკრანი',
			'logout' => 'გამოსვლა',
			'cart_empty' => 'კალათა ცარიელია',
			'subtotal' => 'ქვეჯამი',
			'tax' => 'დღგ',
			'discount' => 'ფასდაკლება',
			'total_payable' => 'გადასახდელი ჯამი',
			'pay' => 'გადახდა',
			'cash' => 'ნაღდი ფული',
			'card' => 'ბარათი (POS)',
			'split' => 'გაყოფილი გადახდა',
			'change_due' => 'ხურდა დასაბრუნებელი:',
			'complete_payment' => 'გადახდის დასრულება',
			'payment_success' => 'გადახდა წარმატებით შესრულდა!',
			'print_receipt' => 'ჩეკის ამობეჭდვა (80მმ)',
			'new_sale' => 'ახალი გაყიდვა',
			'recent_orders' => 'გაყიდული ჩეკების ისტორია',
			'receipt_manager' => 'ჩეკებისა და გაყიდვების მართვა',
			'receipt_details' => 'ჩეკის დეტალები',
			'reprint_receipt' => 'ჩეკის ამობეჭდვა',
			'suppliers' => 'მომწოდებლები & დისტრიბუცია',
			'stock_inward' => 'საქონლის მიღება & ზედნადებები',
			'new_stock_intake' => 'ახალი მიღების აქტი (მიღება)',
			'cashier' => 'მოლარე',
			'register_shifts' => 'სალარო & ცვლები',
			'open_shift' => 'ცვლის გახსნა',
			'close_shift' => 'ცვლის დახურვა & Z-ანგარიში',
			'x_report' => 'X-ანგარიში',
			'z_report' => 'Z-ანგარიში',
			'cash_in' => 'თანხის შეტანა (დეპოზიტი)',
			'cash_out' => 'თანხის გატანა (ხარჯი)',
			'sales_reports' => 'გაყიდვების რეპორტები',
			'data_migration' => 'მონაცემთა იმპორტი & მიგრაცია',
			'barcode_hub_title' => 'NiceLabel ბარკოდების & ეტიკეტების ბეჭდვა',
			'barcode_hub_btn' => '🏷️ ბარკოდების ბეჭდვა',
			'barcode_hub_desc' => 'აირჩიეთ პროდუქცია, მიუთითეთ სტიკერების რაოდენობა და დაბეჭდეთ NiceLabel თერმო-პრინტერზე.',
			'nicelabel_extension_title' => 'NiceLabel & ბარკოდების თერმული ხიდი (Chrome Extension)',
			'nicelabel_extension_desc' => 'პირდაპირი ჩუმი ბეჭდვა NiceLabel Automation-სა და თერმო-პრინტერებზე.',
			'extension_setup_title' => 'Omni NiceLabel ბეჭდვის გაფართოება',
			'extension_setup_subtitle' => '1-კლიკით ჩუმი ბეჭდვა & NiceLabel ინტეგრაცია',
			'extension_active' => 'Chrome Extension გააქტიურებულია',
			'extension_not_installed' => 'Extension არ არის დაყენებული',
			'extension_ready_desc' => 'მზად არის NiceLabel-სა და თერმო-პრინტერებზე პირდაპირი ბეჭდვისთვის.',
			'extension_missing_desc' => 'გთხოვთ დააყენოთ გაფართოება ამ ბრაუზერში 1-კლიკით ბეჭდვისთვის.',
			'print_queue' => 'დასაბეჭდი სია',
			'all_to_stock' => 'მარაგის რაოდენობაზე',
			'print_on_nicelabel' => 'ბეჭდვა NiceLabel-ზე',
			'install_extension_btn' => 'Extension-ის დაყენება',
			'reconnect_guide' => 'დაკავშირება / ინსტრუქცია',
			'test_nicelabel_btn' => '🏷️ NiceLabel ბეჭდვის ტესტი',
			'recent_10_products' => 'ბოლო 10 პროდუქტი',
			'search_products_barcode' => 'ძებნა დასახელებით, შტრიხკოდით ან არტიკულით...',
		);

		foreach ( $harvested as $key => $item ) {
			$en = $item['en'];

			// Check preset or dictionary
			$translated = '';
			if ( isset( $preset[ $key ] ) ) {
				$translated = $preset[ $key ];
			} elseif ( isset( $dictionary_map[ $key ] ) ) {
				$translated = $dictionary_map[ $key ];
			}

			if ( ! empty( $translated ) ) {
				$new_overrides[ $key ] = $translated;
				$translated_count++;
			}
		}

		self::save_custom_translations( $new_overrides );

		return array(
			'success'          => true,
			'files_scanned'    => $scan_result['files_scanned'],
			'total_strings'    => $scan_result['total_strings'],
			'translated_count' => $translated_count,
			'target_language'  => $target_lang,
			'overrides'        => $new_overrides,
			'resolved'         => self::get_resolved_translations( $target_lang ),
		);
	}
}
