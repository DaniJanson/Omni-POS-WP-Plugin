export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  image?: string;
}

export interface ProductVariation {
  id: number;
  name: string;
  attributes: Record<string, string>;
  sku: string;
  barcode: string;
  price: number;
  regular_price: number;
  sale_price: number | null;
  stock_quantity: number;
  in_stock: boolean;
  image: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  regular_price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  manage_stock: boolean;
  stock_quantity: number;
  in_stock: boolean;
  categories: { id: number; name: string; slug: string }[];
  image: string;
  type: string;
  tax_status: string;
  tax_class: string;
  updated_at: number;
  cost_price?: number | null;
  variations?: ProductVariation[];
}

export interface AdminProductFormData {
  id?: number;
  name: string;
  sku: string;
  barcode: string;
  regular_price: number | string;
  sale_price?: number | string;
  cost_price?: number | string;
  manage_stock: boolean;
  stock_quantity: number | string;
  category_id?: number;
}

export interface AdminProductsResponse {
  success: boolean;
  products: Product[];
  total: number;
  total_pages: number;
  page: number;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
}

export interface CartItem {
  cart_id: string; // unique item id in cart (product_id or variation_id)
  product_id: number;
  variation_id?: number;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  regular_price: number;
  quantity: number;
  stock_quantity: number;
  image: string;
  tax_status: string;
  tax_class: string;
  custom_discount_percent?: number;
  custom_price?: number;
  note?: string;
}

export interface PaymentDetails {
  method: string;
  tendered_cash?: number;
  change_due?: number;
  split_details?: {
    cash: number;
    card: number;
  };
}

export interface StoreInfo {
  name: string;
  description: string;
  address: {
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
  };
  phone: string;
  tax_number: string;
  currency: string;
  currency_symbol: string;
  currency_pos: string;
  decimals: number;
  decimal_sep: string;
  thousand_sep: string;
  tax_enabled: boolean;
  prices_include_tax: boolean;
}

export interface CashierInfo {
  id: number;
  name: string;
  email: string;
  capabilities: {
    manage_pos: boolean;
    apply_discount: boolean;
  };
}

export interface PosSettings {
  receipt_header: string;
  receipt_footer: string;
  auto_print: boolean;
  sound_effects: boolean;
  barcode_delay: number;
  receipt_printer?: string;
  label_printer?: string;
  cash_drawer_kick?: boolean;
  auto_paper_cut?: boolean;
  silent_print?: boolean;
}

export interface PaymentMethodItem {
  id: string;
  name: string;
  icon: string;
}

export interface PosInitData {
  store: StoreInfo;
  cashier: CashierInfo;
  settings: PosSettings;
  payment_methods: PaymentMethodItem[];
  stats: {
    total_products: number;
  };
}

export interface ReceiptItem {
  id: number;
  name: string;
  sku: string;
  qty: number;
  price: number;
  total: number;
}

export interface ReceiptData {
  order_id: number;
  order_number: string;
  date: string;
  cashier: string;
  customer_name: string;
  payment_method: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  tendered: number;
  change: number;
}

export interface OrderSummary {
  id: number;
  order_number: string;
  date: string;
  total: number;
  status: string;
  customer_name: string;
  payment_method: string;
  items_count: number;
}

export interface AdminDashboardStats {
  today_sales: number;
  today_orders_count: number;
  avg_order_value: number;
  today_cash_sales: number;
  today_card_sales: number;
  total_products_count: number;
  low_stock_count: number;
  low_stock_products: Array<{
    id: number;
    name: string;
    sku: string;
    stock_quantity: number;
    price: number;
  }>;
  currency_symbol: string;
}

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export interface AdminSettings {
  inventory_mode: 'woocommerce' | 'omni_pos';
  currency?: string;
  currency_symbol?: string;
  currency_pos?: 'left' | 'right' | 'left_space' | 'right_space';
  price_decimals?: number;
  price_decimal_sep?: string;
  price_thousand_sep?: string;
  available_currencies?: CurrencyOption[];
  store_phone: string;
  store_tax_id: string;
  receipt_header: string;
  receipt_footer: string;
  auto_print: boolean;
  sound_effects: boolean;
  low_stock_threshold: number;
  enable_discounts: boolean;
  enable_custom_price: boolean;
  receipt_printer?: string;
  label_printer?: string;
  cash_drawer_kick?: boolean;
  auto_paper_cut?: boolean;
  silent_print?: boolean;
}

export interface PosShift {
  id: number;
  cashier_id: number;
  cashier_name: string;
  opened_at: string;
  closed_at: string | null;
  opening_float: number;
  cash_sales: number;
  card_sales: number;
  other_sales: number;
  cash_in: number;
  cash_out: number;
  expected_cash: number;
  counted_cash: number;
  difference: number;
  orders_count: number;
  status: 'open' | 'closed';
  notes: string | null;
}

export interface CashLog {
  id: number;
  shift_id: number;
  cashier_id: number;
  cashier_name: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  created_at: string;
}

export interface CashierStaff {
  id: number;
  username: string;
  name: string;
  email: string;
  roles: string[];
  is_admin: boolean;
  has_pin: boolean;
  max_discount: number;
  can_refund: boolean;
}

