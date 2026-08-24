import type { PosInitData, Product, ProductCategory, Customer, ReceiptData, OrderSummary } from '../types';

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

  const text = await response.text();

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = JSON.parse(text);
      if (errJson.message) {
        errorMsg = errJson.message;
      }
    } catch {
      const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (stripped) {
        errorMsg = stripped.length > 120 ? stripped.slice(0, 120) + '...' : stripped;
      }
    }
    throw new Error(errorMsg);
  }

  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Continue to throw below
      }
    }
    throw new Error('Invalid JSON response from server');
  }
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
   * Fetch orders history with optional search, filtering, and pagination
   */
  async getOrders(
    page: number = 1,
    perPage: number = 20,
    search: string = '',
    status: string = '',
    dateFrom: string = '',
    dateTo: string = ''
  ): Promise<import('../types').OrdersListResponse> {
    let query = `orders?page=${page}&per_page=${perPage}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (status) query += `&status=${encodeURIComponent(status)}`;
    if (dateFrom) query += `&date_from=${encodeURIComponent(dateFrom)}`;
    if (dateTo) query += `&date_to=${encodeURIComponent(dateTo)}`;
    return fetchApi(query);
  },

  /**
   * Get single order detail
   */
  async getOrder(id: number): Promise<{ success: boolean; order: import('../types').OrderDetail }> {
    return fetchApi(`orders/${id}`);
  },

  /**
   * Update order items, prices, discounts, or status
   */
  async updateOrder(
    id: number,
    payload: import('../types').OrderUpdatePayload
  ): Promise<{ success: boolean; order: import('../types').OrderDetail; receipt: import('../types').ReceiptData; message: string }> {
    return fetchApi(`orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete or void order and restore inventory
   */
  async deleteOrder(id: number): Promise<{ success: boolean; message: string }> {
    return fetchApi(`orders/${id}`, {
      method: 'DELETE',
    });
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

  /**
   * Fetch Admin Hub KPI summary stats
   */
  async getAdminDashboard(): Promise<{ success: boolean; stats: import('../types').AdminDashboardStats }> {
    return fetchApi('admin/dashboard');
  },

  /**
   * Fetch Admin Hub settings
   */
  async getAdminSettings(): Promise<{ success: boolean; settings: import('../types').AdminSettings }> {
    return fetchApi('admin/settings');
  },

  /**
   * Update Admin Hub settings
   */
  async updateAdminSettings(settings: Partial<import('../types').AdminSettings>): Promise<{ success: boolean; settings: import('../types').AdminSettings }> {
    return fetchApi('admin/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  /**
   * Fetch Admin Products list with search and filters
   */
  async getAdminProducts(params: {
    page?: number;
    per_page?: number;
    search?: string;
    category_id?: number;
    stock_status?: string;
    orderby?: string;
    order?: string;
  } = {}): Promise<import('../types').AdminProductsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.per_page) query.append('per_page', params.per_page.toString());
    if (params.search) query.append('search', params.search);
    if (params.category_id) query.append('category_id', params.category_id.toString());
    if (params.stock_status && params.stock_status !== 'all') query.append('stock_status', params.stock_status);
    if (params.orderby) query.append('orderby', params.orderby);
    if (params.order) query.append('order', params.order);

    return fetchApi(`admin/products?${query.toString()}`);
  },

  /**
   * Create new product via Admin
   */
  async createAdminProduct(data: import('../types').AdminProductFormData): Promise<{ success: boolean; product: Product; message: string }> {
    return fetchApi('admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update product via Admin
   */
  async updateAdminProduct(id: number, data: Partial<import('../types').AdminProductFormData>): Promise<{ success: boolean; product: Product; message: string }> {
    return fetchApi(`admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete product via Admin
   */
  async deleteAdminProduct(id: number): Promise<{ success: boolean; id: number; message: string }> {
    return fetchApi(`admin/products/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Quick Stock Adjustment (+/- or set)
   */
  async adjustProductStock(id: number, action: 'add' | 'subtract' | 'set', amount: number): Promise<{
    success: boolean;
    id: number;
    stock_quantity: number;
    in_stock: boolean;
    product: Product;
  }> {
    return fetchApi(`admin/products/${id}/stock`, {
      method: 'POST',
      body: JSON.stringify({ action, amount }),
    });
  },

  /**
   * Auto-generate unique EAN-13 barcode
   */
  async generateBarcode(): Promise<{ success: boolean; barcode: string }> {
    return fetchApi('admin/generate-barcode', {
      method: 'POST',
    });
  },

  /**
   * Get currently active shift and logs
   */
  async getCurrentShift(): Promise<{ success: boolean; has_shift: boolean; shift: import('../types').PosShift | null; logs: import('../types').CashLog[] }> {
    return fetchApi('shifts/current');
  },

  /**
   * Open Register Shift
   */
  async openShift(opening_float: number, notes?: string): Promise<{ success: boolean; shift: import('../types').PosShift; message: string }> {
    return fetchApi('shifts/open', {
      method: 'POST',
      body: JSON.stringify({ opening_float, notes }),
    });
  },

  /**
   * Close Register Shift and generate Z-Report
   */
  async closeShift(counted_cash: number, notes?: string, shift_id?: number): Promise<{ success: boolean; shift: import('../types').PosShift; message: string }> {
    return fetchApi('shifts/close', {
      method: 'POST',
      body: JSON.stringify({ counted_cash, notes, shift_id }),
    });
  },

  /**
   * Cash In / Cash Out Movement
   */
  async addCashMovement(type: 'in' | 'out', amount: number, reason: string): Promise<{ success: boolean; shift: import('../types').PosShift; logs: import('../types').CashLog[]; message: string }> {
    return fetchApi('shifts/cash-movement', {
      method: 'POST',
      body: JSON.stringify({ type, amount, reason }),
    });
  },

  /**
   * Get Shift History
   */
  async getShiftHistory(page: number = 1, per_page: number = 15): Promise<import('../types').ShiftHistoryResponse> {
    return fetchApi(`shifts/history?page=${page}&per_page=${per_page}`);
  },

  /**
   * Get Staff / Cashiers list
   */
  async getAdminCashiers(): Promise<{ success: boolean; cashiers: import('../types').CashierStaff[] }> {
    return fetchApi('admin/cashiers');
  },

  /**
   * Create new cashier staff
   */
  async createAdminCashier(data: {
    username: string;
    name?: string;
    email?: string;
    pin?: string;
    max_discount?: number;
    can_refund?: boolean;
  }): Promise<{ success: boolean; cashiers: import('../types').CashierStaff[] }> {
    return fetchApi('admin/cashiers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update cashier staff permissions & PIN
   */
  async updateAdminCashier(id: number, data: {
    name?: string;
    pin?: string;
    max_discount?: number;
    can_refund?: boolean;
  }): Promise<{ success: boolean; cashiers: import('../types').CashierStaff[] }> {
    return fetchApi(`admin/cashiers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Fast Cashier Switch via PIN verification
   */
  async verifyCashierPin(pin: string): Promise<{ success: boolean; cashier: import('../types').CashierInfo }> {
    return fetchApi('cashiers/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  },

  /**
   * Fetch Sales Analytics & Reports
   */
  async getAdminReports(params: {
    range?: string;
    date_from?: string;
    date_to?: string;
  } = {}): Promise<{ success: boolean; reports: import('../types').AdminReportData }> {
    const query = new URLSearchParams();
    if (params.range) query.append('range', params.range);
    if (params.date_from) query.append('date_from', params.date_from);
    if (params.date_to) query.append('date_to', params.date_to);

    return fetchApi(`admin/reports?${query.toString()}`);
  },

  /**
   * Fetch Customers List
   */
  async getAdminCustomers(params: {
    search?: string;
    page?: number;
    per_page?: number;
  } = {}): Promise<{
    success: boolean;
    customers: import('../types').AdminCustomer[];
    total: number;
    total_pages: number;
    page: number;
  }> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.per_page) query.append('per_page', params.per_page.toString());

    return fetchApi(`admin/customers?${query.toString()}`);
  },

  /**
   * Create New Customer
   */
  async createAdminCustomer(data: {
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    city?: string;
    address?: string;
  }): Promise<{ success: boolean; customer: import('../types').AdminCustomer; message: string }> {
    return fetchApi('admin/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get Customer Detail & Order History
   */
  async getAdminCustomerDetail(id: number): Promise<{
    success: boolean;
    customer: import('../types').AdminCustomerDetail;
  }> {
    return fetchApi(`admin/customers/${id}`);
  },

  /**
   * Update Customer
   */
  async updateAdminCustomer(id: number, data: {
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    address?: string;
  }): Promise<{
    success: boolean;
    customer: import('../types').AdminCustomerDetail;
  }> {
    return fetchApi(`admin/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Fetch Suppliers List
   */
  async getSuppliers(search: string = ''): Promise<{
    success: boolean;
    suppliers: import('../types').Supplier[];
    total: number;
  }> {
    const query = search ? `admin/suppliers?search=${encodeURIComponent(search)}` : 'admin/suppliers';
    return fetchApi(query);
  },

  /**
   * Create Supplier
   */
  async createSupplier(data: Partial<import('../types').Supplier>): Promise<{
    success: boolean;
    supplier: import('../types').Supplier;
    message: string;
  }> {
    return fetchApi('admin/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update Supplier
   */
  async updateSupplier(id: number, data: Partial<import('../types').Supplier>): Promise<{
    success: boolean;
    supplier: import('../types').Supplier;
    message: string;
  }> {
    return fetchApi(`admin/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete Supplier
   */
  async deleteSupplier(id: number): Promise<{ success: boolean; message: string }> {
    return fetchApi(`admin/suppliers/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Fetch Purchases / Distribution Invoices
   */
  async getPurchases(
    page: number = 1,
    perPage: number = 20,
    search: string = '',
    supplierId: number = 0,
    status: string = '',
    dateFrom: string = '',
    dateTo: string = ''
  ): Promise<import('../types').PurchasesListResponse> {
    const query = new URLSearchParams();
    query.append('page', page.toString());
    query.append('per_page', perPage.toString());
    if (search) query.append('search', search);
    if (supplierId) query.append('supplier_id', supplierId.toString());
    if (status) query.append('status', status);
    if (dateFrom) query.append('date_from', dateFrom);
    if (dateTo) query.append('date_to', dateTo);

    return fetchApi(`admin/purchases?${query.toString()}`);
  },

  /**
   * Get Single Purchase Invoice
   */
  async getPurchase(id: number): Promise<{
    success: boolean;
    purchase: import('../types').PurchaseInvoice;
  }> {
    return fetchApi(`admin/purchases/${id}`);
  },

  /**
   * Create Purchase Invoice / Receive Stock
   */
  async createPurchase(data: Partial<import('../types').PurchaseInvoice>): Promise<{
    success: boolean;
    purchase: import('../types').PurchaseInvoice;
    message: string;
  }> {
    return fetchApi('admin/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update Purchase Invoice
   */
  async updatePurchase(id: number, data: Partial<import('../types').PurchaseInvoice>): Promise<{
    success: boolean;
    purchase: import('../types').PurchaseInvoice;
    message: string;
  }> {
    return fetchApi(`admin/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete Purchase Invoice
   */
  async deletePurchase(id: number): Promise<{ success: boolean; message: string }> {
    return fetchApi(`admin/purchases/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Import Migration Data from JSON package
   */
  async importMigrationData(payload: import('../types').ImportPayload): Promise<import('../types').ImportResponse> {
    return fetchApi('admin/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch Translation Strings & Languages
   */
  async getTranslations(lang: string = ''): Promise<import('../types').TranslationsResponse> {
    const query = lang ? `admin/translations?lang=${encodeURIComponent(lang)}` : 'admin/translations';
    return fetchApi(query);
  },

  /**
   * Save Language & In-App Custom Translations
   */
  async saveTranslations(
    language: string,
    customTranslations: Record<string, string>
  ): Promise<import('../types').TranslationsResponse> {
    return fetchApi('admin/translations', {
      method: 'POST',
      body: JSON.stringify({
        language,
        custom_translations: customTranslations,
      }),
    });
  },

  /**
   * Scan Codebase & Harvest All Translation Strings
   */
  async scanTranslations(): Promise<{
    success: boolean;
    message: string;
    files_scanned: number;
    total_strings: number;
    strings: Record<string, import('../types').DefaultStringItem & { file: string }>;
  }> {
    return fetchApi('admin/translations/scan', {
      method: 'POST',
    });
  },

  /**
   * Auto-Translate all system strings into target language
   */
  async autoTranslate(targetLanguage: string = 'ka_GE'): Promise<{
    success: boolean;
    message: string;
    files_scanned: number;
    total_strings: number;
    translated_count: number;
    custom_translations: Record<string, string>;
    resolved_translations: Record<string, string>;
  }> {
    return fetchApi('admin/translations/auto-translate', {
      method: 'POST',
      body: JSON.stringify({ target_language: targetLanguage }),
    });
  },

  /**
   * Add a New User-Defined Custom String
   */
  async addCustomString(payload: {
    key: string;
    en: string;
    cat?: string;
    translation?: string;
  }): Promise<import('../types').TranslationsResponse> {
    return fetchApi('admin/translations/custom-string', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete a User-Defined Custom String
   */
  async deleteCustomString(key: string): Promise<import('../types').TranslationsResponse> {
    return fetchApi(`admin/translations/custom-string/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Unified Bulk Deletion
   */
  async bulkDelete(type: string, ids: (number | string)[]): Promise<{ success: boolean; message: string; count: number }> {
    return fetchApi('admin/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ type, ids }),
    });
  },

  /**
   * Check for GitHub Plugin Updates
   */
  async checkUpdates(force: boolean = false): Promise<import('../types').UpdateCheckResult> {
    return fetchApi(`admin/updates/check?force=${force ? 'true' : 'false'}`);
  },

  /**
   * Save GitHub Repository Settings
   */
  async saveUpdateSettings(repo: string, token: string = ''): Promise<{ success: boolean; message: string; repo: string; update: import('../types').UpdateCheckResult }> {
    return fetchApi('admin/updates/settings', {
      method: 'POST',
      body: JSON.stringify({ repo, token }),
    });
  },

  /**
   * 1-Click Install Update
   */
  async installUpdate(): Promise<{ success: boolean; message: string; old_version: string; new_version: string }> {
    return fetchApi('admin/updates/install', {
      method: 'POST',
    });
  },
};



