import React, { useState, useEffect, useCallback } from 'react';
import { posApi } from '../../services/api';
import { usePosStore } from '../../store/usePosStore';
import { OpenShiftModal } from '../shifts/OpenShiftModal';
import { CloseShiftModal } from '../shifts/CloseShiftModal';
import { CashMovementModal } from '../shifts/CashMovementModal';
import { t } from '../../utils/i18n';
import type { PosShift, CashLog } from '../../types';
import {
  CircleDollarSign,
  PlusCircle,
  MinusCircle,
  FileSpreadsheet,
  RotateCw,
  Clock,
  Banknote,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Trash2,
} from 'lucide-react';

export const AdminShiftsView: React.FC = () => {
  const { initData, showNotification } = usePosStore();

  const [currentShift, setCurrentShift] = useState<PosShift | null>(null);
  const [shiftLogs, setShiftLogs] = useState<CashLog[]>([]);
  const [historyShifts, setHistoryShifts] = useState<PosShift[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Pagination for history
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out'>('in');

  // Multi-selection state
  const [selectedShiftIds, setSelectedShiftIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const toggleSelectShift = (id: number) => {
    setSelectedShiftIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllShifts = () => {
    if (selectedShiftIds.length === historyShifts.length) {
      setSelectedShiftIds([]);
    } else {
      setSelectedShiftIds(historyShifts.map((s) => s.id));
    }
  };

  const handleBulkDeleteShifts = async () => {
    if (selectedShiftIds.length === 0) return;
    if (!window.confirm(`${t('confirm_bulk_delete', 'Are you sure you want to delete the selected items?')} (${selectedShiftIds.length})`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const resp = await posApi.bulkDelete('shifts', selectedShiftIds);
      if (resp.success) {
        showNotification(t('items_deleted_success', 'Selected items deleted successfully!'), 'success');
        setSelectedShiftIds([]);
        fetchShiftData();
      }
    } catch (err: any) {
      showNotification(t('error', 'Failed to delete items') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const fetchShiftData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Current Active Shift
      const currResp = await posApi.getCurrentShift();
      if (currResp.success) {
        setCurrentShift(currResp.shift);
        setShiftLogs(currResp.logs || []);
      }

      // 2. History Shifts
      const histResp = await posApi.getShiftHistory(page, 10);
      if (histResp.success) {
        setHistoryShifts(histResp.shifts);
        setTotalPages(histResp.total_pages || 1);
        setTotalCount(histResp.total || 0);
        setSelectedShiftIds([]);
      }
    } catch (err: any) {
      console.error('Fetch Shift Data Error:', err);
      showNotification(t('sync_error', 'Failed to load shift records') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, showNotification]);

  useEffect(() => {
    fetchShiftData();
  }, [fetchShiftData]);

  const currency = initData?.store.currency_symbol || '$';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>💵 {t('shifts_register', 'Cash Register & Shifts Management')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('shift_control', 'Track opening floats, cash in/out movements, cashier drawer reconciliation and Z-Reports.')}
          </p>
        </div>

        <button
          onClick={() => fetchShiftData()}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 self-start sm:self-auto cursor-pointer"
          title={t('sync_catalogue', 'Refresh Shifts')}
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Active Shift Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
              currentShift
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20'
                : 'bg-slate-400 dark:bg-slate-700'
            }`}>
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {currentShift ? `${t('active_shift', 'Current Register Shift')} #${currentShift.id}` : t('no_shift_open', 'No Active Shift Open')}
                </h2>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    currentShift
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {currentShift ? `● ${t('open_shift', 'Active')}` : t('close_shift', 'Closed')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentShift
                  ? `${t('cashier', 'Cashier')}: ${currentShift.cashier_name} • ${t('date_received', 'Opened at')} ${currentShift.opened_at}`
                  : t('start_shift_prompt', 'Start a shift with opening cash float to begin register tracking.')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {!currentShift ? (
              <button
                onClick={() => setIsOpenShiftModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('open_shift', 'Open New Shift')}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMovementType('in');
                    setIsMovementModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>{t('cash_in', 'Cash In')}</span>
                </button>

                <button
                  onClick={() => {
                    setMovementType('out');
                    setIsMovementModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{t('cash_out', 'Cash Out')}</span>
                </button>

                <button
                  onClick={() => setIsCloseShiftModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{t('close_shift_z_report', 'Close Shift & Z-Report')}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Shift Drawer Financial Balance Grid */}
        {currentShift && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{t('opening_float', 'Opening Float')}</span>
              <div className="text-base font-black text-slate-900 dark:text-white">
                {currency}{Number(currentShift.opening_float || 0).toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block mb-1">{t('cash_sales', 'Cash Sales')}</span>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                +{currency}{Number(currentShift.cash_sales || 0).toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
              <span className="text-[11px] text-blue-700 dark:text-blue-400 block mb-1">{t('card_sales', 'Card Sales')}</span>
              <div className="text-base font-black text-blue-600 dark:text-blue-400">
                {currency}{Number(currentShift.card_sales || 0).toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mb-1">{t('cash_in', 'Cash In')}</span>
              <div className="text-base font-black text-slate-900 dark:text-white">
                +{currency}{Number(currentShift.cash_in || 0).toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] text-amber-600 dark:text-amber-400 block mb-1">{t('cash_out', 'Cash Out')}</span>
              <div className="text-base font-black text-slate-900 dark:text-white">
                -{currency}{Number(currentShift.cash_out || 0).toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
              <span className="text-[11px] text-blue-100 block mb-1 font-semibold">{t('expected_cash', 'Expected Cash')}</span>
              <div className="text-base font-black">
                {currency}{Number(currentShift.expected_cash || 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cash In / Out Log Table */}
      {currentShift && shiftLogs.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span>{t('cash_movements', 'Cash Movements in Active Shift')}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
              {shiftLogs.length}
            </span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2.5 font-semibold">{t('date_received', 'Time')}</th>
                  <th className="pb-2.5 font-semibold">{t('payment_method', 'Type')}</th>
                  <th className="pb-2.5 font-semibold">{t('amount', 'Amount')}</th>
                  <th className="pb-2.5 font-semibold">{t('order_note', 'Reason')}</th>
                  <th className="pb-2.5 font-semibold text-right">{t('cashier', 'Cashier')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {shiftLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{log.created_at}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        log.type === 'in'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {log.type === 'in' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {log.type === 'in' ? t('cash_in', 'Cash In') : t('cash_out', 'Cash Out')}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                      {log.type === 'in' ? '+' : '-'}{currency}{parseFloat(log.amount as any).toFixed(2)}
                    </td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300">{log.reason}</td>
                    <td className="py-2.5 text-right font-medium text-slate-600 dark:text-slate-400">{log.cashier_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shifts History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-blue-500" />
            <span>{t('shifts_history', 'Shift History & Z-Reports Archive')}</span>
          </h2>
          <span className="text-xs text-slate-400">{totalCount} {t('shifts_register', 'shifts')}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={historyShifts.length > 0 && selectedShiftIds.length === historyShifts.length}
                    onChange={toggleSelectAllShifts}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-semibold">{t('shift_control', 'Shift #')}</th>
                <th className="py-3 px-4 font-semibold">{t('cashier', 'Cashier')}</th>
                <th className="py-3 px-4 font-semibold">{t('date_received', 'Opened - Closed')}</th>
                <th className="py-3 px-4 font-semibold">{t('opening_float', 'Opening Float')}</th>
                <th className="py-3 px-4 font-semibold">{t('cash_sales', 'Cash Sales')}</th>
                <th className="py-3 px-4 font-semibold">{t('card_sales', 'Card Sales')}</th>
                <th className="py-3 px-4 font-semibold">{t('cash_discrepancy', 'Discrepancy (Over/Short)')}</th>
                <th className="py-3 px-4 font-semibold text-right">{t('status', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {historyShifts.map((shift) => {
                const isSelected = selectedShiftIds.includes(shift.id);
                return (
                <tr key={shift.id} className={`transition-colors ${isSelected ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'}`}>
                  {/* Checkbox */}
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectShift(shift.id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">#{shift.id}</td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{shift.cashier_name}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                    <div>{shift.opened_at}</div>
                    <div>{shift.closed_at || t('in_progress', 'In progress...')}</div>
                  </td>
                  <td className="py-3 px-4">{currency}{parseFloat(shift.opening_float as any).toFixed(2)}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                    +{currency}{parseFloat(shift.cash_sales as any).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                    {currency}{parseFloat(shift.card_sales as any).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    {shift.status === 'closed' ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        shift.difference === 0
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : shift.difference > 0
                          ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                          : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                      }`}>
                        {Number(shift.difference || 0) > 0 ? `+${currency}${Number(shift.difference || 0).toFixed(2)}` : `${currency}${Number(shift.difference || 0).toFixed(2)}`}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      shift.status === 'open'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {shift.status}
                    </span>
                  </td>
                </tr>
              );})}

              {historyShifts.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {t('no_orders', 'No historical shifts recorded yet.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{page} / {totalPages}</span>
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
      {selectedShiftIds.length > 0 && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between p-3.5 px-5 bg-slate-900/95 dark:bg-slate-800/95 text-white rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 animate-slideUp">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold font-mono">
              {selectedShiftIds.length} {t('selected_count', 'Selected')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedShiftIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteShifts}
              disabled={isBulkDeleting}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isBulkDeleting ? t('processing', 'Deleting...') : t('delete_selected', 'Delete Selected')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        onShiftOpened={(shift) => {
          setCurrentShift(shift);
          fetchShiftData();
        }}
      />

      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        shift={currentShift}
        onShiftClosed={() => {
          fetchShiftData();
        }}
      />

      <CashMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        initialType={movementType}
        onMovementLogged={(shift, logs) => {
          setCurrentShift(shift);
          setShiftLogs(logs);
        }}
      />
    </div>
  );
};
