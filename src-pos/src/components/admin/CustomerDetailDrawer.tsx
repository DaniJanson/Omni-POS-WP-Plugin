import React, { useState, useEffect } from 'react';
import { posApi } from '../../services/api';
import { usePosStore } from '../../store/usePosStore';
import { t } from '../../utils/i18n';
import type { AdminCustomerDetail } from '../../types';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  RotateCw,
  Calendar,
  CreditCard,
} from 'lucide-react';

interface CustomerDetailDrawerProps {
  customerId: number | null;
  onClose: () => void;
}

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  customerId,
  onClose,
}) => {
  const { initData, showNotification } = usePosStore();
  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    setIsLoading(true);

    posApi.getAdminCustomerDetail(customerId)
      .then((resp) => {
        if (resp.success) {
          setCustomer(resp.customer);
        }
      })
      .catch((err) => {
        showNotification(t('sync_error', 'Failed to load customer details') + ': ' + (err.message || 'Error'), 'error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [customerId, showNotification]);

  if (!customerId) return null;

  const currency = initData?.store.currency_symbol || '$';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden animate-slideInRight">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base">
              {customer?.name.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {customer?.name || t('customer_details', 'Customer Details')}
              </h3>
              <span className="text-xs text-slate-400">{t('customer', 'Customer')} ID #{customerId}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <RotateCw className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : customer ? (
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* KPI Lifetime Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block mb-1">
                  {t('total_spent', 'Lifetime Value (LTV)')}
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {currency}{customer.total_spent.toFixed(2)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mb-1">
                  {t('orders_placed', 'Total Orders')}
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {customer.orders_count}
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {customer.phone || '—'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{customer.email || '—'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>
                  {customer.city ? `${customer.city}, ` : ''}{customer.address || '—'}
                </span>
              </div>
            </div>

            {/* Recent Orders History */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-500" />
                <span>{t('recent_transactions', 'Recent Purchases')} ({customer.orders?.length || 0})</span>
              </h4>

              <div className="space-y-2.5">
                {(customer.orders || []).map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {t('orders', 'Order')} #{order.order_number}
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {order.date} • {order.items_count} {t('items', 'items')}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-slate-900 dark:text-white">
                        {currency}{order.total.toFixed(2)}
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}

                {(!customer.orders || customer.orders.length === 0) && (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    {t('no_orders', 'No orders recorded for this customer.')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
