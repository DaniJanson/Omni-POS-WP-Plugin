import React, { useState, useEffect } from 'react';
import { posApi } from '../../services/api';
import { usePosStore } from '../../store/usePosStore';
import { t } from '../../utils/i18n';
import type { PosShift } from '../../types';
import {
  X,
  FileSpreadsheet,
  RotateCw,
  Printer,
  CheckCircle2,
  AlertCircle,
  Banknote,
  CreditCard,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: PosShift | null;
  onShiftClosed: (closedShift: PosShift) => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  isOpen,
  onClose,
  shift,
  onShiftClosed,
}) => {
  const { showNotification, initData } = usePosStore();
  const [countedCash, setCountedCash] = useState<string>('0.00');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [closedShiftResult, setClosedShiftResult] = useState<PosShift | null>(null);

  useEffect(() => {
    if (shift) {
      const exp = Number(shift.expected_cash ?? 0);
      setCountedCash(isNaN(exp) ? '0.00' : exp.toFixed(2));
      setClosedShiftResult(null);
      setNotes('');
    }
  }, [shift, isOpen]);

  if (!isOpen || !shift) return null;

  const currency = initData?.store.currency_symbol || '$';
  const parsedCounted = parseFloat(countedCash) || 0;
  const openingFloat = Number(shift.opening_float ?? 0);
  const cashSales = Number(shift.cash_sales ?? 0);
  const cardSales = Number(shift.card_sales ?? 0);
  const cashIn = Number(shift.cash_in ?? 0);
  const cashOut = Number(shift.cash_out ?? 0);
  const expectedCash = Number(shift.expected_cash ?? (openingFloat + cashSales + cashIn - cashOut));
  const difference = Math.round((parsedCounted - expectedCash) * 100) / 100;

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const resp = await posApi.closeShift(parsedCounted, notes, shift.id);
      if (resp.success && resp.shift) {
        showNotification(t('z_report', 'Register shift closed successfully. Z-Report generated!'), 'success');
        setClosedShiftResult(resp.shift);
        onShiftClosed(resp.shift);
      }
    } catch (err: any) {
      showNotification(t('error', 'Failed to close shift') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintZReport = () => {
    window.print();
  };

  const handleLogout = () => {
    if (window.omniPosConfig?.logoutUrl) {
      window.location.href = window.omniPosConfig.logoutUrl;
    } else {
      window.location.href = '/wp-login.php';
    }
  };

  const handleModalClose = () => {
    if (closedShiftResult) {
      // Shift is closed -> automatically logout
      handleLogout();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {closedShiftResult ? t('z_report', 'Z-Report Summary') : t('close_shift_modal_title', 'Close Register Shift')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Shift #{shift.id} • Opened {shift.opened_at || ''}
              </p>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Shift Financial Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span>{t('opening_cash', 'Opening Cash Float')}:</span>
              <strong className="text-slate-900 dark:text-white">{currency}{openingFloat.toFixed(2)}</strong>
            </div>

            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5" /> {t('cash', 'Cash Sales')} ({shift.orders_count || 0}):</span>
              <strong>+{currency}{cashSales.toFixed(2)}</strong>
            </div>

            <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
              <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> {t('card', 'Card Sales (Terminal)')}:</span>
              <strong>{currency}{cardSales.toFixed(2)}</strong>
            </div>

            {cashIn > 0 && (
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1"><PlusCircle className="w-3.5 h-3.5" /> {t('cash_in', 'Cash In (Deposits)')}:</span>
                <strong>+{currency}{cashIn.toFixed(2)}</strong>
              </div>
            )}

            {cashOut > 0 && (
              <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                <span className="flex items-center gap-1"><MinusCircle className="w-3.5 h-3.5" /> {t('cash_out', 'Cash Out (Payouts)')}:</span>
                <strong>-{currency}{cashOut.toFixed(2)}</strong>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
              <span>{t('expected_in_drawer', 'Expected Cash in Drawer')}:</span>
              <span className="text-blue-600 dark:text-blue-400 text-base">{currency}{expectedCash.toFixed(2)}</span>
            </div>
          </div>

          {!closedShiftResult ? (
            <form onSubmit={handleCloseShift} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('counted_cash_in_drawer', 'Actual Counted Cash in Drawer *')}
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
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Real-time Over / Short Indicator */}
              <div
                className={`p-3 rounded-xl flex items-center justify-between text-xs font-bold border ${
                  difference === 0
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : difference > 0
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                    : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {difference === 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {difference === 0 ? t('exact_match', 'Exact Match (No Discrepancy)') : difference > 0 ? t('cash_over', 'Cash Over') : t('cash_short', 'Cash Short')}
                </span>
                <span>
                  {difference > 0 ? `+${currency}${difference.toFixed(2)}` : `${currency}${difference.toFixed(2)}`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('closing_notes', 'Closing Notes / Discrepancy Explanation')}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Discrepancy checked with manager"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                <span>{isSubmitting ? t('processing', 'Closing Shift...') : t('close_shift_btn', 'Close Shift & Finalize')}</span>
              </button>
            </form>
          ) : (
            /* Z-Report Print Preview & Logout */
            <div className="space-y-4 text-center">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                ✅ Shift #{closedShiftResult.id} {t('shift_closed_logout_notice', 'Shift closed successfully. Print your Z-Report and log out.')}
              </div>

              <div id="omni-z-report-print-area" className="p-4 bg-white text-black rounded-xl border border-slate-300 text-left font-mono text-xs space-y-1">
                <div className="text-center font-bold text-sm pb-1 border-b border-dashed border-black">
                  *** Z-REPORT (SHIFT CLOSE) ***
                </div>
                <div>Store: {initData?.store.name || 'Omni POS'}</div>
                <div>Cashier: {closedShiftResult.cashier_name}</div>
                <div>Opened: {closedShiftResult.opened_at}</div>
                <div>Closed: {closedShiftResult.closed_at}</div>
                <div className="py-1 border-b border-dashed border-black"></div>
                <div>{t('opening_cash', 'Opening Float')}: {currency}{Number(closedShiftResult.opening_float || 0).toFixed(2)}</div>
                <div>{t('cash', 'Cash Sales')}: {currency}{Number(closedShiftResult.cash_sales || 0).toFixed(2)}</div>
                <div>{t('card', 'Card Sales')}: {currency}{Number(closedShiftResult.card_sales || 0).toFixed(2)}</div>
                <div>{t('cash_in', 'Cash In')}: {currency}{Number(closedShiftResult.cash_in || 0).toFixed(2)}</div>
                <div>{t('cash_out', 'Cash Out')}: {currency}{Number(closedShiftResult.cash_out || 0).toFixed(2)}</div>
                <div>{t('expected_cash', 'Expected Cash')}: {currency}{Number(closedShiftResult.expected_cash || 0).toFixed(2)}</div>
                <div>{t('closing_cash', 'Counted Cash')}: {currency}{Number(closedShiftResult.counted_cash || 0).toFixed(2)}</div>
                <div className="font-bold">{t('cash_difference', 'Difference')}: {currency}{Number(closedShiftResult.difference || 0).toFixed(2)}</div>
                <div className="text-center font-bold pt-2 border-t border-dashed border-black">
                  {t('total_orders', 'Total Orders')}: {closedShiftResult.orders_count || 0}
                </div>
              </div>

              {/* Action Buttons: Print & Logout */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrintZReport}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t('print_z_report', 'Print Z-Report (80mm)')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <span>🚪</span>
                  <span>{t('finish_and_logout', 'Finish & Logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
