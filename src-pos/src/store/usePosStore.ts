import { create } from 'zustand';
import { db } from '../db';
import { posApi } from '../services/api';
import { sound } from '../utils/sound';
import { t } from '../utils/i18n';
import type {
  Product,
  ProductVariation,
  ProductCategory,
  Customer,
  CartItem,
  PosInitData,
  ReceiptData,
  PaymentDetails,
} from '../types';

interface SyncProgress {
  current: number;
  total: number;
  message: string;
}

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface PosState {
  // Init data
  initData: PosInitData | null;
  isLoadingInit: boolean;
  
  // Local catalog & Filters
  products: Product[];
  categories: ProductCategory[];
  selectedCategoryId: number;
  searchQuery: string;
  isProductsLoading: boolean;

  // Cart
  cart: CartItem[];
  customer: Customer | null;
  orderDiscountAmount: number;
  orderNote: string;

  // Modals & UI state
  isPaymentModalOpen: boolean;
  isReceiptModalOpen: boolean;
  lastReceipt: ReceiptData | null;
  isOrdersModalOpen: boolean;
  isCustomerModalOpen: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  notification: NotificationState | null;
  theme: 'dark' | 'light';

  // Actions
  initialize: () => Promise<void>;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  syncCatalog: (forceFull?: boolean) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategoryId: (catId: number) => void;
  loadLocalProducts: () => Promise<void>;
  
  // Cart Actions
  addToCart: (product: Product, variation?: ProductVariation, qty?: number) => void;
  removeFromCart: (cartId: string) => void;
  updateItemQty: (cartId: string, qty: number) => void;
  updateItemPrice: (cartId: string, customPrice: number) => void;
  updateItemDiscount: (cartId: string, percent: number) => void;
  updateItemNote: (cartId: string, note: string) => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  setOrderDiscountAmount: (amount: number) => void;
  setOrderNote: (note: string) => void;

  // Scanner & Checkout
  handleBarcodeScan: (barcode: string) => Promise<boolean>;
  openPaymentModal: () => void;
  closePaymentModal: () => void;
  completeCheckout: (payment: PaymentDetails) => Promise<boolean>;
  closeReceiptModal: () => void;
  setOrdersModalOpen: (open: boolean) => void;
  setCustomerModalOpen: (open: boolean) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const usePosStore = create<PosState>((set, get) => ({
  initData: null,
  isLoadingInit: true,
  products: [],
  categories: [],
  selectedCategoryId: 0,
  searchQuery: '',
  isProductsLoading: false,

  cart: [],
  customer: null,
  orderDiscountAmount: 0,
  orderNote: '',

  isPaymentModalOpen: false,
  isReceiptModalOpen: false,
  lastReceipt: null,
  isOrdersModalOpen: false,
  isCustomerModalOpen: false,
  isSyncing: false,
  syncProgress: null,
  notification: null,
  theme: (typeof window !== 'undefined' && localStorage.getItem('omni_pos_theme') === 'light') ? 'light' : 'dark',

  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  setTheme: (theme: 'dark' | 'light') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('omni_pos_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
    set({ theme });
  },

  initialize: async () => {
    // Apply theme on load
    const savedTheme = (typeof window !== 'undefined' && localStorage.getItem('omni_pos_theme') === 'light') ? 'light' : 'dark';
    get().setTheme(savedTheme);
    set({ isLoadingInit: true });
    try {
      // 1. Load cached init data from Dexie first for instant launch
      const cachedInit = await db.getInitData();
      if (cachedInit) {
        set({ initData: cachedInit, isLoadingInit: false });
        sound.setEnabled(cachedInit.settings.sound_effects);
      }

      // 2. Fetch fresh init data from backend
      const freshInit = await posApi.getInitData();
      await db.saveInitData(freshInit);
      sound.setEnabled(freshInit.settings.sound_effects);

      set({
        initData: freshInit,
        isLoadingInit: false,
        customer: {
          id: 0,
          name: t('walk_in_customer', 'Walk-in Customer (Guest)'),
          email: '',
          phone: '',
          first_name: 'Walk-in',
          last_name: 'Customer',
        },
      });

      // 3. Load categories from API & save to Dexie
      try {
        const cats = await posApi.getCategories();
        if (cats?.length) {
          await db.categories.clear();
          await db.categories.bulkPut(cats);
          set({ categories: cats });
        }
      } catch {
        const cachedCats = await db.categories.toArray();
        set({ categories: cachedCats });
      }

      // 4. Load local products immediately (<2ms)
      await get().loadLocalProducts();

      // 5. Non-blocking background sync
      const localCount = await db.getProductsCount();
      get().syncCatalog(localCount === 0);
    } catch (err: any) {
      console.error('POS Init Error:', err);
      get().showNotification(t('sync_error', 'Connection error') + ': ' + (err.message || 'Error'), 'error');
      set({ isLoadingInit: false });
    }
  },

  syncCatalog: async (forceFull = false) => {
    set({ isSyncing: true });
    try {
      let updatedAfter: number | undefined;
      if (!forceFull) {
        const latestProduct = await db.products.orderBy('updated_at').last();
        if (latestProduct && latestProduct.updated_at) {
          updatedAfter = latestProduct.updated_at;
        }
      }

      let page = 1;
      let totalPages = 1;
      let totalFetched = 0;

      do {
        const resp = await posApi.getProducts(page, 100, updatedAfter);
        totalPages = resp.total_pages || 1;

        if (resp.products?.length) {
          if (forceFull && page === 1) {
            await db.products.clear();
          }
          await db.products.bulkPut(resp.products);
          totalFetched += resp.products.length;

          // Progressively render Page 1 immediately for instant (<0.1s) user feedback
          if (page === 1 || get().products.length === 0) {
            get().loadLocalProducts();
          }
        }

        page++;
      } while (page <= totalPages);

      set({ isSyncing: false, syncProgress: null });
      await get().loadLocalProducts();
      if (totalFetched > 0) {
        get().showNotification(`${t('catalogue_synced', 'Catalogue synced')} (${totalFetched} items)`, 'success');
      }
    } catch (err: any) {
      console.error('Sync Error:', err);
      set({ isSyncing: false, syncProgress: null });
    }
  },

  loadLocalProducts: async () => {
    set({ isProductsLoading: true });
    const { searchQuery, selectedCategoryId } = get();
    try {
      const items = await db.searchProducts(searchQuery, selectedCategoryId, 80);
      set({ products: items, isProductsLoading: false });
    } catch {
      set({ isProductsLoading: false });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().loadLocalProducts();
  },

  setSelectedCategoryId: (catId: number) => {
    set({ selectedCategoryId: catId });
    get().loadLocalProducts();
  },

  addToCart: (product: Product, variation?: ProductVariation, qty: number = 1) => {
    sound.playScanBeep();
    const cart = [...get().cart];
    const cartId = variation ? `var_${variation.id}` : `prod_${product.id}`;
    
    const existingIndex = cart.findIndex(item => item.cart_id === cartId);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.unshift({
        cart_id: cartId,
        product_id: product.id,
        variation_id: variation?.id,
        name: variation ? `${product.name} (${Object.values(variation.attributes).join(', ')})` : product.name,
        sku: variation?.sku || product.sku,
        barcode: variation?.barcode || product.barcode,
        price: variation ? variation.price : product.price,
        regular_price: variation ? variation.regular_price : product.regular_price,
        quantity: qty,
        stock_quantity: variation ? variation.stock_quantity : product.stock_quantity,
        image: variation?.image || product.image,
        tax_status: product.tax_status,
        tax_class: product.tax_class,
      });
    }

    set({ cart });
  },

  removeFromCart: (cartId: string) => {
    set({ cart: get().cart.filter(item => item.cart_id !== cartId) });
  },

  updateItemQty: (cartId: string, qty: number) => {
    if (qty <= 0) {
      get().removeFromCart(cartId);
      return;
    }
    const cart = get().cart.map(item => (item.cart_id === cartId ? { ...item, quantity: qty } : item));
    set({ cart });
  },

  updateItemPrice: (cartId: string, customPrice: number) => {
    const cart = get().cart.map(item => (item.cart_id === cartId ? { ...item, custom_price: customPrice, price: customPrice } : item));
    set({ cart });
  },

  updateItemDiscount: (cartId: string, percent: number) => {
    const cart = get().cart.map(item => (item.cart_id === cartId ? { ...item, custom_discount_percent: percent } : item));
    set({ cart });
  },

  updateItemNote: (cartId: string, note: string) => {
    const cart = get().cart.map(item => (item.cart_id === cartId ? { ...item, note } : item));
    set({ cart });
  },

  clearCart: () => {
    set({ cart: [], orderDiscountAmount: 0, orderNote: '' });
  },

  setCustomer: (customer: Customer | null) => {
    set({ customer });
  },

  setOrderDiscountAmount: (amount: number) => {
    set({ orderDiscountAmount: amount });
  },

  setOrderNote: (note: string) => {
    set({ orderNote: note });
  },

  handleBarcodeScan: async (barcode: string): Promise<boolean> => {
    if (!barcode) return false;
    const clean = barcode.trim();

    // 1. Look up in IndexedDB first (< 5ms)
    let product = await db.findByBarcode(clean);

    if (product) {
      let matchingVar: ProductVariation | undefined;
      if (product.variations?.length) {
        matchingVar = product.variations.find(v => v.barcode === clean || v.sku === clean);
      }
      get().addToCart(product, matchingVar, 1);
      get().showNotification(`${t('added_to_cart', 'Added to cart')}: ${product.name}`, 'success');
      return true;
    }

    // 2. Fallback to API lookup
    try {
      const liveProduct = await posApi.lookupBarcode(clean);
      if (liveProduct) {
        await db.products.put(liveProduct);
        get().addToCart(liveProduct, undefined, 1);
        get().showNotification(`${t('added_to_cart', 'Added to cart')}: ${liveProduct.name}`, 'success');
        return true;
      }
    } catch {
      sound.playError();
      get().showNotification(`${t('product_not_found', 'Product not found with barcode')} [${clean}]`, 'error');
      return false;
    }

    sound.playError();
    get().showNotification(`${t('product_not_found', 'Product not found with barcode')} [${clean}]`, 'error');
    return false;
  },

  openPaymentModal: () => {
    if (get().cart.length === 0) {
      get().showNotification(t('cart_empty', 'Cart is empty'), 'error');
      return;
    }
    set({ isPaymentModalOpen: true });
  },

  closePaymentModal: () => {
    set({ isPaymentModalOpen: false });
  },

  completeCheckout: async (payment: PaymentDetails): Promise<boolean> => {
    const { cart, customer, orderDiscountAmount, orderNote, initData } = get();

    if (cart.length === 0) {
      get().showNotification(t('cart_empty', 'Cart is empty'), 'error');
      return false;
    }

    try {
      const orderPayload = {
        items: cart.map(item => ({
          id: item.product_id,
          variation_id: item.variation_id,
          quantity: item.quantity,
          custom_price: item.custom_price || item.price,
          note: item.note,
        })),
        customer_id: customer?.id || 0,
        payment_method: payment.method,
        tendered_cash: payment.tendered_cash,
        change_due: payment.change_due,
        split_details: payment.split_details,
        discount_amount: orderDiscountAmount,
        note: orderNote,
      };

      const result = await posApi.createOrder(orderPayload);

      if (result.success && result.receipt) {
        sound.playSuccessChime();
        set({
          isPaymentModalOpen: false,
          lastReceipt: result.receipt,
          isReceiptModalOpen: true,
          cart: [],
          orderDiscountAmount: 0,
          orderNote: '',
        });

        if (initData?.settings.auto_print) {
          setTimeout(() => {
            window.print();
          }, 300);
        }

        get().showNotification(`${t('order_created', 'Order created successfully!')} #${result.order_id}`, 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      sound.playError();
      get().showNotification(t('sync_error', 'Order failed') + ': ' + (err.message || 'Error'), 'error');
      return false;
    }
  },

  closeReceiptModal: () => {
    set({ isReceiptModalOpen: false, lastReceipt: null });
  },

  setOrdersModalOpen: (open: boolean) => {
    set({ isOrdersModalOpen: open });
  },

  setCustomerModalOpen: (open: boolean) => {
    set({ isCustomerModalOpen: open });
  },

  showNotification: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    set({ notification: { message, type } });
    setTimeout(() => {
      if (get().notification?.message === message) {
        set({ notification: null });
      }
    }, 3500);
  },
}));
