import React, { useState, useEffect, useCallback } from 'react';
import { niceLabelClient } from '../../services/niceLabelClient';
import { usePosStore } from '../../store/usePosStore';
import { ExtensionSetupModal } from '../hardware/ExtensionSetupModal';
import { NiceLabelDocsModal } from './NiceLabelDocsModal';
import { AdminMigrationHubModal } from './AdminMigrationHubModal';
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
  Puzzle,
  Tag,
  Sliders,
  BookOpen,
  Database,
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

  const [isExtInstalled, setIsExtInstalled] = useState(false);
  const [isExtSetupOpen, setIsExtSetupOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const [isTestingNiceLabel, setIsTestingNiceLabel] = useState(false);
  const [isTestingPrint, setIsTestingPrint] = useState(false);
  const [isTestingDrawer, setIsTestingDrawer] = useState(false);

  const checkExt = useCallback(async () => {
    const installed = await niceLabelClient.isExtensionInstalled(600);
    setIsExtInstalled(installed);
  }, []);

  useEffect(() => {
    checkExt();
  }, [checkExt]);

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

  const handleTestPrint = async () => {
    setIsTestingPrint(true);
    try {
      const sampleOrder = {
        order_number: 'TEST-001',
        created_at: new Date().toISOString(),
        cashier_name: initData?.cashier?.name || 'Cashier',
        customer: { id: 0, name: 'Sample Customer' },
        items: [
          { name: 'Omni POS Thermal Test Item', quantity: 1, price: 10.0, total: 10.0 },
        ],
        subtotal: 10.0,
        discount_total: 0,
        tax_total: 0,
        total: 10.0,
        payment_method: 'cash',
        amount_tendered: 10.0,
        change_amount: 0,
      };

      const res = await niceLabelClient.printReceipt(
        sampleOrder,
        initData?.store,
        {
          printer: formData.receipt_printer,
        }
      );

      if (res && res.success) {
        showNotification(t('test_print_sent', 'Test receipt sent to printer!'), 'success');
      }
    } catch (err: any) {
      showNotification('Print error: ' + (err.message || 'Failed'), 'error');
    } finally {
      setIsTestingPrint(false);
    }
  };

  const handleTestDrawer = async () => {
    setIsTestingDrawer(true);
    try {
      await niceLabelClient.openCashDrawer({
        printer: formData.receipt_printer,
      });
      showNotification(t('test_drawer_sent', 'Pulse signal sent to cash drawer!'), 'success');
    } catch (err: any) {
      showNotification('Drawer kick error: ' + (err.message || 'Failed'), 'error');
    } finally {
      setIsTestingDrawer(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Omni Print Extension & NiceLabel Bridge Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Puzzle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('nicelabel_extension_title', 'Omni Print & NiceLabel Bridge (Chrome Extension)')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('nicelabel_extension_desc', 'Direct silent thermal printing, NiceLabel barcode stickers & cash drawer integration.')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              onClick={() => setIsDocsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t('nicelabel_docs_btn', '📖 NiceLabel გზამკვლევი')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExtSetupOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all cursor-pointer"
            >
              {isExtInstalled ? t('reconnect_guide', 'Extension Guide') : t('install_extension_btn', 'Install Extension')}
            </button>
          </div>
        </div>

        {/* Printer Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('receipt_printer_label', 'Default Receipt Printer Name')}
            </label>
            <input
              type="text"
              value={formData.receipt_printer || ''}
              onChange={(e) => setFormData({ ...formData, receipt_printer: e.target.value })}
              placeholder="e.g. POS-80, Thermal Receipt, Xprinter"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Leave empty to use the system default thermal printer.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('label_printer_label', 'Default Barcode / Label Printer Name')}
            </label>
            <input
              type="text"
              value={formData.label_printer || ''}
              onChange={(e) => setFormData({ ...formData, label_printer: e.target.value })}
              placeholder="e.g. TSC TE200, Zebra ZD420, Xprinter 365B"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Leave empty to use NiceLabel template default printer.</p>
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
                {t('silent_print_desc', 'Print receipts instantly via Chrome Extension without opening standard browser print window.')}
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
                {t('auto_paper_cut_desc', 'Send standard paper cut command at the end of each receipt.')}
              </p>
            </div>
          </label>
        </div>

        {/* Diagnostics & Test Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleTestPrint}
            disabled={isTestingPrint}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-sm flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isTestingPrint ? t('processing', 'Printing...') : t('test_print_btn', '🖨️ Test Print Receipt')}</span>
          </button>

          <button
            type="button"
            onClick={handleTestDrawer}
            disabled={isTestingDrawer}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>{isTestingDrawer ? t('processing', 'Kicking...') : t('test_drawer_btn', '💵 Test Cash Drawer')}</span>
          </button>

          <button
            type="button"
            onClick={handleTestNiceLabel}
            disabled={isTestingNiceLabel}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isTestingNiceLabel ? <RotateCw className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
            <span>{isTestingNiceLabel ? t('testing', 'Testing...') : t('test_nicelabel_btn', '🏷️ Test NiceLabel Print')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDocsOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center space-x-2 transition-all active:scale-95 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>{t('view_nicelabel_docs', '📖 NiceLabel ინსტრუქცია')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMigrationOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center space-x-2 transition-all active:scale-95 shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>{t('migration_hub_btn', '🔄 VitePOS ➔ Omni მიგრაცია')}</span>
          </button>
        </div>
      </div>

      {/* Extension Setup Modal */}
      <ExtensionSetupModal
        isOpen={isExtSetupOpen}
        onClose={() => {
          setIsExtSetupOpen(false);
          checkExt();
        }}
      />

      {/* NiceLabel Docs & Setup Guide Modal */}
      <NiceLabelDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      {/* VitePOS Migration Hub Modal */}
      <AdminMigrationHubModal
        isOpen={isMigrationOpen}
        onClose={() => setIsMigrationOpen(false)}
      />
    </div>
  );
};
