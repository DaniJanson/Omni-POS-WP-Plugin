import React, { useState, useEffect } from 'react';
import { usePosStore } from '../../store/usePosStore';
import { t } from '../../utils/i18n';
import {
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Download,
  GitBranch,
  Key,
  Save,
  ExternalLink,
  ShieldCheck,
  Zap,
  Tag,
  Calendar,
} from 'lucide-react';

export const AdminUpdatesView: React.FC = () => {
  const {
    updateInfo,
    isCheckingUpdates,
    isInstallingUpdate,
    checkForUpdates,
    saveUpdateSettings,
    installPluginUpdate,
  } = usePosStore();

  const [repoInput, setRepoInput] = useState<string>('DaniJanson/Omni-POS-WP-Plugin');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isSavingRepo, setIsSavingRepo] = useState<boolean>(false);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  useEffect(() => {
    if (updateInfo?.repo) {
      setRepoInput(updateInfo.repo);
    }
  }, [updateInfo]);

  const handleSaveRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRepo(true);
    await saveUpdateSettings(repoInput, tokenInput);
    setIsSavingRepo(false);
  };

  const handleCheckNow = () => {
    checkForUpdates(true);
  };

  const currentVer = updateInfo?.current_version || window.omniPosConfig?.version || '1.0.0';
  const latestVer = updateInfo?.latest_version || currentVer;
  const hasUpdate = updateInfo?.has_update ?? false;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>{t('system_updates', 'System Updates & Releases')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('updates_desc', 'Check GitHub for new plugin versions, view changelog and perform 1-click in-place updates.')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCheckNow}
          disabled={isCheckingUpdates}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
          <span>{isCheckingUpdates ? t('checking_updates', 'Checking GitHub...') : t('check_updates_btn', 'Check for Updates')}</span>
        </button>
      </div>

      {/* Main Status Hero Card */}
      <div
        className={`p-6 rounded-3xl border shadow-sm transition-all ${
          hasUpdate
            ? 'bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-purple-500/10 border-indigo-200 dark:border-indigo-800/60'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
                hasUpdate
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/30'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {hasUpdate ? <Download className="w-7 h-7 animate-bounce" /> : <CheckCircle2 className="w-7 h-7" />}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {hasUpdate ? t('update_available', 'New Version Available!') : t('up_to_date', 'Omni POS is Up to Date!')}
                </h2>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    hasUpdate
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {hasUpdate ? `v${latestVer}` : 'v' + currentVer}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {hasUpdate
                  ? `Version v${latestVer} is ready for installation. Your current active version is v${currentVer}.`
                  : t('up_to_date_desc', 'You are running the latest official version.')}
              </p>

              {/* Version Comparison Pills */}
              <div className="flex items-center gap-3 mt-3 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold font-mono">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {t('current_version', 'Current')}: <strong>v{currentVer}</strong>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold font-mono">
                  <Tag className="w-3 h-3 text-indigo-500" />
                  {t('latest_version', 'Latest')}: <strong>v{latestVer}</strong>
                </span>

                {updateInfo?.published_at && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    {new Date(updateInfo.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 1-Click Update Trigger */}
          {hasUpdate && (
            <button
              type="button"
              onClick={installPluginUpdate}
              disabled={isInstallingUpdate}
              className="w-full md:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 active:scale-95 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isInstallingUpdate ? (
                <RotateCw className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 text-amber-300" />
              )}
              <span>
                {isInstallingUpdate
                  ? t('installing_update', 'Downloading & Upgrading...')
                  : t('install_update_btn', '🚀 Install Update Now (1-Click)')}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Release Notes / Changelog */}
      {updateInfo?.changelog && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>{t('release_notes', 'Release Notes & Changelog')}</span>
              {updateInfo.release_name && (
                <span className="text-xs text-slate-400 font-normal">({updateInfo.release_name})</span>
              )}
            </h3>

            {updateInfo.github_url && (
              <a
                href={updateInfo.github_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs font-mono whitespace-pre-line text-slate-800 dark:text-slate-200 max-h-72 overflow-y-auto leading-relaxed custom-scrollbar">
            {updateInfo.changelog}
          </div>
        </div>
      )}

      {/* GitHub Repository Configuration Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('github_repo_config', 'GitHub Repository Configuration')}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Configure which GitHub repository releases Omni POS should monitor.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveRepo} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('repo_slug_label', 'GitHub Repository (owner/repo)')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. username/omni-pos"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <GitBranch className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('github_token_label', 'Personal Access Token (For Private Repositories)')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Optional (ghp_...)"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSavingRepo}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingRepo ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{t('save_repo_btn', 'Save Repo Settings')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
