import React, { useState, useRef, useEffect } from 'react';
import { usePosStore } from '../../store/usePosStore';
import { AdminDashboard } from './AdminDashboard';
import { AdminOrdersView } from './AdminOrdersView';
import { AdminSuppliersView } from './AdminSuppliersView';
import { AdminImportView } from './AdminImportView';
import { AdminTranslationsView } from './AdminTranslationsView';
import { AdminSettingsView } from './AdminSettingsView';
import { AdminProductsView } from './AdminProductsView';
import { AdminShiftsView } from './AdminShiftsView';
import { AdminCashiersView } from './AdminCashiersView';
import { AdminReportsView } from './AdminReportsView';
import { AdminCustomersView } from './AdminCustomersView';
import { AdminUpdatesView } from './AdminUpdatesView';
import type { AdminTab } from '../../types';
import { t } from '../../utils/i18n';
import {
  LayoutDashboard,
  Receipt,
  Truck,
  Package,
  CircleDollarSign,
  Users,
  BarChart3,
  UserCheck,
  Languages,
  Settings,
  UploadCloud,
  ArrowLeft,
  Sun,
  Moon,
  Zap,
  Sparkles,
  Layers,
  ShoppingBag,
  Store,
  ChevronDown,
  User,
  Shield,
  LogOut,
  Maximize2,
  Minimize2,
  ArrowRight,
} from 'lucide-react';

interface SidebarItem {
  id: AdminTab;
  labelKey: string;
  defaultLabel: string;
  subKey: string;
  defaultSub: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'dashboard', labelKey: 'tab_dashboard', defaultLabel: 'Dashboard', subKey: 'tab_dashboard_sub', defaultSub: 'Stats & Overview', icon: LayoutDashboard },
  { id: 'orders', labelKey: 'tab_orders', defaultLabel: 'Sales', subKey: 'tab_orders_sub', defaultSub: 'Receipts & History', icon: Receipt },
  { id: 'suppliers', labelKey: 'tab_suppliers', defaultLabel: 'Suppliers', subKey: 'tab_suppliers_sub', defaultSub: 'Intake & Orders', icon: Truck },
  { id: 'products', labelKey: 'tab_products', defaultLabel: 'Products', subKey: 'tab_products_sub', defaultSub: 'Stock & Catalog', icon: Package },
  { id: 'shifts', labelKey: 'tab_shifts', defaultLabel: 'Register', subKey: 'tab_shifts_sub', defaultSub: 'Shifts & Cash', icon: CircleDollarSign },
  { id: 'cashiers', labelKey: 'tab_cashiers', defaultLabel: 'Staff', subKey: 'tab_cashiers_sub', defaultSub: 'Cashiers & Roles', icon: UserCheck },
  { id: 'reports', labelKey: 'tab_reports', defaultLabel: 'Reports', subKey: 'tab_reports_sub', defaultSub: 'Analytics & Charts', icon: BarChart3 },
  { id: 'customers', labelKey: 'tab_customers', defaultLabel: 'Customers', subKey: 'tab_customers_sub', defaultSub: 'Directory & History', icon: Users },
  { id: 'translations', labelKey: 'tab_translations', defaultLabel: 'Languages', subKey: 'tab_translations_sub', defaultSub: 'Translations & i18n', icon: Languages },
  { id: 'migration', labelKey: 'tab_migration', defaultLabel: 'Migration', subKey: 'tab_migration_sub', defaultSub: 'Import & Export', icon: UploadCloud },
  { id: 'updates', labelKey: 'tab_updates', defaultLabel: 'Updates', subKey: 'tab_updates_sub', defaultSub: 'Versions & System', icon: Sparkles },
  { id: 'settings', labelKey: 'tab_settings', defaultLabel: 'Settings', subKey: 'tab_settings_sub', defaultSub: 'Hardware & Setup', icon: Settings },
];