export interface ShiftHistoryResponse {
  success: boolean;
  shifts: PosShift[];
  total: number;
  total_pages: number;
  page: number;
}

export interface AdminReportData {
  range: string;
  date_start: string;
  date_end: string;
  gross_sales: number;
  net_sales: number;
  tax_total: number;
  cash_sales: number;
  card_sales: number;
  other_sales: number;
  orders_count: number;
  avg_order_value: number;
  timeline: Array<{
    label: string;
    sales: number;
    orders: number;
  }>;
  top_products: Array<{
    id: number;
    name: string;
    quantity: number;
    sales: number;
  }>;
  top_categories: Array<{
    id: number;
    name: string;
    sales: number;
    count: number;
  }>;
  cashiers: Array<{
    name: string;
    orders: number;
    sales: number;
  }>;
  currency_symbol: string;
}

export interface AdminCustomer {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  total_spent: number;
  orders_count: number;
  registered?: string;
}

export interface AdminCustomerDetail extends AdminCustomer {
  orders: Array<{
    id: number;
    order_number: string;
    date: string;
    total: number;
    status: string;
    payment_method: string;
    items_count: number;
  }>;
}

export interface OrderItemDetail {
  item_id?: number;
  product_id: number;
  variation_id?: number;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total: number;
  tax: number;
  image?: string;
}

export interface OrderDetail {
  id: number;
  order_number: string;
  date: string;
  date_formatted: string;
  status: string;
  currency: string;
  currency_symbol: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  cashier_id: number;
  cashier_name: string;
  payment_method: string;
  payment_title: string;
  tendered_cash: number;
  change_due: number;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  items_count: number;
  items: OrderItemDetail[];
  note: string;
  is_pos: boolean;
}

export interface OrderUpdatePayload {
  items?: Array<{
    item_id?: number;
    product_id: number;
    variation_id?: number;
    name?: string;
    quantity: number;
    unit_price: number;
  }>;
  discount_amount?: number;
  note?: string;
  status?: string;
}

export interface OrdersListResponse {
  orders: OrderDetail[];
  total: number;
  total_pages: number;
  total_revenue: number;
  page: number;
  per_page: number;
}

export interface Supplier {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  tax_number: string;
  address: string;
  notes: string;
  total_purchases: number;
  created_at: string;
}

export interface PurchaseItem {
  product_id: number;
  variation_id?: number;
  name: string;
  sku: string;
  quantity: number;
  cost_price: number;
  sale_price: number;
  line_total: number;
}

export interface PurchaseInvoice {
  id: number;
  invoice_number: string;
  supplier_id: number;
  supplier_name: string;
  date_received: string;
  status: 'received' | 'pending' | 'cancelled';
  payment_status: 'paid' | 'unpaid' | 'partial';
  payment_method: string;
  items: PurchaseItem[];
  items_count: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes: string;
  created_at: string;
}

export interface PurchasesListResponse {
  success: boolean;
  purchases: PurchaseInvoice[];
  total: number;
  total_pages: number;
  total_amount: number;
  page: number;
  per_page: number;
}

export interface ImportPayload {
  version?: string;
  source?: string;
  exported_at?: string;
  site_url?: string;
  currency?: string;
  categories?: any[];
  products?: any[];
  suppliers?: any[];
  purchases?: any[];
  orders?: any[];
  options?: {
    import_categories?: boolean;
    import_products?: boolean;
    import_suppliers?: boolean;
    import_purchases?: boolean;
    import_orders?: boolean;
    update_existing?: boolean;
  };
}

export interface ImportResponse {
  success: boolean;
  imported: {
    categories: number;
    suppliers: number;
    purchases: number;
    products: number;
  };
  message: string;
}

export interface LanguageOption {
  code: string;
  label: string;
  flag: string;
}

export interface DefaultStringItem {
  cat: string;
  en: string;
  custom_added?: boolean;
}

export interface TranslationsResponse {
  success: boolean;
  languages: LanguageOption[];
  active_language: string;
  resolved_language: string;
  default_strings: Record<string, DefaultStringItem>;
  custom_translations: Record<string, string>;
  resolved_translations: Record<string, string>;
  message?: string;
}

export type AppView = 'pos' | 'admin';
export type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'suppliers'
  | 'products'
  | 'shifts'
  | 'cashiers'
  | 'reports'
  | 'customers'
  | 'translations'
  | 'migration'
  | 'updates'
  | 'settings';

export interface UpdateCheckResult {
  has_update: boolean;
  current_version: string;
  latest_version: string;
  release_name?: string;
  changelog?: string;
  published_at?: string;
  download_url?: string;
  github_url?: string;
  repo?: string;
  error?: string;
}

declare global {
  interface Window {
    omniPosConfig?: {
      restUrl: string;
      posApiUrl: string;
      nonce: string;
      adminUrl: string;
      posUrl: string;
      adminHubUrl: string;
      logoutUrl: string;
      locale: string;
      version: string;
      isAdmin: boolean;
      inventoryMode: 'woocommerce' | 'omni_pos';
      initialView: AppView;
      initialTab?: string;
      i18n: Record<string, string>;
    };
  }
}
