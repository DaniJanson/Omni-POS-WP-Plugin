import React, { useState, useEffect } from 'react';
import { usePosStore } from '../../store/usePosStore';
import { t } from '../../utils/i18n';
import {
  X,
  Database,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Tag,
  DollarSign,
  Layers,
  History,
  ShoppingBag,
  Building2,
  FileCheck2,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';

interface AdminMigrationHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MigrationStats {
  is_vitepos_active: boolean;
  is_vitepos_installed: boolean;
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

export const AdminMigrationHubModal: React.FC<AdminMigrationHubModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showNotification, syncCatalog } = usePosStore();

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MigrationStats | null>(null);

  // Options
  const [migrateBarcodes, setMigrateBarcodes] = useState(true);
  const [migrateCostPrices, setMigrateCostPrices] = useState(true);
  const [migrateShifts, setMigrateShifts] = useState(true);
  const [migrateMovements, setMigrateMovements] = useState(true);
  const [migrateOrders, setMigrateOrders] = useState(true);

  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const [isRollingBack, setIsRollingBack] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');

  const fetchStats = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
      setMigrationLogs([]);
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunMigration = async () => {
    if (
      !confirm(
        'VitePOS-ის მონაცემების მიგრაციის დაწყებამდე შეიქმნება სრული სარეზერვო ასლი (Snapshot). გსურთ გაგრძელება?'
      )
    ) {
      return;
    }

    setIsMigrating(true);
    setMigrationLogs(['🚀 მიგრაციის პროცესი დაიწყო...', '🛡️ იქმნება ავტომატური Snapshot ასლი...']);
    setIsSuccess(false);

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
              migrate_barcodes: migrateBarcodes,
              migrate_cost_prices: migrateCostPrices,
              migrate_shifts: migrateShifts,
              migrate_movements: migrateMovements,
              migrate_orders: migrateOrders,
            },
          }),
        }
      );

      const res = await resp.json();
      if (res && res.success && res.data) {
        setMigrationLogs((prev) => [
          ...prev,
          ...(res.data.logs || []),
          '🎉 მიგრაცია წარმატებით დასრულდა!',
        ]);
        setIsSuccess(true);
        showNotification('VitePOS მონაცემები წარმატებით გადმოვიდა!', 'success');
        fetchStats();
        // Refresh catalog in background
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
        showNotification('სისტემა წარმატებით დაბრუნდა წინა მდგომარეობაში!', 'success');
        fetchStats();
        syncCatalog();
      } else {
        showNotification('Rollback Error: ' + (res?.message || 'Unknown'), 'error');
      }
    } catch (e: any) {
      showNotification('Rollback Error: ' + e.message, 'error');
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>VitePOS ➔ Omni POS მონაცემების მიგრაციის ცენტრი</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider">
                  Safe 1-Click
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                პროდუქტების, შტრიხკოდების, თვითღირებულების, ცვლებისა და შეკვეთების სრული უსაფრთხო მიგრაცია
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-slate-800 dark:text-slate-200 text-xs">
          {/* Safety Notice Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                100% უსაფრთხო & შეუქცევადობის გარანტია (Pre-Snapshot Protection)
              </h3>
              <p className="text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed text-[11px]">
                მიგრაციის დაწყებამდე სისტემა ავტომატურად ინახავს Omni POS-ის არსებული პარამეტრების, ცვლებისა და შტრიხკოდების სრულ რეზერვს. თუ ოდესმე უკან დაბრუნება დაგჭირდებათ, 1 კლიკით შეძლებთ წინა მდგომარეობის აღდგენას!
              </p>
            </div>
          </div>

          {/* Discovery Stats Grid */}
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>აღმოჩენილი VitePOS მონაცემები ბაზაში:</span>
              <button
                type="button"
                onClick={fetchStats}
                disabled={loading}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>განახლება</span>
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center space-x-2">
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>მონაცემთა ბაზის სკანირება...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase">შტრიხკოდები</span>
                    <Tag className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {stats?.products_with_vtp_barcode || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">VitePOS Barcodes</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase">თვითღირებულება</span>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {stats?.products_with_vtp_cost || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Cost / Purchase Prices</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase">სალაროს ცვლები</span>
                    <History className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {stats?.cash_drawer_sessions || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Drawer Sessions / Shifts</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase">თანხის მოძრაობები</span>
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {stats?.cash_movements_count || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">In / Out / Drop Logs</div>
                </div>
              </div>
            )}
          </div>

          {/* Selectable Migration Scope */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="font-bold text-xs text-slate-900 dark:text-white">
              აირჩიეთ რა მონაცემების მიგრაცია გსურთ:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="checkbox"
                  checked={migrateBarcodes}
                  onChange={(e) => setMigrateBarcodes(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">პროდუქტების შტრიხკოდები</div>
                  <div className="text-[10px] text-slate-400">_vtp_barcode ➔ _barcode / _omni_barcode</div>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="checkbox"
                  checked={migrateCostPrices}
                  onChange={(e) => setMigrateCostPrices(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">თვითღირებულების ფასები</div>
                  <div className="text-[10px] text-slate-400">_vtp_cost_price ➔ _cost_price</div>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="checkbox"
                  checked={migrateShifts}
                  onChange={(e) => setMigrateShifts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">სალაროს ცვლები & სესიები</div>
                  <div className="text-[10px] text-slate-400">apbd_pos_cash_drawer ➔ omni_pos_shifts</div>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="checkbox"
                  checked={migrateMovements}
                  onChange={(e) => setMigrateMovements(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">უჯრის თანხის მოძრაობები (In/Out)</div>
                  <div className="text-[10px] text-slate-400">apbd_pos_cash_drawer_log ➔ omni_pos_cash_movements</div>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-500 transition-colors sm:col-span-2">
                <input
                  type="checkbox"
                  checked={migrateOrders}
                  onChange={(e) => setMigrateOrders(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">VitePOS-ის შეკვეთების მოლარეების მიბმა</div>
                  <div className="text-[10px] text-slate-400">_vtp_processed_by ➔ _omni_cashier_id & ჩეკის მონაცემები</div>
                </div>
              </label>
            </div>
          </div>

          {/* Migration Execution Logs */}
          {migrationLogs.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] space-y-1.5 border border-slate-800">
              <div className="font-bold text-slate-400 pb-1 border-b border-slate-800 flex items-center justify-between">
                <span>Execution Log</span>
                {isSuccess && <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> დასრულებულია</span>}
              </div>
              {migrationLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">{log}</div>
              ))}
            </div>
          )}

          {/* Rollback Section */}
          {stats?.available_snapshots && stats.available_snapshots.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>სისტემის უკან დაბრუნება (Rollback Snapshot-იდან):</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {stats.available_snapshots.length} ასლი ხელმისაწვდომია
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedSnapshot}
                  onChange={(e) => setSelectedSnapshot(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                >
                  {stats.available_snapshots.map((s) => (
                    <option key={s.snapshot_id} value={s.snapshot_id}>
                      {s.snapshot_id} — {s.created_at} ({s.size_kb} KB)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleRollback}
                  disabled={isRollingBack || !selectedSnapshot}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {isRollingBack ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>{isRollingBack ? 'აღდგენა...' : '↩️ Rollback აღდგენა'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="text-[11px] text-slate-500">
            {stats?.has_migratable_data ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                VitePOS მონაცემები ნაპოვნია და მზადაა იმპორტისთვის
              </span>
            ) : (
              <span className="text-slate-400">
                სკანირება დასრულებულია.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              {t('close', 'დახურვა')}
            </button>

            <button
              type="button"
              onClick={handleRunMigration}
              disabled={isMigrating}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isMigrating ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>
                {isMigrating
                  ? 'მიგრაცია მიმდინარეობს...'
                  : '🚀 VitePOS ➔ Omni მიგრაციის დაწყება (1-Click)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
