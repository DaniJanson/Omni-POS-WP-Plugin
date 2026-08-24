import React, { useState, useEffect, useCallback } from 'react';
import { posApi } from '../../services/api';
import { usePosStore } from '../../store/usePosStore';
import { t } from '../../utils/i18n';
import type { CashierStaff } from '../../types';
import {
  UserCheck,
  Plus,
  RotateCw,
  Key,
  Shield,
  Percent,
  CheckCircle2,
  X,
  Save,
  Lock,
  Trash2,
} from 'lucide-react';

export const AdminCashiersView: React.FC = () => {
  const { showNotification } = usePosStore();

  const [cashiers, setCashiers] = useState<CashierStaff[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCashier, setEditingCashier] = useState<CashierStaff | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    pin: '',
    max_discount: 100,
    can_refund: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-selection state
  const [selectedCashierIds, setSelectedCashierIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const toggleSelectCashier = (id: number) => {
    setSelectedCashierIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllCashiers = () => {
    if (selectedCashierIds.length === cashiers.length) {
      setSelectedCashierIds([]);
    } else {
      setSelectedCashierIds(cashiers.map((c) => c.id));
    }
  };

  const handleBulkDeleteCashiers = async () => {
    if (selectedCashierIds.length === 0) return;
    if (!window.confirm(`${t('confirm_bulk_delete', 'Are you sure you want to delete the selected items?')} (${selectedCashierIds.length})`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const resp = await posApi.bulkDelete('cashiers', selectedCashierIds);
      if (resp.success) {
        showNotification(t('items_deleted_success', 'Selected items deleted successfully!'), 'success');
        setSelectedCashierIds([]);
        fetchCashiers();
      }
    } catch (err: any) {
      showNotification(t('error', 'Failed to delete items') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const fetchCashiers = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await posApi.getAdminCashiers();
      if (resp.success) {
        setCashiers(resp.cashiers);
        setSelectedCashierIds([]);
      }
    } catch (err: any) {
      console.error('Fetch Cashiers Error:', err);
      showNotification(t('sync_error', 'Failed to load cashiers') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchCashiers();
  }, [fetchCashiers]);

  const handleOpenAdd = () => {
    setEditingCashier(null);
    setFormData({
      username: '',
      name: '',
      email: '',
      pin: '',
      max_discount: 100,
      can_refund: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cashier: CashierStaff) => {
    setEditingCashier(cashier);
    setFormData({
      username: cashier.username,
      name: cashier.name,
      email: cashier.email,
      pin: '',
      max_discount: cashier.max_discount,
      can_refund: cashier.can_refund,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingCashier) {
        const resp = await posApi.updateAdminCashier(editingCashier.id, {
          name: formData.name,
          pin: formData.pin || undefined,
          max_discount: formData.max_discount,
          can_refund: formData.can_refund,
        });
        if (resp.success) {
          setCashiers(resp.cashiers);
          showNotification(t('cashier_saved', 'Cashier updated successfully'), 'success');
          setIsModalOpen(false);
        }
      } else {
        const resp = await posApi.createAdminCashier({
          username: formData.username,
          name: formData.name,
          email: formData.email,
          pin: formData.pin,
          max_discount: formData.max_discount,
          can_refund: formData.can_refund,
        });
        if (resp.success) {
          setCashiers(resp.cashiers);
          showNotification(t('cashier_saved', 'Cashier created successfully'), 'success');
          setIsModalOpen(false);
        }
      }
    } catch (err: any) {
      showNotification(t('error', 'Error saving cashier') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>👥 {t('cashiers_staff', 'Cashiers & Staff Permissions')}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-500/20">
              {cashiers.length} {t('cashier', 'Users')}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('settings_desc', 'Manage cashiers, 4-digit switch PIN codes, maximum discount limits and refund permissions.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchCashiers()}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            title={t('sync_catalogue', 'Refresh List')}
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add_cashier', 'Add Cashier')}</span>
          </button>
        </div>
      </div>

      {/* Cashiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cashiers.map((cashier) => {
          const isSelected = selectedCashierIds.includes(cashier.id);
          return (
          <div
            key={cashier.id}
            className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4 transition-all ${
              isSelected
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelectCashier(cashier.id)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                  {cashier.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                    {cashier.name}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">@{cashier.username}</span>
                </div>
              </div>

              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  cashier.is_admin
                    ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20'
                    : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                }`}
              >
                {cashier.is_admin ? t('admin_panel', 'Admin') : t('cashier', 'Cashier')}
              </span>
            </div>

            {/* Permissions summary */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-slate-400" /> {t('cashier_pin', 'Security PIN')}:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {cashier.has_pin ? '•••• (PIN set)' : t('cancel', 'Not set')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><Percent className="w-3 h-3 text-slate-400" /> {t('max_discount_allowed', 'Max Discount')}:</span>
                <strong className="text-slate-900 dark:text-white">{cashier.max_discount}%</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-slate-400" /> {t('can_refund_orders', 'Can Void/Refund')}:</span>
                <span className={`font-bold ${cashier.can_refund ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {cashier.can_refund ? t('completed_sales', 'Allowed') : t('cancel', 'Disabled')}
                </span>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={() => handleOpenEdit(cashier)}
              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              {t('edit_cashier', 'Edit Permissions & PIN')}
            </button>
          </div>
        )})}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedCashierIds.length > 0 && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between p-3.5 px-5 bg-slate-900/95 dark:bg-slate-800/95 text-white rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 animate-slideUp">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold font-mono">
              {selectedCashierIds.length} {t('selected_count', 'Selected')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedCashierIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteCashiers}
              disabled={isBulkDeleting}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isBulkDeleting ? t('processing', 'Deleting...') : t('delete_selected', 'Delete Selected')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingCashier ? t('edit_cashier', 'Edit Cashier Permissions') : t('add_cashier', 'Add New Cashier')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingCashier && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('username', 'Username')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. cashier_nika"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('customer_name', 'Full Name / Display Name')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Nika Beridze"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('cashier_pin', '4-Digit Quick Switch PIN')}
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder={editingCashier?.has_pin ? '••••' : '1234'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('max_discount_allowed', 'Max Allowed Discount (%)')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: parseFloat(e.target.value) || 0 })}
                    className="w-24 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.can_refund}
                    onChange={(e) => setFormData({ ...formData, can_refund: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {t('can_refund_orders', 'Allow cashier to void items and process order refunds')}
                  </span>
                </label>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingCashier ? t('save_changes', 'Save Changes') : t('save', 'Create Cashier')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
