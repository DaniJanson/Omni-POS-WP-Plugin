import React, { useState } from 'react';
import { posApi } from '../../services/api';
import { usePosStore } from '../../store/usePosStore';
import { t } from '../../utils/i18n';
import type { PosShift, CashLog } from '../../types';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  RotateCw,
  CheckCircle2,
} from 'lucide-react';

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'in' | 'out';
  onMovementLogged: (shift: PosShift, logs: CashLog[]) => void;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({
  isOpen,
  onClose,
  initialType = 'in',
  onMovementLogged,
}) => {
  const { showNotification, initData } = usePosStore();
  const [type, setType] = useState<'in' | 'out'>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const currency = initData?.store.currency_symbol || '$';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount) || 0;
    if (parsedAmt <= 0) {
      showNotification(t('amount', 'Please enter a valid amount'), 'error');
      return;
    }
    if (!reason.trim()) {
      showNotification(t('notes', 'Please enter a reason or description'), 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const resp = await posApi.addCashMovement(type, parsedAmt, reason);
      if (resp.success && resp.shift) {
        showNotification(
          `${type === 'in' ? t('cash_in', 'Cash In') : t('cash_out', 'Cash Out')} ${currency}${parsedAmt.toFixed(2)} ${t('success', 'recorded successfully')}`,
          'success'
        );
        onMovementLogged(resp.shift, resp.logs);
        onClose();
      }
    } catch (err: any) {
      showNotification(t('error', 'Error') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                type === 'in'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              {type === 'in' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {t('cash_drawer_movement', 'Cash Drawer Movement')}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Movement Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setType('in')}
              className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                type === 'in'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>{t('cash_in', 'Cash In (Deposit)')}</span>
            </button>

            <button
              type="button"
              onClick={() => setType('out')}
              className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                type === 'out'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{t('cash_out', 'Cash Out (Expense)')}</span>
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('amount', 'Amount')} *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('notes', 'Reason / Reference')} *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={type === 'in' ? 'e.g. Added change float from safe' : 'e.g. Paid supplier invoice / Office expenses'}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl active:scale-[0.98] text-white text-xs font-bold shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer ${
                type === 'in'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
              }`}
            >
              {isSubmitting ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isSubmitting ? t('processing', 'Logging...') : type === 'in' ? t('record_cash_in', 'Record Cash In') : t('record_cash_out', 'Record Cash Out')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
