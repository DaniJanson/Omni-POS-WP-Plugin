import React from 'react';
import { usePosStore } from '../../store/usePosStore';
import { t } from '../../utils/i18n';
import type { PosShift } from '../../types';
import {
  CircleDollarSign,
  Clock,
  User,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  Banknote,
} from 'lucide-react';

interface ResumeShiftModalProps {
  isOpen: boolean;
  shift: PosShift | null;
  onContinue: () => void;
  onCloseAndStartNew: () => void;
}

export const ResumeShiftModal: React.FC<ResumeShiftModalProps> = ({
  isOpen,
  shift,
  onContinue,
  onCloseAndStartNew,
}) => {
  const { initData } = usePosStore();

  if (!isOpen || !shift) return null;

  const currency = initData?.store.currency_symbol || '$';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <CircleDollarSign className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {t('active_shift_in_progress', 'Active Register Shift in Progress')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {t('resume_shift_desc', 'A previously opened shift is still active on this register. Would you like to continue using this shift or close it and start a new one?')}
          </p>
        </div>

        {/* Shift Details Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              Shift #{shift.id}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px] border border-emerald-200 dark:border-emerald-500/20">
              ● Open
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-400 block">{t('cashier', 'Cashier')}</span>
                <strong className="text-slate-900 dark:text-white">{shift.cashier_name}</strong>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-400 block">{t('date', 'Opened At')}</span>
                <strong className="text-slate-900 dark:text-white">{shift.opened_at}</strong>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Banknote className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-400 block">{t('opening_cash', 'Opening Float')}</span>
                <strong className="text-slate-900 dark:text-white">{currency}{parseFloat(shift.opening_float as any).toFixed(2)}</strong>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <CircleDollarSign className="w-4 h-4 text-blue-500" />
              <div>
                <span className="text-[10px] text-blue-500 block font-semibold">{t('expected_cash', 'Expected Cash')}</span>
                <strong className="text-blue-600 dark:text-blue-400 font-black">{currency}{parseFloat(shift.expected_cash as any).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Primary Option: Continue */}
          <button
            type="button"
            onClick={onContinue}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('continue_shift', 'Continue Active Shift')}</span>
          </button>

          {/* Secondary Option: Close and Start New */}
          <button
            type="button"
            onClick={onCloseAndStartNew}
            className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-500" />
            <span>{t('close_and_new', 'Close Shift & Start New')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
