import React, { useState, useEffect, useMemo } from 'react';
import { usePosStore } from '../../store/usePosStore';
import { posApi } from '../../services/api';
import { LanguageSelector } from '../LanguageSelector';
import { t } from '../../utils/i18n';
import {
  Languages,
  Search,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  HelpCircle,
  Filter,
  Sparkles,
  Globe,
  Tag,
  ArrowRight,
  Edit3,
  X,
  FileCode,
  ScanSearch,
  Bot,
  RefreshCw,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';

export const AdminTranslationsView: React.FC = () => {
  const {
    currentLanguage,
    languages,
    translations,
    customTranslations,
    defaultStrings,
    fetchTranslations,
    saveTranslations,
    showNotification,
  } = usePosStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editedOverrides, setEditedOverrides] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Add String Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newEn, setNewEn] = useState('');
  const [newCat, setNewCat] = useState('custom');
  const [newTranslation, setNewTranslation] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Multi-selection state
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const toggleSelectKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleSelectAllKeys = (visibleKeys: string[]) => {
    if (selectedKeys.length === visibleKeys.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(visibleKeys);
    }
  };

  const handleBulkDeleteCustomStrings = async () => {
    if (selectedKeys.length === 0) return;
    if (!window.confirm(`${t('confirm_bulk_delete', 'Are you sure you want to delete the selected items?')} (${selectedKeys.length})`)) {
      return;
    }

    setIsBulkProcessing(true);
    try {
      const resp = await posApi.bulkDelete('translations', selectedKeys);
      if (resp.success) {
        showNotification(t('items_deleted_success', 'Selected items deleted successfully!'), 'success');
        setSelectedKeys([]);
        fetchTranslations();
      }
    } catch (err: any) {
      showNotification(t('error', 'Failed to delete items') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkClearOverrides = () => {
    if (selectedKeys.length === 0) return;
    const nextOverrides = { ...editedOverrides };
    for (const k of selectedKeys) {
      delete nextOverrides[k];
    }
    setEditedOverrides(nextOverrides);
    setHasChanges(true);
    showNotification(`Cleared overrides for ${selectedKeys.length} items. Click "Save Changes" to apply.`, 'success');
    setSelectedKeys([]);
  };

  useEffect(() => {
    fetchTranslations();
  }, [fetchTranslations]);

  useEffect(() => {
    setEditedOverrides({ ...customTranslations });
  }, [customTranslations]);

  const categories = useMemo(() => {
    return [
      { id: 'all', label: t('all_strings', 'All Strings') },
      { id: 'general', label: t('general_ui', 'General & UI') },
      { id: 'pos', label: t('pos_products', 'POS & Products') },
      { id: 'cart', label: t('cart_customer', 'Cart & Customer') },
      { id: 'payment', label: t('checkout_payment', 'Checkout & Payment') },
      { id: 'orders', label: t('orders_receipts', 'Orders & Receipts') },
      { id: 'suppliers', label: t('suppliers_intake', 'Suppliers & Intake') },
      { id: 'shifts', label: t('shifts_register', 'Shifts & Register') },
      { id: 'reports', label: t('sales_reports', 'Sales Reports') },
      { id: 'custom', label: t('custom_strings', 'Custom User Strings') },
    ];
  }, [translations]);

  const stringList = useMemo(() => {
    return Object.entries(defaultStrings).map(([key, item]) => ({
      key,
      cat: item.cat || 'general',
      en: item.en || key,
      custom_added: Boolean(item.custom_added),
      current: translations[key] || item.en || key,
      override: editedOverrides[key] || '',
    }));
  }, [defaultStrings, translations, editedOverrides]);

  const filteredStrings = useMemo(() => {
    return stringList.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.cat === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.key.toLowerCase().includes(q) ||
        item.en.toLowerCase().includes(q) ||
        item.current.toLowerCase().includes(q) ||
        item.override.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [stringList, selectedCategory, searchQuery]);

  const handleInputChange = (key: string, value: string) => {
    setEditedOverrides((prev) => {
      const next = { ...prev, [key]: value };
      if (!value.trim()) {
        delete next[key];
      }
      return next;
    });
    setHasChanges(true);
  };

  const handleCopyDefault = (key: string, defaultText: string) => {
    handleInputChange(key, defaultText);
  };

  const handleClearSingle = (key: string) => {
    setEditedOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const success = await saveTranslations(currentLanguage, editedOverrides);
    setIsSaving(false);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleResetAll = () => {
    if (!confirm('Are you sure you want to reset all custom translations to system defaults?')) {
      return;
    }
    setEditedOverrides({});
    setHasChanges(true);
  };

  const handleScanSystem = async () => {
    setIsScanning(true);
    try {
      const resp = await posApi.scanTranslations();
      if (resp.success) {
        await fetchTranslations(currentLanguage);
        showNotification(resp.message || `Scanned ${resp.files_scanned} files, discovered ${resp.total_strings} strings!`, 'success');
      }
    } catch (err: any) {
      showNotification('Scan failed: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAutoTranslate = async () => {
    const targetLang = currentLanguage === 'auto' ? 'ka_GE' : currentLanguage;
    const targetLabel = languages.find((l) => l.code === targetLang)?.label || targetLang;

    if (!confirm(`Do you want to automatically translate all system strings into ${targetLabel}?`)) {
      return;
    }

    setIsAutoTranslating(true);
    try {
      const resp = await posApi.autoTranslate(targetLang);
      if (resp.success) {
        await fetchTranslations(targetLang);
        showNotification(resp.message || `Auto-translated ${resp.translated_count} strings successfully!`, 'success');
      }
    } catch (err: any) {
      showNotification('Auto-translation failed: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsAutoTranslating(false);
    }
  };

  const handleCreateCustomString = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = newKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanKey || !newEn.trim()) {
      showNotification('Key and English Text are required', 'error');
      return;
    }

    setIsAdding(true);
    try {
      const resp = await posApi.addCustomString({
        key: cleanKey,
        en: newEn.trim(),
        cat: newCat,
        translation: newTranslation.trim(),
      });
      if (resp.success) {
        await fetchTranslations(currentLanguage);
        showNotification(t('string_added_success', 'Custom string added & saved successfully!'), 'success');
        setIsAddModalOpen(false);
        setNewKey('');
        setNewEn('');
        setNewTranslation('');
      }
    } catch (err: any) {
      showNotification('Failed to add string: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCustomString = async (key: string) => {
    if (!confirm(`Are you sure you want to delete custom string "${key}"?`)) {
      return;
    }

    try {
      const resp = await posApi.deleteCustomString(key);
      if (resp.success) {
        await fetchTranslations(currentLanguage);
        showNotification(`Custom string "${key}" deleted successfully`, 'success');
      }
    } catch (err: any) {
      showNotification('Failed to delete string: ' + (err.message || 'Error'), 'error');
    }
  };

  // Export custom translations as JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(editedOverrides, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `omni-translations-${currentLanguage}-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Import custom translations JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && typeof json === 'object') {
          setEditedOverrides((prev) => ({ ...prev, ...json }));
          setHasChanges(true);
          showNotification('Translations imported into editor! Click "Save Changes" to apply.', 'info');
        }
      } catch (err: any) {
        showNotification('Invalid JSON translation file', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="h-16 px-6 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">{t('languages_translations', 'Language & In-App Translations')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('languages_desc', 'Scan system strings, add custom phrases, edit translations, or translate with Loco Translate')}
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Add Custom String Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            title="Manually add a new translatable string"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add_custom_string', 'Add String (დამატება)')}</span>
          </button>

          {/* Scan Codebase Button */}
          <button
            type="button"
            onClick={handleScanSystem}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700/80 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Scan entire codebase and harvest all translatable strings"
          >
            <ScanSearch className={`w-4 h-4 text-purple-600 dark:text-purple-400 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? t('scanning', 'Scanning...') : t('scan_system', 'Scan System')}</span>
          </button>

          {/* Auto-Translate All Button */}
          <button
            type="button"
            onClick={handleAutoTranslate}
            disabled={isAutoTranslating}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            title="Automatically translate all strings into active language"
          >
            <Bot className={`w-4 h-4 ${isAutoTranslating ? 'animate-bounce' : ''}`} />
            <span>{isAutoTranslating ? t('saving', 'Translating...') : t('auto_translate_all', 'Auto-Translate All')}</span>
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          <LanguageSelector />

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
              hasChanges
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 active:scale-95 animate-pulse'
                : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? t('saving', 'Saving...') : hasChanges ? t('save_changes', 'Save Custom Translations *') : t('save_settings', 'Save Changes')}</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-6 py-3 bg-indigo-50/70 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-300">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            <strong>Loco Translate & POT:</strong> {t('languages_desc', 'You can translate Omni POS using standard WordPress translation plugins or customize any string right here.')}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportJson}
            title="Export custom translations as JSON"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-[11px] font-semibold cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Export JSON</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-[11px] font-semibold cursor-pointer">
            <Upload className="w-3 h-3" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleResetAll}
            title="Reset all overrides"
            className="p-1 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar py-0.5">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_placeholder', 'Search string by key, English or translation...')}
            className="w-full pl-8 pr-4 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Translations Table */}
      <div className="flex-1 px-6 py-4 overflow-hidden flex flex-col">
        <div className="flex-1 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredStrings.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <FileCode className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <span className="text-sm font-medium">{t('no_orders', 'No matching translation strings found')}</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredStrings.length > 0 && selectedKeys.length === filteredStrings.length}
                        onChange={() => toggleSelectAllKeys(filteredStrings.map((i) => i.key))}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4 w-48">{t('item', 'String Key')}</th>
                    <th className="py-3 px-3 w-56">{t('default_english', 'Default English')}</th>
                    <th className="py-3 px-3 w-56">{t('active_system_text', 'Active System Text')}</th>
                    <th className="py-3 px-4">{t('custom_translation_col', 'Custom Translation (ხელით თარგმნა)')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredStrings.map((item) => {
                    const isCustomized = Boolean(item.override && item.override !== item.current);
                    const isSelected = selectedKeys.includes(item.key);

                    return (
                      <tr
                        key={item.key}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-blue-50/60 dark:bg-blue-950/20'
                            : isCustomized
                            ? 'bg-purple-50/30 dark:bg-purple-950/10 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectKey(item.key)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Key */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {item.key}
                            </span>
                            {item.custom_added && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-extrabold uppercase">
                                Custom
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Default English */}
                        <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-400">
                          {item.en}
                        </td>

                        {/* Active System Translation */}
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-200">
                          {item.current}
                        </td>

                        {/* Custom Override Input */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={item.override}
                              onChange={(e) => handleInputChange(item.key, e.target.value)}
                              placeholder={`Type custom wording (e.g. ${item.current})`}
                              className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                item.override
                                  ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 font-bold'
                                  : 'bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                              }`}
                            />

                            {/* Quick copy default button */}
                            <button
                              type="button"
                              onClick={() => handleCopyDefault(item.key, item.current)}
                              title={t('copy_default', 'Copy active translation into custom input')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Clear override button */}
                            {item.override && (
                              <button
                                type="button"
                                onClick={() => handleClearSingle(item.key)}
                                title={t('clear_override', 'Clear custom override')}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete custom user-added string */}
                            {item.custom_added && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomString(item.key)}
                                title={t('delete', 'Delete this custom string permanently')}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedKeys.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center justify-between p-3.5 px-5 bg-slate-900/95 dark:bg-slate-800/95 text-white rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 animate-slideUp gap-6 min-w-[380px]">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold font-mono">
              {selectedKeys.length} {t('selected_count', 'Selected')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedKeys([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={handleBulkClearOverrides}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <span>{t('clear_override', 'Clear Overrides')}</span>
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteCustomStrings}
              disabled={isBulkProcessing}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isBulkProcessing ? t('processing', 'Deleting...') : t('delete_selected', 'Delete Selected')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Custom String Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {t('add_custom_string', 'Add New Translatable String')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('custom_string_desc', 'Register a new string key and provide its translation')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomString} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {t('string_key', 'String Key (Unique Identifier)')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. promo_banner_text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {t('categories', 'Category')}
                </label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="custom">{t('custom_strings', 'Custom Phrases')}</option>
                  <option value="general">{t('general_ui', 'General & UI')}</option>
                  <option value="pos">{t('pos_products', 'POS & Products')}</option>
                  <option value="cart">{t('cart_customer', 'Cart & Customer')}</option>
                  <option value="payment">{t('checkout_payment', 'Checkout & Payment')}</option>
                  <option value="orders">{t('orders_receipts', 'Orders & Receipts')}</option>
                  <option value="suppliers">{t('suppliers_intake', 'Suppliers & Intake')}</option>
                  <option value="shifts">{t('shifts_register', 'Shifts & Register')}</option>
                  <option value="reports">{t('sales_reports', 'Sales Reports')}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {t('default_english', 'Default English Text')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10% Summer Special Discount"
                  value={newEn}
                  onChange={(e) => setNewEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {t('custom_translation_col', 'Translation / ქართული თარგმანი')} ({t('optional', 'Optional')})
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10% საზაფხულო სპეციალური ფასდაკლება"
                  value={newTranslation}
                  onChange={(e) => setNewTranslation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isAdding ? t('saving', 'Adding...') : t('save', 'Add & Save String')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
