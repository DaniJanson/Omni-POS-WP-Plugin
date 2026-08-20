import type { PosInitData, Product, ProductCategory, Customer, ReceiptData, OrderSummary } from '../types';

declare global {
  interface Window {
    omniPosConfig?: {
      restUrl: string;
      posApiUrl: string;
      nonce: string;
      adminUrl: string;
      logoutUrl: string;
      locale?: string;
      version: string;
      i18n?: Record<string, string>;
    };
  }
}

function getApiUrl(): string {
  const cfg = window.omniPosConfig?.posApiUrl;
  if (cfg) {
    return cfg.endsWith('/') ? cfg : `${cfg}/`;
  }
  return 'http://localhost/omni/wp-json/omni-pos/v1/';
}

function getNonce(): string {
  return window.omniPosConfig?.nonce || '';
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${endpoint.replace(/^\//, '')}`;
  const nonce = getNonce();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(nonce ? { 'X-WP-Nonce': nonce } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.message) {
        errorMsg = errJson.message;
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const posApi = {
  /**
   * Fetch initialization settings, cashier & store metadata
   */
  async getInitData(): Promise<PosInitData> {
    return fetchApi<PosInitData>('init');
  },

  /**
   * Fetch paginated / delta products
   */
  async getProducts(page: number = 1, perPage: number = 250, updatedAfter?: number): Promise<{
    products: Product[];
    total: number;
    total_pages: number;
    current_page: number;
    server_time: number;
  }> {
    let query = `products?page=${page}&per_page=${perPage}`;
    if (updatedAfter) {
      query += `&updated_after=${updatedAfter}`;
    }
    return fetchApi(query);
  },

  /**
   * Fetch categories list
   */
  async getCategories(): Promise<ProductCategory[]> {
    return fetchApi<ProductCategory[]>('categories');
  },

  /**
   * Fetch customers list or search
   */
  async getCustomers(search: string = ''): Promise<Customer[]> {
    const query = search ? `customers?search=${encodeURIComponent(search)}` : 'customers';
    return fetchApi<Customer[]>(query);
  },

  /**
   * Create quick customer
   */
  async createCustomer(data: { first_name: string; last_name?: string; phone: string; email?: string }): Promise<Customer> {
    return fetchApi<Customer>('customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Create POS Order
   */
  async createOrder(orderPayload: {
    items: Array<{
      id: number;
      variation_id?: number;
      quantity: number;
      custom_price?: number;
      note?: string;
    }>;
    customer_id: number;
    payment_method: string;
    tendered_cash?: number;
    change_due?: number;
    split_details?: { cash: number; card: number };
    discount_amount?: number;
    note?: string;
  }): Promise<{ success: boolean; order_id: number; receipt: ReceiptData }> {
    return fetchApi('orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });
  },

  /**
   * Fetch recent orders history
   */
  async getOrders(page: number = 1, perPage: number = 20): Promise<{
    orders: OrderSummary[];
    total: number;
    total_pages: number;
  }> {
    return fetchApi(`orders?page=${page}&per_page=${perPage}`);
  },

  /**
   * Barcode real-time lookup fallback
   */
  async lookupBarcode(barcode: string): Promise<Product> {
    return fetchApi<Product>('barcode-lookup', {
      method: 'POST',
      body: JSON.stringify({ barcode }),
    });
  },
};
