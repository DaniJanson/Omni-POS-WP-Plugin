import React from 'react';
import { usePosStore } from '../store/usePosStore';
import { t } from '../utils/i18n';
import { RefreshCw, Database } from 'lucide-react';

export const SyncProgressModal: React.FC = () => {
  const { isSyncing, syncProgress } = usePosStore();

  if (!isSyncing || !syncProgress) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0f172a] border border-blue-500/30 rounded-2xl shadow-2xl p-6 text-center text-slate-100 animate-in zoom-in-95 duration-150">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
          <Database className="w-7 h-7 animate-pulse" />
        </div>

        <h3 className="font-bold text-base text-white mb-1">{t('sync_catalogue', 'Synchronizing Catalogue')}</h3>
        <p className="text-xs text-slate-400 mb-4">{syncProgress.message}</p>

        {/* Progress Bar */}
        {syncProgress.total > 0 && (
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-3 border border-slate-700">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (syncProgress.current / syncProgress.total) * 100)}%`,
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400 font-mono">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
          <span>Storing into Dexie IndexedDB local memory...</span>
        </div>
      </div>
    </div>
  );
};
