import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePosStore } from '../store/usePosStore';
import { qzClient, type QzStatus } from '../services/qzClient';
import { niceLabelClient } from '../services/niceLabelClient';
import { QzTraySetupModal } from './hardware/QzTraySetupModal';
import { ExtensionSetupModal } from './hardware/ExtensionSetupModal';
import { t } from '../utils/i18n';
import { formatPrice } from '../utils/format';
import { LanguageSelector } from './LanguageSelector';
import { CashierPinModal } from './shifts/CashierPinModal';
import {
  RotateCw,
  History,
  Maximize2,
  LogOut,
  User,
  Zap,
  Wifi,
  Sun,
  Moon,
  Lock,
  CircleDollarSign,
  ChevronDown,
  PlusCircle,
  MinusCircle,
  FileSpreadsheet,
  CheckCircle2,
  Unlock,
  Coins,
  Printer,
  Puzzle,
} from 'lucide-react';

export const ShiftMenu: React.FC = () => {
  const {
    currentShift,
    initData,
    setIsCloseShiftModalOpen,
    setIsOpenShiftModalOpen,
    setIsCashMovementModalOpen,
  } = usePosStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOpenShift = currentShift && currentShift.status === 'open';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          if (!isOpenShift) {
            setIsOpenShiftModalOpen(true);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm active:scale-95 ${
          isOpenShift
            ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60'
            : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/60 animate-pulse'
        }`}
        title={isOpenShift ? 'Shift Management & Close Shift' : 'Open Register Shift'}
      >
        <Coins className="w-3.5 h-3.5" />
        <span>{isOpenShift ? `Shift #${currentShift.id}` : t('open_shift', 'Open Shift')}</span>
        {isOpenShift && <ChevronDown className="w-3 h-3 opacity-70" />}
      </button>

      {isOpen && isOpenShift && (
        <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-3.5 overflow-hidden animate-fadeIn text-xs">
          {/* Shift Header & Balance */}
          <div className="pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Shift #{currentShift.id}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentShift.opened_at ? currentShift.opened_at.slice(11, 16) : ''}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Expected in Drawer:</span>
              <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                {formatPrice(currentShift.expected_cash, initData?.store)}
              </span>
            </div>
          </div>

          {/* Action List */}
          <div className="space-y-1.5">
            {/* Primary Action: Close Shift */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsCloseShiftModalOpen(true);
              }}
              className="w-full px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-between shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5" />
                <span>{t('close_shift', 'Close Shift & Z-Report')}</span>
              </div>
              <span className="text-[10px] bg-purple-700 px-1.5 py-0.5 rounded font-mono">Z</span>
            </button>

            {/* Cash In */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsCashMovementModalOpen(true);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('cash_in', 'Cash In / Deposit')}</span>
            </button>

            {/* Cash Out */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsCashMovementModalOpen(true);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <MinusCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('cash_out', 'Cash Out / Expense')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const PosHeader: React.FC = () => {
  const {
    initData,
    isSyncing,
    syncCatalog,
    setOrdersModalOpen,
    theme,
    toggleTheme,
    initialize,
    adminSettings,
  } = usePosStore();

  const isDirectControl = (adminSettings?.inventory_mode || window.omniPosConfig?.inventoryMode) === 'omni_pos';
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isQzModalOpen, setIsQzModalOpen] = useState(false);
  const [qzStatus, setQzStatus] = useState<QzStatus>(qzClient.getStatus());
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(true);

  const checkExtension = useCallback(async () => {
    const installed = await niceLabelClient.isExtensionInstalled(600);
    setIsExtensionInstalled(installed);
  }, []);

  useEffect(() => {
    const unsub = qzClient.onStatusChange((s) => setQzStatus(s));
    checkExtension();
    return () => unsub();
  }, [checkExtension]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleLogout = () => {
    if (window.omniPosConfig?.logoutUrl) {
      window.location.href = window.omniPosConfig.logoutUrl;
    } else {
      window.location.href = '/wp-login.php';
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800/80 px-4 flex items-center justify-between text-slate-800 dark:text-white select-none z-20 shadow-sm transition-colors">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-black/5 dark:ring-white/10">
          <Zap className="w-5 h-5 text-white fill-white/30" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              {initData?.store.name || 'Omni POS'}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              Ultra Fast
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Point of Sale Register</p>
        </div>
      </div>

      {/* Center status indicators */}
      <div className="hidden md:flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          <span>{t('offline_ready', 'Offline Ready (IndexedDB)')}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        {/* Sync Button */}
        <button
          onClick={() => syncCatalog()}
          disabled={isSyncing}
          title={t('sync_catalogue', 'Sync Product Catalogue')}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 border border-slate-200 dark:border-slate-700/80 transition-all text-slate-700 dark:text-slate-200 shadow-sm disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 text-blue-500 dark:text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isSyncing ? t('syncing', 'Syncing...') : t('sync_catalogue', 'Sync')}
          </span>
        </button>

        {/* Shift / Register Management Button & Dropdown */}
        <ShiftMenu />

        {/* Language Selector */}
        <LanguageSelector compact={true} />

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          title="Toggle Light/Dark Theme"
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 active:scale-95 transition-all border border-slate-200 dark:border-slate-700/80 shadow-sm cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* NiceLabel Extension Setup Prompt (Shown ONLY to Admin if extension not detected on this browser) */}
        {Boolean(initData?.cashier?.capabilities?.manage_pos || window.omniPosConfig?.isAdmin) && !isExtensionInstalled && (
          <button
            type="button"
            onClick={() => setIsExtensionModalOpen(true)}
            title="Omni NiceLabel Print Extension is not installed on this browser. Click to setup."
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all animate-pulse active:scale-95 cursor-pointer"
          >
            <Puzzle className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t('install_extension_btn', 'Install Extension')}</span>
          </button>
        )}

        {/* QZ Tray Hardware Bridge Status Button (Visible ONLY to Managers / Admins) */}
        {Boolean(initData?.cashier?.capabilities?.manage_pos || window.omniPosConfig?.isAdmin) && (
          <button
            onClick={() => setIsQzModalOpen(true)}
            title={`QZ Tray: ${qzStatus === 'connected' ? 'Connected (Silent Printing Active)' : 'Offline (Click to Setup)'}`}
            className={`p-2 rounded-lg relative active:scale-95 transition-all border shadow-sm cursor-pointer ${
              qzStatus === 'connected'
                ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span
              className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                qzStatus === 'connected'
                  ? 'bg-emerald-500 shadow-sm'
                  : 'bg-amber-500 animate-pulse'
              }`}
            />
          </button>
        )}

        {/* History / Orders Button */}
        <button
          onClick={() => setOrdersModalOpen(true)}
          title={t('history', 'Recent Orders')}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 border border-slate-200 dark:border-slate-700/80 transition-all text-slate-700 dark:text-slate-200 shadow-sm"
        >
          <History className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="hidden sm:inline">{t('history', 'History')}</span>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Quick PIN Switch button (Only in Direct Control Mode) */}
        {isDirectControl && (
          <button
            onClick={() => setIsPinModalOpen(true)}
            title="Switch Cashier with PIN"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 active:scale-95 transition-all border border-slate-200 dark:border-slate-700/80 shadow-sm"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Cashier profile & Admin Hub Switcher (Only active when in Direct Control Mode) */}
        <button
          onClick={() => {
            if (isDirectControl && (initData?.cashier.capabilities.manage_pos || window.omniPosConfig?.isAdmin)) {
              usePosStore.getState().setActiveView('admin');
            }
          }}
          title={
            (isDirectControl && (initData?.cashier.capabilities.manage_pos || window.omniPosConfig?.isAdmin))
              ? 'Click to open Omni POS Admin Hub'
              : (initData?.cashier.name || t('cashier', 'Cashier'))
          }
          className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left shadow-sm ${
            isDirectControl ? 'hover:bg-slate-200 dark:hover:bg-slate-700/80 active:scale-95 cursor-pointer group' : 'cursor-default'
          } transition-all`}
        >
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-600/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[100px] truncate leading-tight">
              {initData?.cashier.name || t('cashier', 'Cashier')}
            </span>
            {isDirectControl && (initData?.cashier.capabilities.manage_pos || window.omniPosConfig?.isAdmin) && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium leading-none flex items-center gap-0.5">
                🛡️ Admin Hub
              </span>
            )}
          </div>
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={handleFullscreen}
          title={t('fullscreen', 'Fullscreen')}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 active:scale-95 transition-all border border-slate-200 dark:border-slate-700/80 shadow-sm"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Exit / Logout */}
        <button
          onClick={handleLogout}
          title={t('logout', 'Logout')}
          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 active:scale-95 transition-all border border-red-200 dark:border-red-500/20 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Cashier PIN Switch Modal */}
      <CashierPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onCashierSwitched={() => {
          initialize();
        }}
      />

      {/* QZ Tray Setup Modal */}
      <QzTraySetupModal
        isOpen={isQzModalOpen}
        onClose={() => setIsQzModalOpen(false)}
      />

      {/* NiceLabel Chrome Extension Setup Modal */}
      <ExtensionSetupModal
        isOpen={isExtensionModalOpen}
        onClose={() => {
          setIsExtensionModalOpen(false);
          checkExtension();
        }}
      />
    </header>
  );
};

