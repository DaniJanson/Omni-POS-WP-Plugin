import React, { useState } from 'react';
import { posApi } from '../../services/api';
import { usePosStore } from '../../store/usePosStore';
import { t } from '../../utils/i18n';
import type { PosShift } from '../../types';
import { X, CircleDollarSign, RotateCw, Check } from 'lucide-react';

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftOpened: (shift: PosShift) => void;
}

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({
  isOpen,
  onClose,
  onShiftOpened,
}) => {
  const { showNotification, initData } = usePosStore();
  const [openingFloat, setOpeningFloat] = useState<string>('100.00');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const quickAmounts = [50, 100, 150, 200, 300];
  const currency = initData?.store.currency_symbol || '$';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const floatAmount = parseFloat(openingFloat) || 0;
    setIsSubmitting(true);

    try {
      const resp = await posApi.openShift(floatAmount, notes);
      if (resp.success && resp.shift) {
        showNotification(`${t('open_shift', 'Shift opened')} with ${currency}${floatAmount.toFixed(2)} ${t('opening_cash', 'opening float')}`, 'success');
        onShiftOpened(resp.shift);
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
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CircleDollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {t('open_shift_modal_title', 'Open Register Shift')}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('opening_float_desc', 'Opening Cash Float (Initial drawer cash)')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick Amount Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setOpeningFloat(amt.toFixed(2))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  parseFloat(openingFloat) === amt
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                {currency}{amt}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('notes', 'Opening Notes (Optional)')}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Morning shift, 20x 5₾ notes"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{isSubmitting ? t('processing', 'Opening Shift...') : t('open_shift_btn', 'Confirm & Open Shift')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
