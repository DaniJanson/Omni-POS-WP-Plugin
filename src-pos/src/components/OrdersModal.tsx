import React, { useEffect, useState } from 'react';
import { usePosStore } from '../store/usePosStore';
import { posApi } from '../services/api';
import { formatPrice } from '../utils/format';
import { t } from '../utils/i18n';
import type { OrderSummary } from '../types';
import { History, X, RefreshCw } from 'lucide-react';

export const OrdersModal: React.FC = () => {
  const { isOrdersModalOpen, setOrdersModalOpen, initData } = usePosStore();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await posApi.getOrders(1, 20);
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOrdersModalOpen) {
      fetchOrders();
    }
  }, [isOrdersModalOpen]);

  if (!isOrdersModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-[#131b2e] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{t('recent_orders', 'Recent Orders History')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('completed_sales', 'Completed sales transactions')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchOrders}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setOrdersModalOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-500" />
              <span>{t('processing', 'Loading orders...')}</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
              {t('no_products_found', 'No orders recorded yet')}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5">{t('order_number', 'Order #')}</th>
                  <th className="pb-2.5">{t('date', 'Date')}</th>
                  <th className="pb-2.5">{t('customer', 'Customer')}</th>
                  <th className="pb-2.5">{t('cash', 'Payment')}</th>
                  <th className="pb-2.5 text-center">{t('units', 'Items')}</th>
                  <th className="pb-2.5 text-right">{t('amount', 'Total')}</th>
                  <th className="pb-2.5 text-center">{t('status', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-bold font-mono text-blue-600 dark:text-blue-400">
                      #{order.order_number}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400 font-mono">
                      {order.date}
                    </td>
                    <td className="py-3 text-slate-800 dark:text-slate-200 font-medium">
                      {order.customer_name}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {order.payment_method || 'POS'}
                    </td>
                    <td className="py-3 text-center text-slate-500 dark:text-slate-400">
                      {order.items_count}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                      {formatPrice(order.total, initData?.store)}
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
