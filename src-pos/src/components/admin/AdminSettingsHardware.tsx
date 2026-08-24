import React, { useState, useEffect, useCallback } from 'react';
import { qzClient, type QzStatus } from '../../services/qzClient';
import { EscPosBuilder } from '../../services/escpos';
import { usePosStore } from '../../store/usePosStore';
import { QzTraySetupModal } from '../hardware/QzTraySetupModal';
import { t } from '../../utils/i18n';
import type { AdminSettings } from '../../types';
import {
  Printer,
  Zap,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Scissors,
  DollarSign,
  Play,
  FileSpreadsheet,
} from 'lucide-react';

interface AdminSettingsHardwareProps {
  formData: AdminSettings;
  setFormData: React.Dispatch<React.SetStateAction<AdminSettings>>;
}

export const AdminSettingsHardware: React.FC<AdminSettingsHardwareProps> = ({
  formData,
  setFormData,
}) => {
  const { initData, showNotification } = usePosStore();
  const [status, setStatus] = useState<QzStatus>(qzClient.getStatus());
  const [printers, setPrinters] = useState<string[]>([]);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isTestingPrint, setIsTestingPrint] = useState(false);
  const [isTestingDrawer, setIsTestingDrawer] = useState(false);

  const fetchPrinters = useCallback(async () => {
    setIsLoadingPrinters(true);
    try {
      const list = await qzClient.getPrinters();
      setPrinters(list);
      if (list.length > 0 && !formData.receipt_printer) {
        setFormData((prev) => ({ ...prev, receipt_printer: list[0] }));
      }
    } catch (e) {
      console.warn('Could not fetch printers:', e);
    } finally {
      setIsLoadingPrinters(false);
    }
  }, [formData.receipt_printer, setFormData]);

  useEffect(() => {
    const unsub = qzClient.onStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'connected') {
        fetchPrinters();
      }
    });

    if (qzClient.isConnected()) {
      fetchPrinters();
    }

    return () => unsub();
  }, [fetchPrinters]);

  const handleTestPrint = async () => {
    if (!formData.receipt_printer) {
      showNotification(t('select_printer', 'Please select a receipt printer first!'), 'error');
      return;
    }

    setIsTestingPrint(true);
    try {
      const rawEscPos = EscPosBuilder.buildTestReceipt(initData?.store);
      await qzClient.printRaw(formData.receipt_printer, rawEscPos);
      showNotification(t('test_print_sent', 'Test receipt sent to printer!'), 'success');
    } catch (err: any) {
      showNotification('Print error: ' + (err.message || 'Failed'), 'error');
      if (!qzClient.isConnected()) {
        setIsSetupModalOpen(true);
      }
    } finally {
      setIsTestingPrint(false);
    }
  };

  const handleTestDrawer = async () => {
    if (!formData.receipt_printer) {
      showNotification(t('select_printer', 'Please select a printer connected to the cash drawer!'), 'error');
      return;
    }

    setIsTestingDrawer(true);
    try {
      await qzClient.openCashDrawer(formData.receipt_printer);
      showNotification(t('test_drawer_sent', 'Pulse signal sent to cash drawer!'), 'success');
    } catch (err: any) {
      showNotification('Drawer kick error: ' + (err.message || 'Failed'), 'error');
      if (!qzClient.isConnected()) {
        setIsSetupModalOpen(true);
      }
    } finally {
      setIsTestingDrawer(false);
    }
  };

  const isConnected = status === 'connected';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{t('hardware_settings', 'Hardware & Printers (QZ Tray)')}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isConnected
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {isConnected ? t('qz_connected', 'Active') : t('qz_disconnected', 'Offline')}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('qz_setup_desc', 'Configure silent thermal printing, auto paper cut and cash drawer pulse.')}
            </p>
          </div>
        </div>

        {/* QZ Tray Setup / Connect Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (isConnected) {
                fetchPrinters();
              } else {
                setIsSetupModalOpen(true);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoadingPrinters ? 'animate-spin' : ''}`} />
            <span>{isConnected ? t('sync_catalogue', 'Refresh Printers') : t('reconnect_qz', 'Connect')}</span>
          </button>

          {!isConnected && (
            <button
              type="button"
              onClick={() => setIsSetupModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{t('qz_install_launch_btn', '🚀 Setup QZ Tray')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Disconnected Notice */}
      {!isConnected && (
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start justify-between gap-4 text-xs text-amber-900 dark:text-amber-300">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">{t('qz_not_running', 'QZ Tray is not running')}</strong>
              <p className="text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                {t('qz_running_guide', 'Start QZ Tray on this machine to enable instant silent receipt printing and cash drawer opening.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSetupModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs whitespace-nowrap shadow-sm cursor-pointer"
          >
            {t('qz_install_launch_btn', 'Setup QZ Tray')}
          </button>
        </div>
      )}

      {/* Printer Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Receipt Printer Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('receipt_printer', 'Thermal Receipt Printer (80mm / 58mm)')}
          </label>
          <div className="relative">
            <select
              value={formData.receipt_printer || ''}
              onChange={(e) => setFormData({ ...formData, receipt_printer: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">{t('select_printer', 'Select Receipt Printer...')}</option>
              {printers.map((p) => (
                <option key={p} value={p}>
                  🖨️ {p}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-400">
            {printers.length > 0
              ? `${printers.length} printer(s) discovered via QZ Tray.`
              : 'No printers detected. Ensure QZ Tray is active.'}
          </p>
        </div>

        {/* Label/Sticker Printer Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('label_printer', 'Barcode Sticker / Label Printer (Zebra / Xprinter)')}
          </label>
          <div className="relative">
            <select
              value={formData.label_printer || ''}
              onChange={(e) => setFormData({ ...formData, label_printer: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">{t('select_printer', 'Select Label Printer (Optional)...')}</option>
              {printers.map((p) => (
                <option key={p} value={p}>
                  🏷️ {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feature Switches */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3.5">
        {/* Silent Printing */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.silent_print !== false}
            onChange={(e) => setFormData({ ...formData, silent_print: e.target.checked })}
            className="w-4 h-4 mt-0.5 rounded text-blue-600 cursor-pointer"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('silent_print', 'Silent Printing (No Dialog Popups)')}</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t('silent_print_desc', 'Print receipts instantly in <100ms without opening standard browser print window.')}
            </p>
          </div>
        </label>

        {/* Cash Drawer Kick */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.cash_drawer_kick !== false}
            onChange={(e) => setFormData({ ...formData, cash_drawer_kick: e.target.checked })}
            className="w-4 h-4 mt-0.5 rounded text-blue-600 cursor-pointer"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('cash_drawer_kick', 'Open Cash Drawer on Sale Completion')}</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t('cash_drawer_kick_desc', 'Send electronic pulse to cash drawer upon completing a cash transaction.')}
            </p>
          </div>
        </label>

        {/* Auto Paper Cut */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.auto_paper_cut !== false}
            onChange={(e) => setFormData({ ...formData, auto_paper_cut: e.target.checked })}
            className="w-4 h-4 mt-0.5 rounded text-blue-600 cursor-pointer"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-blue-500" />
              <span>{t('auto_paper_cut', 'Auto Paper Cut')}</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t('auto_paper_cut_desc', 'Send standard ESC/POS paper cut command at the end of each receipt.')}
            </p>
          </div>
        </label>
      </div>

      {/* Hardware Diagnostics / Test Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleTestPrint}
          disabled={isTestingPrint || !isConnected}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-sm flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>{isTestingPrint ? t('processing', 'Printing...') : t('test_print_btn', '🖨️ Test Print Receipt')}</span>
        </button>

        <button
          type="button"
          onClick={handleTestDrawer}
          disabled={isTestingDrawer || !isConnected}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
        >
          <DollarSign className="w-4 h-4" />
          <span>{isTestingDrawer ? t('processing', 'Kicking...') : t('test_drawer_btn', '💵 Test Cash Drawer')}</span>
        </button>
      </div>

      {/* QZ Tray Installer / Setup Modal */}
      <QzTraySetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onSuccess={() => {
          setIsSetupModalOpen(false);
          fetchPrinters();
        }}
      />
    </div>
  );
};
