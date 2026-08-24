import React, { useState, useEffect } from 'react';
import { usePosStore } from '../../store/usePosStore';
import { AdminSettingsHardware } from './AdminSettingsHardware';
import { t } from '../../utils/i18n';
import type { AdminSettings } from '../../types';
import {
  Save,
  RotateCw,
  Sliders,
  Printer,
  Volume2,
  Package,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const { adminSettings, fetchAdminSettings, saveAdminSettings, initData } = usePosStore();

  const [formData, setFormData] = useState<AdminSettings>({
    inventory_mode: 'woocommerce',
    store_phone: '',
    store_tax_id: '',
    receipt_header: "Thank you for your purchase!\nFast & Reliable Service",
    receipt_footer: "Please keep this receipt for warranty and returns.",
    auto_print: false,
    sound_effects: true,
    low_stock_threshold: 5,
    enable_discounts: true,
    enable_custom_price: true,
    receipt_printer: '',
    label_printer: '',
    cash_drawer_kick: true,
    auto_paper_cut: true,
    silent_print: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchAdminSettings();
  }, [fetchAdminSettings]);

  useEffect(() => {
    if (adminSettings) {
      setFormData(adminSettings);
    }
  }, [adminSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const success = await saveAdminSettings(formData);
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('settings_title', 'System & POS Settings')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('settings_desc', 'Configure management modes, stock alerts, receipt templates and cashier parameters.')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? t('saving', 'Saving...') : t('save_settings', 'Save Settings')}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{t('settings_saved_success', 'All settings updated and synchronized across terminals!')}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Inventory & Management Mode Switcher */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('inventory_control_mode', 'Inventory & Products Control Mode')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('inventory_mode_desc', 'Choose where you want your products, stock counts and barcodes to be primarily managed.')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Option A: WooCommerce Standard */}
            <label
              className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.inventory_mode === 'woocommerce'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  🛍️ {t('wc_standard_mode', 'WooCommerce Standard Mode')}
                </span>
                <input
                  type="radio"
                  name="inventory_mode"
                  value="woocommerce"
                  checked={formData.inventory_mode === 'woocommerce'}
                  onChange={() => setFormData({ ...formData, inventory_mode: 'woocommerce' })}
                  className="w-4 h-4 text-blue-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('wc_standard_mode_desc', 'Products and stock are managed from the default WordPress/WooCommerce menu. POS periodically fetches and delta-syncs updates.')}
              </p>
            </label>

            {/* Option B: Omni POS Direct Control */}
            <label
              className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.inventory_mode === 'omni_pos'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    ⚡ {t('omni_direct_mode', 'Omni POS Direct Control')}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold">
                    {t('recommended', 'Retail Recommended')}
                  </span>
                </div>
                <input
                  type="radio"
                  name="inventory_mode"
                  value="omni_pos"
                  checked={formData.inventory_mode === 'omni_pos'}
                  onChange={() => setFormData({ ...formData, inventory_mode: 'omni_pos' })}
                  className="w-4 h-4 text-blue-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('omni_direct_mode_desc', 'Unlock direct rapid inventory adjustment, instant barcode assigner, wholesale costs, and fast creation directly inside Omni POS Hub.')}
              </p>
            </label>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('low_stock_threshold', 'Low Stock Alert Threshold')}
            </label>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 5 })}
                className="w-24 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('items', 'units remaining')}</span>
            </div>
          </div>
        </div>

        {/* 2. Receipt Layout & Store Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('receipt_template', 'Thermal Receipt Template & Print')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('receipt_template_desc', 'Printed on 80mm and 58mm POS thermal printers upon checkout.')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('store_phone', 'Store Phone Number')}
              </label>
              <input
                type="text"
                value={formData.store_phone}
                onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                placeholder="+995 599 00 00 00"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('store_tax_id', 'Tax ID / Company Registry Number')}
              </label>
              <input
                type="text"
                value={formData.store_tax_id}
                onChange={(e) => setFormData({ ...formData, store_tax_id: e.target.value })}
                placeholder="e.g. 405123456"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('receipt_header', 'Receipt Header Message')}
            </label>
            <textarea
              rows={2}
              value={formData.receipt_header}
              onChange={(e) => setFormData({ ...formData, receipt_header: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('receipt_footer', 'Receipt Footer Message / Return Policy')}
            </label>
            <textarea
              rows={2}
              value={formData.receipt_footer}
              onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.auto_print}
                onChange={(e) => setFormData({ ...formData, auto_print: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {t('auto_print_receipts', 'Auto-trigger print dialog immediately upon completing sale')}
              </span>
            </label>
          </div>
        </div>

        {/* 3. Hardware & QZ Tray Printing */}
        <AdminSettingsHardware formData={formData} setFormData={setFormData} />

        {/* 4. Audio & POS Features */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('audio_features', 'Audio & POS Features')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('audio_features_desc', 'Hardware scanner sound feedback and cashier interaction switches.')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sound_effects}
                onChange={(e) => setFormData({ ...formData, sound_effects: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600"
              />
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {t('enable_sound_fx', 'Enable scanner beep tone and payment completion melodic chime')}
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enable_discounts}
                onChange={(e) => setFormData({ ...formData, enable_discounts: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {t('allow_cashier_discounts', 'Allow cashiers to apply order and line-item percentage discounts')}
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enable_custom_price}
                onChange={(e) => setFormData({ ...formData, enable_custom_price: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {t('allow_custom_price', 'Allow custom manual price override on cart items')}
              </span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};
