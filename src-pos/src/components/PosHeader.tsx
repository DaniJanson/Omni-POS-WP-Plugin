import React from 'react';
import { usePosStore } from '../store/usePosStore';
import { t } from '../utils/i18n';
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
} from 'lucide-react';

export const PosHeader: React.FC = () => {
  const {
    initData,
    isSyncing,
    syncCatalog,
    setOrdersModalOpen,
    theme,
    toggleTheme,
  } = usePosStore();

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
        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-500 dark:text-blue-300 active:scale-95 transition-all border border-slate-200 dark:border-slate-700/80 shadow-sm"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Sync Button */}
        <button
          onClick={() => syncCatalog(false)}
          disabled={isSyncing}
          title={t('sync_catalogue', 'Sync Catalogue')}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 border border-slate-200 dark:border-slate-700/80 transition-all disabled:opacity-50 text-slate-700 dark:text-slate-200 shadow-sm"
        >
          <RotateCw className={`w-3.5 h-3.5 text-blue-500 dark:text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{t('sync_catalogue', 'Sync')}</span>
        </button>

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

        {/* Cashier profile */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-600/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
            {initData?.cashier.name || t('cashier', 'Cashier')}
          </span>
        </div>

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
    </header>
  );
};
