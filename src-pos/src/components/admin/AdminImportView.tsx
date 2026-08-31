import React, { useState, useEffect, useRef } from 'react';
import { usePosStore } from '../../store/usePosStore';
import { t } from '../../utils/i18n';
import type { ImportPayload, ImportResponse } from '../../types';
import {
  UploadCloud,
  FileJson,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Package,
  FolderTree,
  Building2,
  Truck,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Sparkles,
  Download,
  Tag,
  DollarSign,
  History,
  Layers,
  RotateCcw,
  Database,
  Check,
  Info,
  Sliders,
} from 'lucide-react';

interface MigrationStats {
  is_vitepos_active: boolean;
  is_vitepos_installed: boolean;
  products_with_vtp_stocks: number;
  products_with_vtp_barcode: number;
  products_with_vtp_cost: number;
  total_products: number;
  total_variations: number;
  cash_drawer_sessions: number;
  cash_movements_count: number;
  vtp_orders_count: number;
  vendors_count: number;
  has_migratable_data: boolean;
  available_snapshots: Array<{
    snapshot_id: string;
    created_at: string;
    size_kb: number;
  }>;
}

export const AdminImportView: React.FC = () => {
  const { showNotification, syncCatalog } = usePosStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sub-tabs: 'direct' (Live DB Sync) vs 'file' (JSON Package)
  const [migrationMode, setMigrationMode] = useState<'direct' | 'file'>('direct');

  // Direct Live Migration State
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState<MigrationStats | null>(null);

  const [migrateStocks, setMigrateStocks] = useState(true);
  const [migrateBarcodes, setMigrateBarcodes] = useState(true);
  const [migrateCostPrices, setMigrateCostPrices] = useState(true);
  const [migrateShifts, setMigrateShifts] = useState(true);
  const [migrateMovements, setMigrateMovements] = useState(true);

  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const [isMigrationSuccess, setIsMigrationSuccess] = useState(false);

  const [isRollingBack, setIsRollingBack] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');

  // File JSON Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportPayload | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isFileImporting, setIsFileImporting] = useState(false);
  const [fileImportResult, setFileImportResult] = useState<ImportResponse | null>(null);

  // Fetch Live DB Stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const resp = await fetch(
        (window.omniPosConfig?.restUrl || '/wp-json/') + 'omni-pos/v1/admin/migration/stats',
        {
          headers: {
            'X-WP-Nonce': window.omniPosConfig?.nonce || '',
          },
        }
      );
      const data = await resp.json();
      if (data && data.success && data.data) {
        setStats(data.data);
        if (data.data.available_snapshots?.length > 0) {
          setSelectedSnapshot(data.data.available_snapshots[0].snapshot_id);
        }
      }
    } catch (e: any) {
      showNotification('Error loading migration stats: ' + e.message, 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Run Direct 1-Click Live Migration & Multi-Stock Overwrite
  const handleRunLiveMigration = async () => {
    if (
      !confirm(
        'VitePOS-ის მონაცემების მიგრაციის დაწყებამდე სისტემა შექმნის სრულ სარეზერვო Snapshot ასლს. VitePOS-ის მარაგები გადაეწერება WooCommerce-ის მარაგებს. გსურთ გაგრძელება?'
      )
    ) {
      return;
    }

    setIsMigrating(true);
    setMigrationLogs(['🚀 მიგრაციის პროცესი დაიწყო...', '🛡️ იქმნება ავტომატური უსაფრთხოების Snapshot ასლი...']);
    setIsMigrationSuccess(false);

    try {
      const resp = await fetch(
        (window.omniPosConfig?.restUrl || '/wp-json/') + 'omni-pos/v1/admin/migration/run',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': window.omniPosConfig?.nonce || '',
          },
          body: JSON.stringify({
            options: {
              migrate_stocks: migrateStocks,
              migrate_barcodes: migrateBarcodes,
              migrate_cost_prices: migrateCostPrices,
              migrate_shifts: migrateShifts,
              migrate_movements: migrateMovements,
            },
          }),
        }
      );

      const res = await resp.json();
      if (res && res.success && res.data) {
        setMigrationLogs((prev) => [
          ...prev,
          ...(res.data.logs || []),
          '🎉 VitePOS მონაცემები & მარაგები წარმატებით გადაეწერა WooCommerce-ს!',
        ]);
        setIsMigrationSuccess(true);
        showNotification('VitePOS მარაგები და მონაცემები წარმატებით დასინქრონირდა!', 'success');
        fetchStats();
        syncCatalog();
      } else {
        const errMsg = res?.message || 'მიგრაციის შეცდომა';
        setMigrationLogs((prev) => [...prev, '❌ შეცდომა: ' + errMsg]);
        showNotification(errMsg, 'error');
      }
    } catch (e: any) {
      setMigrationLogs((prev) => [...prev, '❌ Network/Server Error: ' + e.message]);
      showNotification('Error: ' + e.message, 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  // Rollback to Snapshot
  const handleRollback = async () => {
    if (!selectedSnapshot) {
      alert('გთხოვთ აირჩიოთ სარეზერვო Snapshot ასლი.');
      return;
    }

    if (
      !confirm(
        `დარწმუნებული ხართ, რომ გსურთ სისტემის დაბრუნება ${selectedSnapshot} ასლზე? მიგრირებული ცვლები და მონაცემები წაიშლება.`
      )
    ) {
      return;
    }

    setIsRollingBack(true);
    try {
      const resp = await fetch(
        (window.omniPosConfig?.restUrl || '/wp-json/') + 'omni-pos/v1/admin/migration/rollback',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': window.omniPosConfig?.nonce || '',
          },
          body: JSON.stringify({
            snapshot_id: selectedSnapshot,
          }),
        }
      );

      const res = await resp.json();
      if (res && res.success) {
        showNotification('სისტემა წარმატებით დაბრუნდა არჩეულ რეზერვზე!', 'success');
        fetchStats();
        syncCatalog();
      } else {
        showNotification(res?.message || 'Rollback Error', 'error');
      }
    } catch (e: any) {
      showNotification('Rollback failed: ' + e.message, 'error');
    } finally {
      setIsRollingBack(false);
    }
  };

  // JSON File Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParseError(null);
    setFileImportResult(null);

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

  const handleStartFileImport = async () => {
    if (!parsedData) return;
    setIsFileImporting(true);

    try {
      const resp = await fetch(
        (window.omniPosConfig?.restUrl || '/wp-json/') + 'omni-pos/v1/admin/import/execute',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': window.omniPosConfig?.nonce || '',
          },
          body: JSON.stringify({
            categories: parsedData.categories || [],
            products: parsedData.products || [],
            suppliers: parsedData.suppliers || [],
            purchases: parsedData.purchases || [],
            options: {
              import_categories: true,
              import_products: true,
              import_suppliers: true,
              import_purchases: true,
              update_existing: true,
            },
          }),
        }
      );

      const res = await resp.json();
      if (res && res.success && res.data) {
        setFileImportResult(res.data);
        showNotification('JSON პაკეტი წარმატებით იმპორტირდა!', 'success');
        syncCatalog();
      } else {
        showNotification(res?.message || 'Import Error', 'error');
      }
    } catch (e: any) {
      showNotification('Import failed: ' + e.message, 'error');
    } finally {
      setIsFileImporting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 w-full text-slate-800 dark:text-slate-200">
      {/* Header Banner with Mode Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>VitePOS ➔ Omni POS მონაცემების & მარაგების მიგრაცია</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider">
              Multi-Stock Sync
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            VitePOS-ის იზოლირებული მრავალმარაგების (Outlet Multi-Stocks), შტრიხკოდების, ცვლებისა და თვითღირებულების სრული გადატანა WooCommerce-ში.
          </p>
        </div>

        {/* Switch Mode: Direct Live vs JSON Package */}
        <div className="flex items-center space-x-1 bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-300/60 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setMigrationMode('direct')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              migrationMode === 'direct'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>პირდაპირი მიგრაცია (Live DB)</span>
          </button>

          <button
            type="button"
            onClick={() => setMigrationMode('file')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              migrationMode === 'file'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON ფაილის იმპორტი</span>
          </button>
        </div>
      </div>

      {migrationMode === 'direct' ? (
        /* Direct 1-Click Live Migration & Multi-Stock Overwrite Mode */
        <div className="space-y-6">
          {/* Safety & Multi-Stock Explanation Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200 dark:border-blue-800/60 flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-blue-950 dark:text-blue-200">
                როგორ მუშაობს Outlet Multi-Stock მარაგების გადაწერა:
              </h3>
              <p className="text-blue-900 dark:text-blue-300 mt-1 leading-relaxed text-xs">
                როდესაც VitePOS-ში ჩართული იყო <strong className="font-bold">Outlet wise stock (Multi stocks)</strong>, VitePOS იყენებდა საკუთარ იზოლირებულ მარაგებს (<code className="bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">_vt_stocks</code>) და არ ანახლებდა WooCommerce-ს.
                <br />
                ქვემოთ მოცემული ღილაკით სისტემა <strong>აიღებს VitePOS-ის რეალურ მარაგებს და გადააწერს WooCommerce-ის ძირითად მარაგებს</strong>, რის შემდეგაც Omni POS და საიტი იმუშავებს ზუსტად იმავე რაოდენობებით!
              </p>
            </div>
          </div>

          {/* Discovery Stats Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                ბაზაში აღმოჩენილი VitePOS მონაცემები:
              </span>
              <button
                type="button"
                onClick={fetchStats}
                disabled={loadingStats}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
                <span>ხელახლა სკანირება</span>
              </button>
            </div>

            {loadingStats ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center space-x-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <RotateCw className="w-4 h-4 animate-spin text-blue-500" />
                <span>მონაცემთა ბაზის სკანირება...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase">Multi-Stocks</span>
                    <Building2 className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {stats?.products_with_vtp_stocks || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">VitePOS მარაგები</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase">შტრიხკოდები</span>
                    <Tag className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {stats?.products_with_vtp_barcode || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">_vt_barcode</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase">თვითღირებულება</span>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {stats?.products_with_vtp_cost || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">_vt_cost_price</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase">სალაროს ცვლები</span>
                    <History className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {stats?.cash_drawer_sessions || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Drawer Sessions</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase">მოძრაობები</span>
                    <Layers className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {stats?.cash_movements_count || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Cash In / Out Logs</div>
                </div>
              </div>
            )}
          </div>

          {/* Selectable Options */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="font-bold text-xs text-slate-900 dark:text-white">
              აირჩიეთ რა მონაცემების მიგრაცია და გადაწერა გსურთ:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="checkbox"
                  checked={migrateStocks}
                  onChange={(e) => setMigrateStocks(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    მარაგების გადაწერა (VitePOS Multi-Stock ➔ WooCommerce)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    _vt_stocks-ის რაოდენობები ჩაიწერება _stock-ში და ჩაირთვება Manage Stock
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="checkbox"
                  checked={migrateBarcodes}
                  onChange={(e) => setMigrateBarcodes(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    შტრიხკოდების მიგრაცია (_vt_barcode ➔ _barcode / SKU)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    VitePOS-ის ბარკოდები გადავა WooCommerce-ში და ცარიელ SKU-ებში
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="checkbox"
                  checked={migrateCostPrices}
                  onChange={(e) => setMigrateCostPrices(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    თვითღირებულების ფასები (_vt_cost_price ➔ _cost_price)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    შესყიდვის თვითღირებულება დასინქრონირდება Omni POS-ში
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="checkbox"
                  checked={migrateShifts}
                  onChange={(e) => setMigrateShifts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    სალაროს ცვლები & სესიები (Cash Drawers)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    VitePOS-ის ცვლები გადმოვა Omni POS-ის Shifts ისტორიაში
                  </div>
                </div>
              </label>
            </div>

            {/* Action Execution Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleRunLiveMigration}
                disabled={isMigrating}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isMigrating ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {isMigrating ? 'მიგრაცია და გადაწერა მიმდინარეობს...' : '🚀 VitePOS ➔ WooCommerce მიგრაციის დაწყება'}
                </span>
              </button>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>ავტომატური Snapshot ასლი შეიქმნება დაწყებამდე</span>
              </div>
            </div>

            {/* Execution Terminal Logs */}
            {migrationLogs.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] space-y-1.5 border border-slate-800 max-h-56 overflow-y-auto custom-scrollbar">
                <div className="text-slate-400 font-bold border-b border-slate-800 pb-1 flex items-center justify-between">
                  <span>Terminal Migration Output:</span>
                  {isMigrationSuccess && (
                    <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> დასრულებულია
                    </span>
                  )}
                </div>
                {migrationLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rollback Section */}
          {stats && stats.available_snapshots?.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4" />
                  <span>სარეზერვო ასლის აღდგენა (1-Click Rollback)</span>
                </div>
                <div className="text-[11px] text-amber-800 dark:text-amber-400">
                  თუ გსურთ წინა მდგომარეობის დაბრუნება, აირჩიეთ Snapshot:
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <select
                  value={selectedSnapshot}
                  onChange={(e) => setSelectedSnapshot(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  {stats.available_snapshots.map((s) => (
                    <option key={s.snapshot_id} value={s.snapshot_id}>
                      {s.snapshot_id} ({s.created_at})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleRollback}
                  disabled={isRollingBack}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isRollingBack ? 'აღდგენა...' : 'აღდგენა'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* File JSON Import Mode */
        <div className="space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-10 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {selectedFile ? selectedFile.name : 'Select or Drop your JSON Migration Package'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Upload the JSON file exported from the VitePOS Migrator plugin
              </div>
            </div>
          </div>

          {parseError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {parsedData && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="font-bold text-xs text-slate-900 dark:text-white">
                JSON პაკეტის შიგთავსი:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {parsedData.categories?.length || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">კატეგორიები</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {parsedData.products?.length || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">პროდუქტები</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {parsedData.suppliers?.length || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">მომწოდებლები</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {parsedData.purchases?.length || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">შესყიდვები</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartFileImport}
                disabled={isFileImporting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isFileImporting ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isFileImporting ? 'იმპორტი მიმდინარეობს...' : 'JSON პაკეტის იმპორტირება'}</span>
              </button>
            </div>
          )}

          {fileImportResult && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>
                იმპორტი დასრულდა: {fileImportResult.imported?.products || 0} პროდუქტი, {fileImportResult.imported?.categories || 0} კატეგორია!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
