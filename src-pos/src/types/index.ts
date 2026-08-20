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
  variations?: ProductVariation[];
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
