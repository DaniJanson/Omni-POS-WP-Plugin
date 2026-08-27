import React from 'react';
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
    currentLanguage,
    translations,
  } = usePosStore();

  const inventoryMode = adminSettings?.inventory_mode || window.omniPosConfig?.inventoryMode || 'woocommerce';

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

  const { updateInfo } = usePosStore();

  return (
    <div className="h-screen w-screen flex bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 overflow-hidden font-sans select-none">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 shadow-sm z-30 transition-colors overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
          {/* Admin Hub Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
                <Zap className="w-5 h-5 fill-white/30" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                  Omni POS
                </h1>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Admin Hub
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

        {/* Sidebar Footer with Back to Register */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
          {/* Back to POS Register Button */}
          <button
            onClick={() => setActiveView('pos')}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back_to_pos', 'Back to Register (POS)')}</span>
          </button>

          {/* Cashier profile & store name */}
          <div className="px-2 py-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="truncate max-w-[120px] font-medium">
              {initData?.cashier.name || 'Admin'}
            </span>
            <span className="text-[10px] font-mono opacity-70">
              v{window.omniPosConfig?.version || '1.0.0'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800/80 px-6 flex items-center justify-between shrink-0 shadow-sm z-20 transition-colors">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white capitalize">
              {adminActiveTab.replace('_', ' ')}
            </h2>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {initData?.store.name || 'Store Management'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-500 dark:text-blue-300 active:scale-95 transition-all border border-slate-200 dark:border-slate-700/80 shadow-sm"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick Back to Register shortcut */}
            <button
              onClick={() => setActiveView('pos')}
              className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
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
