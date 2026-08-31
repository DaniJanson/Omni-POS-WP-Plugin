=== Omni POS - Ultra Fast Point of Sale ===
Contributors: omnidev
Tags: pos, point of sale, woocommerce pos, barcode scanner, receipt printer, thermal printer, nicelabel
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.2.9
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Lightweight, ultra-fast React + IndexedDB Point of Sale (POS) and retail management suite for WooCommerce.

== Description ==

Omni POS is a modern, ultra-high-speed Point of Sale register and inventory management suite designed specifically for WooCommerce stores.
Built with React 18 and client-side IndexedDB local memory, it delivers instant (<3ms) product lookups, seamless barcode scanning, 80mm ESC/POS thermal receipt printing, NiceLabel industrial barcode automation, supplier purchase orders, and complete cashier shift controls.

== Features ==
* Ultra-fast React 18 + IndexedDB offline-first architecture.
* Barcode scanner integration with auto-detect.
* Cashier shifts management with cash drawer movements.
* Split payments (Cash, Card, Split) and discount controls.
* Complete Admin Hub (Sales, Suppliers, Stock, Reports, Customers, Settings).
* Silent thermal receipt printing (ESC/POS) and cash drawer kick.
* NiceLabel HTTP trigger bridge for SEWOO/Zebra/TSC thermal label printers.
* Integrated VitePOS ➔ WooCommerce Multi-Stock, Barcodes, and Cost Prices Overwrite Hub.

== Installation ==

1. Upload the `omni-pos` directory to `/wp-content/plugins/`.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Access POS directly at `/omni_pos` or via the Omni POS menu in WP Admin.

== Changelog ==

= 1.2.9 =
* Integrated 1-Click VitePOS Multi-Stock ➔ WooCommerce Stock Overwrite Migration Hub into Settings.
* 2-Way real-time synchronization bridge for barcodes, live stocks, and cost prices.
* Live migration diagnostics dashboard with safe snapshot rollback.

= 1.2.8 =
* Reorganized Settings Hub with integrated Migration and System Updates tabs.
* Streamlined and compact sidebar navigation with update notification alerts.

= 1.2.7 =
* Fixed URL routing and tab persistence across page refreshes.
* Removed redundant secondary subview headers for clean single-header experience.

= 1.2.6 =
* Responsive sales filter toolbar and table column symmetry fixes.

= 1.2.5 =
* Expanded ergonomic product search and barcode scanner input bar.

= 1.2.4 =
* Self-hosted BPG DejaVu Sans and DejaVu Sans webfonts.
