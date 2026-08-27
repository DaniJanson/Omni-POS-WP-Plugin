# ⚡ Omni POS — Ultra-Fast Point of Sale & ERP Suite for WooCommerce

[![Version](https://img.shields.io/badge/version-1.2.8-blue.svg)](https://github.com/DaniJanson/Omni-POS-WP-Plugin/releases)
[![WooCommerce](https://img.shields.io/badge/WooCommerce-Tested%20up%20to%209.0-purple.svg)](https://woocommerce.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61dafb.svg)](https://reactjs.org/)
[![Database](https://img.shields.io/badge/Local%20Storage-IndexedDB%20%2B%20Dexie.js-emerald.svg)](https://dexie.org/)
[![License](https://img.shields.io/badge/License-GPLv2-orange.svg)](LICENSE)

> **Omni POS** is a modern, high-performance, offline-capable Point of Sale (POS) and inventory management suite designed specifically for WooCommerce stores and high-volume retail environments. Built with a reactive **React 18 + IndexedDB** architecture, it provides sub-millisecond barcode lookup, silent thermal receipt printing, NiceLabel industrial barcode generation, and complete supplier purchasing workflows.

---

## 🌟 Key Highlights

* ⚡ **Ultra-Fast Sub-3ms Product Lookups**: Full client-side IndexedDB database cache allows instant product search, barcode matching, and instant cart additions without server latency.
* 📴 **Offline-First Resilience**: Continue scanning items, ringing up orders, and calculating totals even during internet outages. Data automatically syncs with WooCommerce once connection resumes.
* 🖨️ **Hardware Integration & Silent Printing**: Direct raw ESC/POS thermal printer support (58mm/80mm), cash drawer kick trigger, automatic paper cut, and zero-dialog printing via the companion Chrome Extension.
* 🏷️ **NiceLabel Barcode Bridge**: Automated HTTP trigger integration with **NiceLabel Automation / SEWOO / Zebra / TSC** thermal label printers for 1-click product price tags and barcode printing.
* 🔄 **1-Click VitePOS ➔ Omni Migration Engine**: Seamless automated migration for legacy VitePOS installations with automatic JSON snapshot backups and instant 1-click rollbacks.
* 🌐 **Full Georgian & Multilingual Localization**: Built-in self-hosted **BPG DejaVu Sans (DejaVu Sans)** font engine with instant in-app string translation editor, POT file support, and Loco Translate compatibility.

---

## 🚀 Modules & Capabilities

```
Omni POS Architecture
├── 🛒 Live POS Terminal (Cashier Register)
│   ├── Ergonomic Barcode Scanner & Search
│   ├── Cashier Shifts (Open / Close / Cash Movements)
│   ├── Multi-Method Checkout (Cash, Card, Split, Change Due)
│   ├── Line-Item Discounts & Custom Price Overrides
│   └── 80mm ESC/POS Silent Thermal Receipt Printing
│
└── 🏢 Admin Hub (Management & ERP)
    ├── 📊 Real-Time KPI Dashboard (Sales, Avg Order Value, Low Stock)
    ├── 🧾 Sales & Order Details Manager (Edit, Price Adjust, Void & Restock)
    ├── 🚚 Suppliers & Stock Intake (Purchase Orders, Cost Tracking, Invoices)
    ├── 📦 Live Product Catalog & Quick Stock Adjuster
    ├── 👥 Staff & Cashier Permissions (Admin vs. Cashier Roles)
    ├── 📈 Financial Analytics & Customer Directory
    ├── 🌐 Translations & Locale Editor (BPG DejaVu Sans)
    └── ⚙️ Settings Hub (Hardware, VitePOS Migration & 1-Click System Updates)
```

---

## 🛠️ Hardware Ecosystem

| Hardware Component | Technology / Protocol | Supported Devices |
| :--- | :--- | :--- |
| **Receipt Printers** | ESC/POS via USB / Network / Extension | Epson, Star Micronics, Xprinter, Rongta, Bixolon (58mm / 80mm) |
| **Barcode Printers** | NiceLabel HTTP Trigger / RAW spooler | SEWOO, Zebra (ZPL), TSC (TSPL), Godex, Xprinter |
| **Barcode Scanners** | HID Keyboard Wedge / USB / Bluetooth | Honeywell, Zebra, Datalogic, 2D/1D Handhelds |
| **Cash Drawers** | RJ11 / RJ12 24V Electronic Pulse | Standard cash drawers connected to receipt printer |

---

## 📦 Installation & Setup

### Requirements
* **WordPress**: 5.8 or higher
* **WooCommerce**: 5.0 to 9.0+
* **PHP**: 7.4 to 8.3+
* **Modern Web Browser**: Chrome, Edge, Safari, Firefox, Opera

### 1. Plugin Installation
1. Clone or download the repository into your WordPress plugin folder:
   ```bash
   git clone https://github.com/DaniJanson/Omni-POS-WP-Plugin.git wp-content/plugins/omni-pos
   ```
2. Activate **Omni POS** from the WordPress Admin **Plugins** menu.

### 2. Opening the POS Terminal
* Access the standalone, distraction-free POS register at:  
  👉 `https://your-store.com/omni_pos`
* Or navigate to **WordPress Admin ➔ Omni POS**.

### 3. NiceLabel Automated Printing Setup
1. Navigate to **Admin Hub ➔ Settings ➔ Hardware**.
2. Download and install the **Omni POS Print Extension** for Chrome.
3. Import the pre-configured NiceLabel Automation package:
   `wp-content/plugins/omni-pos/nicelabel/Omni_POS_NiceLabel_Automation.misx`.

---

## 💻 Tech Stack & Architecture

* **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Zustand (State Management)
* **Client Database**: Dexie.js (IndexedDB wrapper)
* **Icons & UI Design**: Lucide Icons, Glassmorphism, Responsive Dark & Light Modes
* **Backend API**: WordPress REST API (`/wp-json/omni-pos/v1/`), WooCommerce Core Integration
* **Typography**: Self-hosted embedded `DejaVu Sans / BPG DejaVu Sans` webfonts for universal Unicode & Georgian support.

---

## 📄 License & Credits

* **Author**: Omni Development Team ([omni.ge](https://omni.ge))
* **License**: GNU General Public License v2.0 or later ([GPL-2.0](https://www.gnu.org/licenses/gpl-2.0.html))
