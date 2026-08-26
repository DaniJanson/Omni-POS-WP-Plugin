import { create } from 'zustand';
import { db } from '../db';
import { posApi } from '../services/api';
import { qzClient } from '../services/qzClient';
import { EscPosBuilder } from '../services/escpos';
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
  AppView,
  AdminTab,
  AdminDashboardStats,
  AdminSettings,
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

  // Views & Navigation
  activeView: AppView;
  adminActiveTab: AdminTab;
  adminStats: AdminDashboardStats | null;
  adminSettings: AdminSettings | null;
  isAdminLoading: boolean;
  currentShift: import('../types').PosShift | null;

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

  // Navigation & View Actions
  setActiveView: (view: AppView) => void;
  setAdminActiveTab: (tab: AdminTab) => void;
  fetchAdminDashboard: () => Promise<void>;
  fetchAdminSettings: () => Promise<void>;
  saveAdminSettings: (settings: Partial<AdminSettings>) => Promise<boolean>;
  fetchCurrentShift: () => Promise<import('../types').PosShift | null>;
  setCurrentShift: (shift: import('../types').PosShift | null) => void;

  // Translations & Language
  currentLanguage: string;
  languages: import('../types').LanguageOption[];
  translations: Record<string, string>;
  customTranslations: Record<string, string>;
  defaultStrings: Record<string, import('../types').DefaultStringItem>;
  fetchTranslations: (lang?: string) => Promise<void>;
  saveTranslations: (lang: string, custom: Record<string, string>) => Promise<boolean>;
  setLanguage: (lang: string) => Promise<void>;

  // Updates
  updateInfo: import('../types').UpdateCheckResult | null;
  isCheckingUpdates: boolean;
  isInstallingUpdate: boolean;
  checkForUpdates: (force?: boolean) => Promise<import('../types').UpdateCheckResult | null>;
  saveUpdateSettings: (repo: string, token?: string) => Promise<boolean>;
  installPluginUpdate: () => Promise<boolean>;

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
  openReceiptModal: (receipt: ReceiptData) => void;
  closeReceiptModal: () => void;
  setOrdersModalOpen: (open: boolean) => void;
  setCustomerModalOpen: (open: boolean) => void;
  isOpenShiftModalOpen: boolean;
  setIsOpenShiftModalOpen: (open: boolean) => void;
  isCloseShiftModalOpen: boolean;
  setIsCloseShiftModalOpen: (open: boolean) => void;
  isCashMovementModalOpen: boolean;
  setIsCashMovementModalOpen: (open: boolean) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const getInitialUrlState = () => {
  if (typeof window === 'undefined') {
    return {
      view: 'pos' as AppView,
      tab: 'dashboard' as AdminTab,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view');
  const tabParam = params.get('tab');
  const isDirectControl = window.omniPosConfig?.inventoryMode === 'omni_pos';
  const isAdmin = window.omniPosConfig?.isAdmin;
  const initialView = window.omniPosConfig?.initialView;
  const initialTab = window.omniPosConfig?.initialTab;

  let view: AppView = 'pos';
  if ((viewParam === 'admin' || initialView === 'admin') && isDirectControl && isAdmin) {
    view = 'admin';
  }

  const validTabs: AdminTab[] = ['dashboard', 'orders', 'suppliers', 'products', 'shifts', 'cashiers', 'reports', 'customers', 'translations', 'migration', 'settings'];
  const tab: AdminTab = validTabs.includes((tabParam || initialTab) as AdminTab)
    ? ((tabParam || initialTab) as AdminTab)
    : 'dashboard';

  return { view, tab };
};

const initialUrlState = getInitialUrlState();

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

  // Views & Admin
  activeView: initialUrlState.view,
  adminActiveTab: initialUrlState.tab,
  adminStats: null,
  adminSettings: null,
  isAdminLoading: false,

  currentShift: null,
  isPaymentModalOpen: false,
  isReceiptModalOpen: false,
  lastReceipt: null,
  isOrdersModalOpen: false,
  isCustomerModalOpen: false,
  isOpenShiftModalOpen: false,
  isCloseShiftModalOpen: false,
  isCashMovementModalOpen: false,
  isSyncing: false,
  syncProgress: null,
  notification: null,
  theme: (typeof window !== 'undefined' && localStorage.getItem('omni_pos_theme') === 'light') ? 'light' : 'dark',

  setActiveView: (view: AppView) => {
    set({ activeView: view });
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (view === 'admin') {
        url.searchParams.set('view', 'admin');
        url.searchParams.set('tab', get().adminActiveTab || 'dashboard');
        get().fetchAdminDashboard();
        get().fetchAdminSettings();
      } else {
        url.searchParams.delete('view');
        url.searchParams.delete('tab');
      }
      window.history.pushState({}, '', url.pathname + url.search);
    }
  },

  setAdminActiveTab: (tab: AdminTab) => {
    set({ adminActiveTab: tab });
    if (typeof window !== 'undefined' && get().activeView === 'admin') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'admin');
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.pathname + url.search);
    }
  },

  setCurrentShift: (shift: import('../types').PosShift | null) => {
    set({ currentShift: shift });
  },

  fetchCurrentShift: async () => {
    try {
      const resp = await posApi.getCurrentShift();
      if (resp.success) {
        set({ currentShift: resp.shift });
        return resp.shift;
      }
      return null;
    } catch (err: any) {
      console.error('Fetch Current Shift Error:', err);
      return null;
    }
  },

  fetchAdminDashboard: async () => {
    set({ isAdminLoading: true });
    try {
      const resp = await posApi.getAdminDashboard();
      if (resp.success && resp.stats) {
        set({ adminStats: resp.stats, isAdminLoading: false });
      }
    } catch (err: any) {
      console.error('Fetch Admin Dashboard Error:', err);
      set({ isAdminLoading: false });
    }
  },

  fetchAdminSettings: async () => {
    try {
      const resp = await posApi.getAdminSettings();
      if (resp.success && resp.settings) {
        set({ adminSettings: resp.settings });
        if ((resp as any).store && get().initData) {
          set({
            initData: {
              ...get().initData!,
              store: (resp as any).store,
            },
          });
        }
      }
    } catch (err: any) {
      console.error('Fetch Admin Settings Error:', err);
    }
  },

  saveAdminSettings: async (settings: Partial<AdminSettings>) => {
    try {
      const resp = await posApi.updateAdminSettings(settings);
      if (resp.success && resp.settings) {
        set({ adminSettings: resp.settings });
        if ((resp as any).store && get().initData) {
          set({
            initData: {
              ...get().initData!,
              store: (resp as any).store,
            },
          });
        }
        sound.setEnabled(resp.settings.sound_effects);
        get().showNotification(t('settings_saved', 'Settings saved successfully!'), 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      sound.playError();
      get().showNotification(t('error_saving_settings', 'Failed to save settings') + ': ' + (err.message || 'Error'), 'error');
      return false;
    }
  },

  // Translation State
  currentLanguage: 'auto',
  languages: [
    { code: 'auto', label: 'Auto (WordPress Default)', flag: '🌐' },
    { code: 'ka_GE', label: 'ქართული (Georgian)', flag: '🇬🇪' },
    { code: 'en_US', label: 'English (US)', flag: '🇺🇸' },
    { code: 'de_DE', label: 'Deutsch (German)', flag: '🇩🇪' },
    { code: 'es_ES', label: 'Español (Spanish)', flag: '🇪🇸' },
    { code: 'fr_FR', label: 'Français (French)', flag: '🇫🇷' },
    { code: 'ru_RU', label: 'Русский (Russian)', flag: '🇷🇺' },
  ],
  translations: (typeof window !== 'undefined' && window.omniPosConfig?.i18n) || {},
  customTranslations: {},
  defaultStrings: {},

  fetchTranslations: async (lang?: string) => {
    try {
      const resp = await posApi.getTranslations(lang);
      if (resp.success) {
        set({
          languages: resp.languages || get().languages,
          currentLanguage: resp.active_language || 'auto',
          defaultStrings: resp.default_strings || {},
          customTranslations: resp.custom_translations || {},
          translations: resp.resolved_translations || {},
        });
      }
    } catch (err: any) {
      console.error('Fetch Translations Error:', err);
    }
  },

  setLanguage: async (lang: string) => {
    try {
      set({ currentLanguage: lang });
      if (lang === 'en_US') {
        const enDict: Record<string, string> = {};
        Object.entries(get().defaultStrings).forEach(([k, v]) => {
          enDict[k] = v.en || k;
        });
        if (Object.keys(enDict).length > 0) {
          set({ translations: enDict });
        }
      }

      const resp = await posApi.saveTranslations(lang, get().customTranslations);
      if (resp.success) {
        set({
          translations: resp.resolved_translations || {},
          customTranslations: resp.custom_translations || {},
          currentLanguage: resp.active_language || lang,
        });
        get().showNotification(lang === 'en_US' ? 'Language switched to English!' : 'ენა წარმატებით შეიცვალა!', 'success');
      }
    } catch (err: any) {
      console.error('Set Language Error:', err);
    }
  },

  saveTranslations: async (lang: string, custom: Record<string, string>) => {
    try {
      const resp = await posApi.saveTranslations(lang, custom);
      if (resp.success) {
        set({
          translations: resp.resolved_translations,
          customTranslations: resp.custom_translations,
          currentLanguage: resp.active_language,
        });
        get().showNotification(resp.message || 'Translations saved successfully!', 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      get().showNotification('Failed to save translations: ' + (err.message || 'Error'), 'error');
      return false;
    }
  },

  // Updates State & Actions
  updateInfo: null,
  isCheckingUpdates: false,
  isInstallingUpdate: false,

  checkForUpdates: async (force = false) => {
    set({ isCheckingUpdates: true });
    try {
      const info = await posApi.checkUpdates(force);
      set({ updateInfo: info, isCheckingUpdates: false });
      return info;
    } catch (err: any) {
      console.warn('Check Updates Error:', err);
      set({ isCheckingUpdates: false });
      return null;
    }
  },

  saveUpdateSettings: async (repo: string, token = '') => {
    try {
      const resp = await posApi.saveUpdateSettings(repo, token);
      if (resp.success) {
        set({ updateInfo: resp.update });
        get().showNotification(resp.message || 'Repo settings saved!', 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      get().showNotification('Error saving repo: ' + (err.message || 'Failed'), 'error');
      return false;
    }
  },

  installPluginUpdate: async () => {
    set({ isInstallingUpdate: true });
    try {
      const resp = await posApi.installUpdate();
      set({ isInstallingUpdate: false });
      if (resp.success) {
        get().showNotification(resp.message || 'Update completed successfully! Reloading...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return true;
      }
      return false;
    } catch (err: any) {
      set({ isInstallingUpdate: false });
      get().showNotification('Installation Failed: ' + (err.message || 'Error'), 'error');
      return false;
    }
  },

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
    // 0. Sync URL popstate
    if (typeof window !== 'undefined' && !(window as any).__omni_pos_popstate_attached) {
      (window as any).__omni_pos_popstate_attached = true;
      window.addEventListener('popstate', () => {
        const state = getInitialUrlState();
        set({ activeView: state.view, adminActiveTab: state.tab });
      });
    }

    // Apply theme on load
    const savedTheme = (typeof window !== 'undefined' && localStorage.getItem('omni_pos_theme') === 'light') ? 'light' : 'dark';
    get().setTheme(savedTheme);

    // If initial view is admin, eagerly fetch dashboard and settings
    if (initialUrlState.view === 'admin') {
      get().fetchAdminDashboard();
      get().fetchAdminSettings();
    }

    try {
      // 1. INSTANT HYDRATION (< 10ms): Load cached init, categories and local products from IndexedDB immediately
      const [cachedInit, cachedCats] = await Promise.all([
        db.getInitData(),
        db.categories.toArray(),
      ]);

      if (cachedInit) {
        set({
          initData: cachedInit,
          isLoadingInit: false,
          categories: cachedCats || [],
          customer: {
            id: 0,
            name: t('walk_in_customer', 'Walk-in Customer (Guest)'),
            email: '',
            phone: '',
            first_name: 'Walk-in',
            last_name: 'Customer',
          },
        });
        sound.setEnabled(cachedInit.settings?.sound_effects ?? true);
      }

      // Render local products immediately to screen
      await get().loadLocalProducts();

      // 2. BACKGROUND NON-BLOCKING REFRESH: Fetch fresh init data & categories in parallel
      Promise.allSettled([
        posApi.getInitData(),
        posApi.getCategories(),
      ]).then(async ([initResult, catsResult]) => {
        if (initResult.status === 'fulfilled' && initResult.value) {
          const freshInit = initResult.value;
          await db.saveInitData(freshInit);
          sound.setEnabled(freshInit.settings?.sound_effects ?? true);
          set({ initData: freshInit, isLoadingInit: false });
        } else {
          set({ isLoadingInit: false });
        }

        if (catsResult.status === 'fulfilled' && catsResult.value?.length) {
          const cats = catsResult.value;
          await db.categories.clear();
          await db.categories.bulkPut(cats);
          set({ categories: cats });
        }
      });

      // 3. BACKGROUND CATALOG DELTA SYNC: Fast chunking with batch size 500
      const localCount = await db.getProductsCount();
      get().syncCatalog(localCount === 0);

      // 4. BACKGROUND UPDATE CHECK: Check GitHub releases
      get().checkForUpdates();
    } catch (err: any) {
      console.error('POS Init Error:', err);
      set({ isLoadingInit: false });
      await get().loadLocalProducts();
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
      const CHUNK_SIZE = 500; // Ultra-fast 500-product batching

      do {
        const resp = await posApi.getProducts(page, CHUNK_SIZE, updatedAfter);
        totalPages = resp.total_pages || 1;

        if (resp.products?.length) {
          if (forceFull && page === 1) {
            await db.products.clear();
          }
          await db.products.bulkPut(resp.products);
          totalFetched += resp.products.length;

          // Progressively render Page 1 immediately for instant (<0.05s) user feedback
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
    const { currentShift, adminSettings } = get();
    const isDirectControl = (adminSettings?.inventory_mode || window.omniPosConfig?.inventoryMode) === 'omni_pos';
    if (isDirectControl && (!currentShift || currentShift.status !== 'open')) {
      sound.playError();
      get().showNotification(t('shift_required_prompt', 'Please open a register shift before scanning or selling products!'), 'error');
      set({ isOpenShiftModalOpen: true });
      return;
    }

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

    const { currentShift, adminSettings } = get();
    const isDirectControl = (adminSettings?.inventory_mode || window.omniPosConfig?.inventoryMode) === 'omni_pos';
    if (isDirectControl && (!currentShift || currentShift.status !== 'open')) {
      sound.playError();
      get().showNotification(t('shift_required_prompt', 'Please open a register shift before scanning or selling products!'), 'error');
      set({ isOpenShiftModalOpen: true });
      return false;
    }

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
    const { currentShift, adminSettings } = get();
    const isDirectControl = (adminSettings?.inventory_mode || window.omniPosConfig?.inventoryMode) === 'omni_pos';
    if (isDirectControl && (!currentShift || currentShift.status !== 'open')) {
      sound.playError();
      get().showNotification(t('shift_required_prompt', 'Please open a register shift before scanning or selling products!'), 'error');
      set({ isOpenShiftModalOpen: true });
      return;
    }

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
        const settings = initData?.settings;
        const receiptPrinter = settings?.receipt_printer;
        const isSilentPrint = settings?.silent_print !== false;

        // Try QZ Tray Silent Direct Thermal Print & Cash Drawer Kick
        let printedSilently = false;
        if (qzClient.isConnected() && receiptPrinter && isSilentPrint) {
          try {
            const rawEscPos = EscPosBuilder.buildReceipt(result.receipt as any, initData?.store, {
              kickDrawer: payment.method === 'cash' && settings?.cash_drawer_kick !== false,
              autoCut: settings?.auto_paper_cut !== false,
              receiptHeader: settings?.receipt_header,
              receiptFooter: settings?.receipt_footer,
            });
            await qzClient.printRaw(receiptPrinter, rawEscPos);
            printedSilently = true;
          } catch (printErr) {
            console.warn('Silent QZ print failed, falling back to modal:', printErr);
          }
        }

        set({
          isPaymentModalOpen: false,
          lastReceipt: result.receipt,
          isReceiptModalOpen: !printedSilently,
          cart: [],
          orderDiscountAmount: 0,
          orderNote: '',
        });

        // Live refresh shift sales and drawer balance
        get().fetchCurrentShift();

        if (!printedSilently && initData?.settings.auto_print) {
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

  openReceiptModal: (receipt: ReceiptData) => {
    set({ lastReceipt: receipt, isReceiptModalOpen: true });
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

  setIsOpenShiftModalOpen: (open: boolean) => {
    set({ isOpenShiftModalOpen: open });
  },

  setIsCloseShiftModalOpen: (open: boolean) => {
    set({ isCloseShiftModalOpen: open });
  },

  setIsCashMovementModalOpen: (open: boolean) => {
    set({ isCashMovementModalOpen: open });
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
