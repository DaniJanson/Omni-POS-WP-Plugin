import React, { useState, useEffect, useCallback } from 'react';
import { posApi } from '../../services/api';
import { usePosStore } from '../../store/usePosStore';
import { t } from '../../utils/i18n';
import type { AdminReportData } from '../../types';
import {
  BarChart3,
  TrendingUp,
  RotateCw,
  Calendar,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Banknote,
  Package,
  Layers,
  UserCheck,
  Printer,
  ChevronDown,
} from 'lucide-react';

export const AdminReportsView: React.FC = () => {
  const { initData, showNotification } = usePosStore();

  const [range, setRange] = useState<'today' | 'yesterday' | '7days' | '30days' | 'month' | 'custom'>('7days');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [reportData, setReportData] = useState<AdminReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await posApi.getAdminReports({
        range,
        date_from: range === 'custom' ? customFrom : undefined,
        date_to: range === 'custom' ? customTo : undefined,
      });

      if (resp.success) {
        setReportData(resp.reports);
      }
    } catch (err: any) {
      console.error('Fetch Reports Error:', err);
      showNotification(t('sync_error', 'Failed to load reports') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [range, customFrom, customTo, showNotification]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const currency = reportData?.currency_symbol || initData?.store.currency_symbol || '$';

  // SVG Chart Calculations
  const timeline = reportData?.timeline || [];
  const maxSales = Math.max(...timeline.map((tItem) => tItem.sales), 100);
  const chartHeight = 160;
  const chartWidth = 700;

  const points = timeline.map((tItem, idx) => {
    const x = timeline.length > 1 ? (idx / (timeline.length - 1)) * (chartWidth - 40) + 20 : chartWidth / 2;
    const y = chartHeight - (tItem.sales / maxSales) * (chartHeight - 40) - 20;
    return { x, y, ...tItem };
  });

  const pathD = points.length > 1
    ? points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`), '')
    : '';

  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x},${chartHeight} L ${points[0].x},${chartHeight} Z`
    : '';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>📊 {t('sales_reports', 'Sales Analytics & Reports')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('reports_desc', 'Real-time financial performance, product sales rankings, cashier breakdown and sales curves.')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Range Pills */}
          <div className="flex p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
            {(['today', 'yesterday', '7days', '30days', 'month'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] capitalize transition-all cursor-pointer ${
                  range === r
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r === 'today'
                  ? t('today', 'Today')
                  : r === 'yesterday'
                  ? t('yesterday', 'Yesterday')
                  : r === '7days'
                  ? t('last_7_days', '7 Days')
                  : r === '30days'
                  ? t('last_30_days', '30 Days')
                  : t('this_month', 'This Month')}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            title={t('print_barcode', 'Print Report')}
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={() => fetchReports()}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            title={t('sync_catalogue', 'Refresh Data')}
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{t('total_sales', 'Gross Sales')}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currency}{reportData?.gross_sales?.toFixed(2) || '0.00'}
          </div>
          <span className="text-[11px] text-slate-400 block">
            Net: {currency}{reportData?.net_sales?.toFixed(2) || '0.00'} • {t('tax', 'Tax')}: {currency}{reportData?.tax_total?.toFixed(2) || '0.00'}
          </span>
        </div>

        {/* Orders Count */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{t('total_receipts', 'Total Orders')}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {reportData?.orders_count || 0}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
            {t('completed_sales', 'Completed transactions')}
          </span>
        </div>

        {/* Avg Order Value (AOV) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{t('avg_order_value', 'Avg Order Value')}</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currency}{reportData?.avg_order_value?.toFixed(2) || '0.00'}
          </div>
          <span className="text-[11px] text-slate-400 block">{t('avg_order_value', 'Average basket total')}</span>
        </div>

        {/* Cash vs Card Split */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{t('payment_method', 'Payment Methods')}</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <Banknote className="w-3.5 h-3.5" /> {currency}{reportData?.cash_sales?.toFixed(2) || '0.00'}
            </span>
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
              <CreditCard className="w-3.5 h-3.5" /> {currency}{reportData?.card_sales?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full"
              style={{
                width: `${
                  (reportData?.gross_sales || 0) > 0
                    ? ((reportData?.cash_sales || 0) / (reportData?.gross_sales || 1)) * 100
                    : 50
                }%`,
              }}
            />
            <div
              className="bg-blue-500 h-full"
              style={{
                width: `${
                  (reportData?.gross_sales || 0) > 0
                    ? ((reportData?.card_sales || 0) / (reportData?.gross_sales || 1)) * 100
                    : 50
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* SVG Sales Trend Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>{t('sales_trend_chart', 'Revenue Trend Over Time')}</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t('sales_period', 'Sales performance for selected period')}: {reportData?.date_start} to {reportData?.date_end}
            </p>
          </div>
        </div>

        {timeline.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px] relative">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                {[0.25, 0.5, 0.75, 1].map((lvl, i) => (
                  <line
                    key={i}
                    x1="20"
                    y1={chartHeight * lvl - 10}
                    x2={chartWidth - 20}
                    y2={chartHeight * lvl - 10}
                    stroke="currentColor"
                    className="text-slate-100 dark:text-slate-800"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Area under line */}
                {areaD && <path d={areaD} fill="url(#salesGrad)" />}

                {/* Main line */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {points.map((pt, i) => (
                  <g key={i} className="group cursor-pointer">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      className="fill-white dark:fill-slate-900 stroke-blue-600 stroke-[3] group-hover:scale-150 transition-transform"
                    />
                    <text
                      x={pt.x}
                      y={chartHeight - 2}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-400 font-mono"
                    >
                      {pt.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            {t('no_orders', 'No sales recorded in this time range.')}
          </div>
        )}
      </div>

      {/* Grid: Top Selling Products & Cashier Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-500" />
            <span>{t('top_products', 'Top Best-Selling Products')}</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2.5 font-semibold">#</th>
                  <th className="pb-2.5 font-semibold">{t('item', 'Product')}</th>
                  <th className="pb-2.5 font-semibold text-center">{t('qty', 'Qty Sold')}</th>
                  <th className="pb-2.5 font-semibold text-right">{t('amount', 'Revenue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(reportData?.top_products || []).map((prod, idx) => (
                  <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-black text-slate-400 text-xs">#{idx + 1}</td>
                    <td className="py-2.5 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                      {prod.name}
                    </td>
                    <td className="py-2.5 text-center font-bold text-blue-600 dark:text-blue-400">
                      {prod.quantity}
                    </td>
                    <td className="py-2.5 text-right font-black text-slate-900 dark:text-white">
                      {currency}{prod.sales.toFixed(2)}
                    </td>
                  </tr>
                ))}

                {(!reportData?.top_products || reportData.top_products.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                      {t('no_orders', 'No product sales yet.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cashier Leaderboard & Category Performance */}
        <div className="space-y-6">
          {/* Cashier Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-500" />
              <span>{t('cashiers_staff', 'Cashier Staff Sales Performance')}</span>
            </h3>

            <div className="space-y-3">
              {(reportData?.cashiers || []).map((cashier, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                      {cashier.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">
                        {cashier.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {cashier.orders} {t('orders', 'orders')}
                      </span>
                    </div>
                  </div>

                  <span className="font-black text-xs text-slate-900 dark:text-white">
                    {currency}{cashier.sales.toFixed(2)}
                  </span>
                </div>
              ))}

              {(!reportData?.cashiers || reportData.cashiers.length === 0) && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  {t('no_orders', 'No cashier activity recorded.')}
                </div>
              )}
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>{t('categories', 'Top Categories by Revenue')}</span>
            </h3>

            <div className="space-y-2">
              {(reportData?.top_categories || []).map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>{cat.name} ({cat.count} {t('items', 'items')})</span>
                    <span>{currency}{cat.sales.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{
                        width: `${
                          (reportData?.gross_sales || 0) > 0
                            ? (cat.sales / (reportData?.gross_sales || 1)) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