export const AdminLayout: React.FC = () => {
  const {
    adminActiveTab,
    setAdminActiveTab,
    setActiveView,
    adminSettings,
    theme,
    toggleTheme,
    initData,
    updateInfo,
  } = usePosStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const inventoryMode = adminSettings?.inventory_mode || window.omniPosConfig?.inventoryMode || 'woocommerce';
  const cashierName = initData?.cashier?.name || 'Admin';
  const cashierRole = initData?.cashier?.capabilities?.manage_pos || window.omniPosConfig?.isAdmin ? 'Administrator' : 'Cashier';
  const cashierInitial = cashierName.charAt(0).toUpperCase();

  const activeItem = SIDEBAR_ITEMS.find((i) => i.id === adminActiveTab);
  const currentTitle = activeItem ? t(activeItem.labelKey, activeItem.defaultLabel) : adminActiveTab;

  const renderContent = () => {
    switch (adminActiveTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'orders':
        return <AdminOrdersView />;
      case 'suppliers':
        return <AdminSuppliersView />;
      case 'translations':
        return <AdminTranslationsView />;
      case 'migration':
        return <AdminImportView />;
      case 'updates':
        return <AdminUpdatesView />;
      case 'settings':
        return <AdminSettingsView />;
      case 'products':
        return <AdminProductsView />;
      case 'shifts':
        return <AdminShiftsView />;
      case 'cashiers':
        return <AdminCashiersView />;
      case 'reports':
        return <AdminReportsView />;
      case 'customers':
        return <AdminCustomersView />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="h-screen w-screen flex bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 overflow-hidden font-sans select-none">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 shadow-sm z-30 transition-colors overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
          {/* Admin Hub Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0">
                <Zap className="w-5 h-5 fill-white/20" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-none">
                    Omni POS
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    PRO
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                  {t('admin_hub_title', 'ადმინ პანელი')}
                </span>
              </div>
            </div>
          </div>

          {/* Mode Indicator Card */}
          <div className="p-3 shrink-0">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-medium">Management Mode</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {inventoryMode === 'omni_pos' ? '⚡ Omni Direct Control' : '🛍️ WooCommerce Standard'}
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="px-3 pb-3 space-y-1 mt-0.5">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = adminActiveTab === item.id;
              const label = t(item.labelKey, item.defaultLabel);
              const subLabel = t(item.subKey, item.defaultSub);
              const isUpdateTab = item.id === 'updates';
              const hasUpdateNotification = isUpdateTab && updateInfo?.has_update;

              return (
                <button
                  key={item.id}
                  onClick={() => setAdminActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700/80 group-hover:text-slate-800 dark:group-hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0 truncate">
                      <span
                        className={`text-xs font-bold leading-tight truncate ${
                          isActive ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {label}
                      </span>
                      <span
                        className={`text-[10px] font-medium leading-tight mt-0.5 truncate ${
                          isActive
                            ? 'text-blue-100/85'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400'
                        }`}
                      >
                        {subLabel}
                      </span>
                    </div>
                  </div>

                  {hasUpdateNotification && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Minimal Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 shrink-0 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-600 dark:text-slate-400">Omni Engine</span>
          </div>
          <span className="font-mono text-[10px] bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-semibold">
            v{window.omniPosConfig?.version || '1.2.1'}
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800/80 px-6 flex items-center justify-between shrink-0 shadow-sm z-20 transition-colors">
          {/* Left Title & Store Badge */}
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              {currentTitle}
            </h2>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/25 border border-blue-100 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              <Store className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{initData?.store.name || 'Store'}</span>
            </div>
          </div>

          {/* Right Action Controls & Admin Profile */}
          <div className="flex items-center space-x-3">
            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-500 dark:text-blue-300 active:scale-95 transition-all border border-slate-200 dark:border-slate-700/80 shadow-sm cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Prominent POS Register Button */}
            <button
              onClick={() => setActiveView('pos')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('open_pos_register_btn', 'სალაროზე გადასვლა')}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* Admin Profile Widget & Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/80 transition-all active:scale-95 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                  {cashierInitial}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {cashierName}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                    {cashierRole}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-2 text-xs divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
                  {/* User Info Header */}
                  <div className="p-3">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20">
                        {cashierInitial}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {cashierName}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">
                          {cashierRole}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <span>{t('store', 'მაღაზია')}:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {initData?.store.name || 'Amore'}
                      </span>
                    </div>
                  </div>

                  {/* Actions List */}
                  <div className="py-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setAdminActiveTab('settings');
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>{t('settings', 'პარამეტრები')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        toggleFullscreen();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4 text-slate-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
                      <span>{isFullscreen ? t('exit_fullscreen', 'სრული ეკრანიდან გამოსვლა') : t('fullscreen', 'სრული ეკრანი')}</span>
                    </button>
                  </div>

                  {/* Back to POS / Logout */}
                  <div className="pt-1.5">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setActiveView('pos');
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold transition-colors text-left"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{t('open_pos_register_btn', 'სალაროზე გადასვლა')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-[#080d1a]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
