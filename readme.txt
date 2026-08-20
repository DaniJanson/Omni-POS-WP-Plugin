=== Omni POS - Ultra Fast Point of Sale ===
Contributors: omnidev
Tags: pos, point of sale, woocommerce pos, barcode scanner, receipt printer
Requires at least: 5.8
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Lightweight, ultra-fast Point of Sale (POS) system for WooCommerce with IndexedDB caching and barcode scanner support.

== Description ==

Omni POS is a modern, high-speed Point of Sale register designed for WooCommerce stores.
Built with React and IndexedDB local memory, it delivers instant (<3ms) product lookups, seamless barcode scanning, and 80mm thermal receipt printing.

== Installation ==

1. Upload the `omni-pos` directory to the `/wp-content/plugins/` directory.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Access POS directly at `/omni_pos` or via the Omni POS menu in WP Admin.

== Frequently Asked Questions ==

= Does Omni POS work offline? =
Yes! Product catalogues and prices are stored locally in the browser's IndexedDB.

= How do I open the POS register? =
Navigate to `http://yoursite.com/omni_pos` in your browser.

== Changelog ==

= 1.0.0 =
* Initial release with React SPA, IndexedDB, WooCommerce payment integration, and Loco Translate support.
