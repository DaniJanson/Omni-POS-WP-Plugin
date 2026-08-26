import React, { useState, useEffect, useCallback } from 'react';
import { qzClient, type QzStatus } from '../../services/qzClient';
import { niceLabelClient } from '../../services/niceLabelClient';
import { EscPosBuilder } from '../../services/escpos';
import { usePosStore } from '../../store/usePosStore';
import { QzTraySetupModal } from '../hardware/QzTraySetupModal';
import { ExtensionSetupModal } from '../hardware/ExtensionSetupModal';
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
  Puzzle,
  Tag,
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

  const [isExtInstalled, setIsExtInstalled] = useState(false);
  const [isExtSetupOpen, setIsExtSetupOpen] = useState(false);
  const [isTestingNiceLabel, setIsTestingNiceLabel] = useState(false);

  const checkExt = useCallback(async () => {
    const installed = await niceLabelClient.isExtensionInstalled(600);
    setIsExtInstalled(installed);
  }, []);

  useEffect(() => {
    checkExt();
  }, [checkExt]);

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

  const handleTestNiceLabel = async () => {
    setIsTestingNiceLabel(true);
    try {
      const res = await niceLabelClient.printBatch([
        {
          name: 'Omni Hardware Test Sample',
          priceFormatted: '12.50 ₾',
          price: 12.5,
          barcode: '200000011111',
          sku: 'HW-TEST',
          quantity: 1,
        },
      ]);
      if (res.success) {
        showNotification(res.message, 'success');
      } else {
        showNotification('NiceLabel Error: ' + res.message, 'error');
        if (!isExtInstalled) {
          setIsExtSetupOpen(true);
        }
      }
    } catch (e: any) {
      showNotification('NiceLabel Error: ' + e.message, 'error');
    } finally {
      setIsTestingNiceLabel(false);
    }
  };

  const isConnected = status === 'connected';

  return (
    <div className="space-y-6">
      {/* 1. NiceLabel & Barcode Thermal Bridge (Chrome Extension) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Puzzle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('nicelabel_extension_title', 'NiceLabel & Barcode Thermal Bridge (Chrome Extension)')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('nicelabel_extension_desc', 'Direct silent label printing to NiceLabel Automation & thermal barcode printers.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                isExtInstalled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              {isExtInstalled ? '🟢 Extension Active' : '🟡 Extension Offline'}
            </span>

            <button
              type="button"
              onClick={() => setIsExtSetupOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              {isExtInstalled ? t('reconnect_guide', 'Reconnect / Guide') : t('install_extension_btn', 'Install Extension')}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleTestNiceLabel}
            disabled={isTestingNiceLabel}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isTestingNiceLabel ? <RotateCw className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
            <span>{isTestingNiceLabel ? t('testing', 'Testing...') : t('test_nicelabel_btn', '🏷️ Test NiceLabel Print')}</span>
          </button>
        </div>
      </div>

      {/* 2. Receipt Printer & Hardware (QZ Tray / ESC-POS) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t('hardware_settings', 'Receipt Hardware & Cash Drawer (QZ Tray)')}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    isConnected
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}
                >
                  {isConnected ? t('qz_status_online', 'Online') : t('qz_status_offline', 'Offline')}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('hardware_desc', 'Connect thermal receipt printers, electronic cash drawers, and manage silent printing.')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => fetchPrinters()}
              disabled={isLoadingPrinters || !isConnected}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
              title={t('refresh_printers', 'Refresh Printers List')}
            >
              <RotateCw className={`w-4 h-4 ${isLoadingPrinters ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsSetupModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors cursor-pointer"
            >
              {isConnected ? t('reconnect_qz', 'QZ Status / Setup') : t('connect_qz_btn', 'Connect QZ Tray')}
            </button>
          </div>
        </div>

        {/* Printer Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('receipt_printer_label', 'Default Receipt Printer')}
            </label>
            <select
              value={formData.receipt_printer || ''}
              onChange={(e) => setFormData({ ...formData, receipt_printer: e.target.value })}
              disabled={!isConnected || printers.length === 0}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
            >
              <option value="">{t('select_receipt_printer', '-- Select Receipt Printer --')}</option>
              {printers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('label_printer_label', 'Default Barcode / Label Printer')}
            </label>
            <select
              value={formData.label_printer || ''}
              onChange={(e) => setFormData({ ...formData, label_printer: e.target.value })}
              disabled={!isConnected || printers.length === 0}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
            >
              <option value="">{t('select_label_printer', '-- Select Label Printer --')}</option>
              {printers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hardware Capabilities Toggles */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
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

      {/* NiceLabel Extension Setup Modal */}
      <ExtensionSetupModal
        isOpen={isExtSetupOpen}
        onClose={() => {
          setIsExtSetupOpen(false);
          checkExt();
        }}
      />
    </div>
  );
};
