import React, { useEffect } from 'react';
import { usePosStore } from '../../store/usePosStore';
import { t } from '../../utils/i18n';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Package,
  RotateCw,
  Settings,
  CreditCard,
  Banknote,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    adminStats,
    isAdminLoading,
    fetchAdminDashboard,
    setActiveView,
    setAdminActiveTab,
    syncCatalog,
    isSyncing,
  } = usePosStore();

  useEffect(() => {
    fetchAdminDashboard();
  }, [fetchAdminDashboard]);

  const currency = adminStats?.currency_symbol || '$';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide uppercase">
              {t('live_pos_hub', 'Live POS Hub')}
            </span>
            <span className="text-xs text-blue-100 font-medium">{t('realtime_stats', 'Real-time stats')}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{t('omni_pos_dashboard', 'Omni POS Dashboard')}</h1>
          <p className="text-sm text-blue-100/90 mt-1 max-w-xl">
            {t('dashboard_subtitle', 'Centralized management for registers, inventory levels, cashier shifts, and sales performance.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAdminDashboard()}
            disabled={isAdminLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAdminLoading ? 'animate-spin' : ''}`} />
            <span>{t('sync_catalogue', 'Refresh')}</span>
          </button>

          <button
            onClick={() => setActiveView('pos')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t('back_to_pos', 'Open Register')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-semibold">{t('today_sales', "Today's Sales")}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {currency}{adminStats?.today_sales.toFixed(2) || '0.00'}
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-emerald-500" />
              {t('cash', 'Cash')}: {currency}{adminStats?.today_cash_sales.toFixed(2) || '0.00'}
            </span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-blue-500" />
              {t('card', 'Card')}: {currency}{adminStats?.today_card_sales.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-semibold">{t('today_orders', "Today's Orders")}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {adminStats?.today_orders_count || 0}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {t('completed_sales', 'Completed transactions')}
          </p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-semibold">{t('average_order_value', 'Avg. Order Value')}</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {currency}{adminStats?.avg_order_value.toFixed(2) || '0.00'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {t('per_customer_basket', 'Per customer basket')}
          </p>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-semibold">{t('low_stock_items', 'Low Stock Items')}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {adminStats?.low_stock_count || 0}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {t('below_threshold', 'Below threshold (≤ 5 units)')}
          </p>
        </div>
      </div>

      {/* Main Two-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Low Stock Warning Table & Products Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Low Stock Items Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('stock_alert_health', 'Stock Alert & Health')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('products_requiring_restock', 'Products requiring restock or attention')}
                </p>
              </div>

              <button
                onClick={() => setAdminActiveTab('products')}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <span>{t('view_all_products', 'View all products')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {adminStats?.low_stock_products && adminStats.low_stock_products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="pb-3 font-semibold">{t('item', 'Product')}</th>
                      <th className="pb-3 font-semibold">{t('sku', 'SKU')}</th>
                      <th className="pb-3 font-semibold">{t('price', 'Price')}</th>
                      <th className="pb-3 font-semibold text-right">{t('remaining_stock', 'Remaining Stock')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {adminStats.low_stock_products.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 font-medium text-slate-800 dark:text-slate-200">
                          {item.name}
                        </td>
                        <td className="py-3 font-mono text-slate-500 dark:text-slate-400">
                          {item.sku || '—'}
                        </td>
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">
                          {currency}{item.price.toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                            {item.stock_quantity} {t('in_stock_unit', 'left')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">{t('all_stock_healthy', 'All stock levels look healthy!')}</p>
                <p className="text-[11px]">{t('no_items_below_threshold', 'No items are currently below the low stock threshold.')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Control Shortcuts */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {t('quick_controls', 'Quick Controls')}
            </h2>

            <div className="space-y-2.5">
              <button
                onClick={() => setActiveView('pos')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-semibold transition-all border border-blue-200 dark:border-blue-500/20 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t('launch_pos_register', 'Launch POS Register')}</span>
                </div>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setAdminActiveTab('settings')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700/80 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>{t('pos_settings_tab', 'POS & Receipt Settings')}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => syncCatalog(true)}
                disabled={isSyncing}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700/80 disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <RotateCw className={`w-4 h-4 text-blue-500 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{t('full_sync_button', 'Full Catalogue Sync')}</span>
                </div>
                <span className="text-[10px] text-slate-400">IndexedDB</span>
              </button>

              {window.omniPosConfig?.adminUrl && (
                <a
                  href={window.omniPosConfig.adminUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700/80"
                >
                  <div className="flex items-center gap-2.5">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    <span>{t('wp_admin_backend', 'WP Admin Backend')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">wp-admin</span>
                </a>
              )}
            </div>
          </div>

          {/* System Performance Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">⚡ {t('performance_metrics', 'Performance Metrics')}</h3>
            <div className="space-y-2 text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>{t('total_catalog_items', 'Total Catalog Items')}:</span>
                <strong className="text-slate-800 dark:text-slate-200">{adminStats?.total_products_count || 0}</strong>
              </div>
              <div className="flex justify-between">
                <span>{t('indexeddb_lookup', 'IndexedDB Lookup')}:</span>
                <strong className="text-emerald-500">&lt; 3ms</strong>
              </div>
              <div className="flex justify-between">
                <span>{t('thermal_output', 'Thermal Output')}:</span>
                <strong className="text-slate-800 dark:text-slate-200">80mm ESC/POS</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
