import React, { useState, useRef } from 'react';
import { posApi } from '../../services/api';
import { usePosStore } from '../../store/usePosStore';
import { t } from '../../utils/i18n';
import type { ImportPayload, ImportResponse } from '../../types';
import {
  UploadCloud,
  FileJson,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Package,
  FolderTree,
  Building2,
  Truck,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Sparkles,
  Download,
} from 'lucide-react';

export const AdminImportView: React.FC = () => {
  const { showNotification, setAdminActiveTab } = usePosStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportPayload | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);

  // Options
  const [importCategories, setImportCategories] = useState(true);
  const [importProducts, setImportProducts] = useState(true);
  const [importSuppliers, setImportSuppliers] = useState(true);
  const [importPurchases, setImportPurchases] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(true);

  // Handle file selection and parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParseError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json || typeof json !== 'object') {
          throw new Error('Invalid JSON format');
        }
        setParsedData(json);
      } catch (err: any) {
        setParseError('Failed to parse JSON file: ' + (err.message || 'Invalid syntax'));
        setParsedData(null);
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        setParseError('Please upload a valid .json migration file.');
        return;
      }
      setSelectedFile(file);
      setParseError(null);
      setImportResult(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          setParsedData(json);
        } catch (err: any) {
          setParseError('Failed to parse JSON file: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  // Perform Import
  const handleStartImport = async () => {
    if (!parsedData) return;

    setIsImporting(true);
    setImportProgress(20);

    try {
      const payload: ImportPayload = {
        ...parsedData,
        options: {
          import_categories: importCategories,
          import_products: importProducts,
          import_suppliers: importSuppliers,
          import_purchases: importPurchases,
          update_existing: updateExisting,
        },
      };

      setImportProgress(50);
      const res = await posApi.importMigrationData(payload);
      setImportProgress(100);

      if (res.success) {
        setImportResult(res);
        showNotification(t('import_success', 'Data migration completed successfully!'), 'success');
        // Trigger background catalog sync
        usePosStore.getState().syncCatalog(true).catch(console.error);
      } else {
        throw new Error(res.message || 'Import failed');
      }
    } catch (err: any) {
      showNotification('Import failed: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const categoriesCount = parsedData?.categories?.length || 0;
  const productsCount = parsedData?.products?.length || 0;
  const suppliersCount = parsedData?.suppliers?.length || 0;
  const purchasesCount = parsedData?.purchases?.length || 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100">
      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 max-w-4xl mx-auto w-full">
        {/* Upload Dropzone */}
        {!parsedData && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-[#0f172a] rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:shadow-lg group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileJson className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {t('select_json_file', 'Select or Drop your JSON Migration Package')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
              {t('import_instructions', 'Upload the JSON file exported from the VitePOS Migrator plugin (e.g. omni-migration-2026-08-24.json)')}
            </p>

            <button
              type="button"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all pointer-events-none"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{t('browse_file', 'Browse File')}</span>
            </button>
          </div>
        )}

        {parseError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Data Inspection Preview & Options */}
        {parsedData && (
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
            {/* File Info Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center space-x-3">
                <FileCheck className="w-6 h-6 text-emerald-500" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {selectedFile?.name || 'Migration Package'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Source: {parsedData.source?.toUpperCase() || 'VitePOS'} &bull; Exported: {parsedData.exported_at || 'Recently'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setParsedData(null);
                  setSelectedFile(null);
                  setImportResult(null);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white underline cursor-pointer"
              >
                {t('change_file', 'Change File')}
              </button>
            </div>

            {/* Detected Items Grid */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                {t('detected_records', 'Detected Records in Migration File')}:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white block">
                      {productsCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{t('products', 'Products')}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white block">
                      {categoriesCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{t('categories', 'Categories')}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white block">
                      {suppliersCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{t('suppliers', 'Suppliers')}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white block">
                      {purchasesCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{t('stock_inward', 'Invoices')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('import_settings', 'Import Settings')}:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={importCategories}
                    onChange={(e) => setImportCategories(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>{t('categories', 'Import Categories & Hierarchy')} ({categoriesCount})</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={importProducts}
                    onChange={(e) => setImportProducts(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>{t('products', 'Import Products, Barcodes & Stock')} ({productsCount})</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={importSuppliers}
                    onChange={(e) => setImportSuppliers(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>{t('suppliers', 'Import Suppliers / Vendors')} ({suppliersCount})</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={importPurchases}
                    onChange={(e) => setImportPurchases(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>{t('stock_inward', 'Import Purchase Invoices & Stock Inward')} ({purchasesCount})</span>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="flex items-center space-x-2.5 cursor-pointer font-semibold text-blue-600 dark:text-blue-400 text-xs">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>{t('update_existing_records', 'Update existing products if SKU or Barcode already exists')}</span>
                </label>
              </div>
            </div>

            {/* Action Bar & Progress */}
            <div>
              {isImporting && (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                    <span>{t('importing_progress', 'Importing data into WooCommerce & Omni POS...')}</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 animate-pulse"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleStartImport}
                disabled={isImporting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('saving', 'Processing Migration...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('start_import_now', 'Start Import & Migration Now')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success Report Modal / Card */}
        {importResult && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 shadow-lg animate-fadeIn">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-emerald-900 dark:text-emerald-300">
                  {t('import_success', 'Migration Completed Successfully!')}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  {importResult.message}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white block">
                  {importResult.imported?.categories || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">{t('categories', 'Categories')}</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white block">
                  {importResult.imported?.products || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">{t('products', 'Products')}</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white block">
                  {importResult.imported?.suppliers || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">{t('suppliers', 'Suppliers')}</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white block">
                  {importResult.imported?.purchases || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">{t('stock_inward', 'Invoices')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAdminActiveTab('products')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                {t('products_stock', 'Inspect Products & Stock')} &rarr;
              </button>
              <button
                type="button"
                onClick={() => setAdminActiveTab('suppliers')}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                {t('suppliers', 'Inspect Suppliers & Intake')} &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
