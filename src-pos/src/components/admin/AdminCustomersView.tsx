import React, { useState, useEffect, useCallback } from 'react';
import { posApi } from '../../services/api';
import { usePosStore } from '../../store/usePosStore';
import { CustomerEditModal } from './CustomerEditModal';
import { CustomerDetailDrawer } from './CustomerDetailDrawer';
import { t } from '../../utils/i18n';
import type { AdminCustomer } from '../../types';
import {
  Users,
  Search,
  Plus,
  RotateCw,
  Edit2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  DollarSign,
  ShoppingBag,
  Trash2,
} from 'lucide-react';

export const AdminCustomersView: React.FC = () => {
  const { initData, showNotification } = usePosStore();

  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Drawers
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<AdminCustomer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map((c) => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${t('confirm_bulk_delete', 'Are you sure you want to delete the selected items?')} (${selectedIds.length})`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const resp = await posApi.bulkDelete('customers', selectedIds);
      if (resp.success) {
        showNotification(t('items_deleted_success', 'Selected items deleted successfully!'), 'success');
        setSelectedIds([]);
        fetchCustomers();
      }
    } catch (err: any) {
      showNotification(t('error', 'Failed to delete items') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await posApi.getAdminCustomers({
        search,
        page,
        per_page: 15,
      });

      if (resp.success) {
        setCustomers(resp.customers);
        setTotalPages(resp.total_pages || 1);
        setTotalCount(resp.total || 0);
        setSelectedIds([]);
      }
    } catch (err: any) {
      console.error('Fetch Customers Error:', err);
      showNotification(t('sync_error', 'Failed to load customers') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, page, showNotification]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const currency = initData?.store.currency_symbol || '$';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>👥 {t('customers_tab', 'Customers & CRM Directory')}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-500/20">
              {totalCount} {t('all', 'Total')}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('customer_details', 'Manage customer profiles, purchase history, contact records and total spending.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchCustomers()}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            title={t('sync_catalogue', 'Refresh List')}
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setCustomerToEdit(null);
              setIsEditModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add_new_customer', 'Add Customer')}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('search_placeholder', 'Search by customer name, email, or phone...')}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={customers.length > 0 && selectedIds.length === customers.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-semibold">{t('customer', 'Customer')}</th>
                <th className="py-3 px-4 font-semibold">{t('phone_number', 'Contact')}</th>
                <th className="py-3 px-4 font-semibold">{t('address', 'Location')}</th>
                <th className="py-3 px-4 font-semibold text-center">{t('orders_placed', 'Orders')}</th>
                <th className="py-3 px-4 font-semibold">{t('total_spent', 'Total Spent')}</th>
                <th className="py-3 px-4 font-semibold text-right">{t('actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {customers.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                <tr key={c.id} className={`transition-colors ${isSelected ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'}`}>
                  {/* Checkbox */}
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(c.id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  {/* Name & Avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <button
                          onClick={() => setSelectedCustomerId(c.id)}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left block max-w-xs truncate cursor-pointer"
                        >
                          {c.name}
                        </button>
                        <span className="text-[10px] text-slate-400">ID: #{c.id}</span>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {c.phone && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[160px]">{c.email}</span>
                      </div>
                    )}
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                    {c.city ? `${c.city}${c.address ? `, ${c.address}` : ''}` : '—'}
                  </td>

                  {/* Orders */}
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px]">
                      {c.orders_count}
                    </span>
                  </td>

                  {/* Total Spent */}
                  <td className="py-3 px-4 font-black text-slate-900 dark:text-white text-xs">
                    {currency}{c.total_spent.toFixed(2)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setSelectedCustomerId(c.id)}
                        title={t('customer_details', 'View Purchase History')}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setCustomerToEdit(c);
                          setIsEditModalOpen(true);
                        }}
                        title={t('edit', 'Edit Customer')}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );})}

              {customers.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{t('no_orders', 'No customers found')}</p>
                    <p className="text-xs">{t('search_placeholder', 'Try searching for a different name or add a new customer.')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {page} / {totalPages} ({totalCount} {t('customer', 'customers')})
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between p-3.5 px-5 bg-slate-900/95 dark:bg-slate-800/95 text-white rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 animate-slideUp">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold font-mono">
              {selectedIds.length} {t('selected_count', 'Selected')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isBulkDeleting ? t('processing', 'Deleting...') : t('delete_selected', 'Delete Selected')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit / Create Customer Modal */}
      <CustomerEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customerToEdit={customerToEdit}
        onCustomerSaved={() => fetchCustomers()}
      />

      {/* Customer Purchase History Drawer */}
      <CustomerDetailDrawer
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
      />
    </div>
  );
};
