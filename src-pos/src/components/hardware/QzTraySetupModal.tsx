import React, { useState, useEffect } from 'react';
import { qzClient, type QzStatus } from '../../services/qzClient';
import { usePosStore } from '../../store/usePosStore';
import { t } from '../../utils/i18n';
import {
  Printer,
  CheckCircle2,
  AlertCircle,
  Download,
  Play,
  RotateCw,
  ExternalLink,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';

interface QzTraySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QzTraySetupModal: React.FC<QzTraySetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showNotification } = usePosStore();
  const [status, setStatus] = useState<QzStatus>(qzClient.getStatus());
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    const unsub = qzClient.onStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'connected') {
        setCurrentStep(4);
        setProgressPercent(100);
        setIsSettingUp(false);
        showNotification(t('qz_connected', 'Connected (Active)'), 'success');
        if (onSuccess) {
          setTimeout(onSuccess, 1000);
        }
      }
    });

    // Check status immediately
    qzClient.connect().catch(() => {});

    return () => unsub();
  }, [isOpen, onSuccess, showNotification]);

  // Polling loop when setup is clicked
  useEffect(() => {
    let interval: any = null;
    if (isSettingUp && status !== 'connected') {
      interval = setInterval(async () => {
        const ok = await qzClient.connect();
        if (ok) {
          clearInterval(interval);
        }
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSettingUp, status]);

  if (!isOpen) return null;

  const handleStartSetup = () => {
    setIsSettingUp(true);
    setCurrentStep(1);
    setProgressPercent(25);

    // 1. Try launching already installed QZ Tray via custom protocol
    qzClient.launchQzTray();

    // 2. Open official QZ Tray download portal
    const downloadUrl = 'https://qz.io/download/';
    window.open(downloadUrl, '_blank');

    // Simulate animated setup progression while polling
    setTimeout(() => {
      setCurrentStep(2);
      setProgressPercent(50);
    }, 1500);

    setTimeout(() => {
      setCurrentStep(3);
      setProgressPercent(75);
    }, 3500);
  };

  const handleManualRetry = async () => {
    setIsSettingUp(true);
    setCurrentStep(3);
    setProgressPercent(75);
    const ok = await qzClient.connect();
    if (!ok) {
      setTimeout(() => {
        setIsSettingUp(false);
      }, 1000);
    }
  };

  const isConnected = status === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t('qz_setup_title', 'QZ Tray Hardware Bridge')}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    isConnected
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {isConnected ? t('qz_connected', 'Connected') : t('qz_disconnected', 'Offline')}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('qz_setup_desc', 'Enable instant silent thermal receipt printing and cash drawer opening.')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Alert */}
          {isConnected ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-3 text-emerald-800 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <strong className="font-bold block text-sm">
                  {t('qz_connected', 'QZ Tray Bridge is Active & Ready!')}
                </strong>
                <span>{t('silent_print_desc', 'Direct silent printing and cash drawer control are fully operational.')}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start space-x-3 text-amber-900 dark:text-amber-300 text-xs">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-bold block text-sm">
                  {t('qz_not_running', 'QZ Tray Service is not detected')}
                </strong>
                <p className="text-amber-800/80 dark:text-amber-300/80">
                  {t('qz_running_guide', 'Click the Setup button below to download or launch QZ Tray automatically. It will run in your system tray.')}
                </p>
              </div>
            </div>
          )}

          {/* Animated 4-Step Progress Bar (When setup is active) */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('qz_install_launch_btn', '1-Click Auto Setup Progress')}</span>
              </span>
              <span className="font-mono text-blue-600 dark:text-blue-400">{progressPercent}%</span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Step badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
              <div
                className={`p-2 rounded-xl border flex items-center space-x-1.5 ${
                  currentStep >= 1
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <Download className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{t('qz_step_download', '1. Download')}</span>
              </div>

              <div
                className={`p-2 rounded-xl border flex items-center space-x-1.5 ${
                  currentStep >= 2
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <Play className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{t('qz_step_launch', '2. Launch')}</span>
              </div>

              <div
                className={`p-2 rounded-xl border flex items-center space-x-1.5 ${
                  currentStep >= 3
                    ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 flex-shrink-0 ${isSettingUp && !isConnected ? 'animate-spin' : ''}`} />
                <span className="truncate">{t('qz_step_connect', '3. Connect')}</span>
              </div>

              <div
                className={`p-2 rounded-xl border flex items-center space-x-1.5 ${
                  isConnected
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{t('qz_step_ready', '4. Ready')}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {!isConnected ? (
              <>
                <button
                  type="button"
                  onClick={handleStartSetup}
                  disabled={isSettingUp}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>{t('qz_install_launch_btn', '🚀 Setup & Launch QZ Tray (1-Click)')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualRetry}
                  disabled={isSettingUp}
                  className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isSettingUp ? 'animate-spin' : ''}`} />
                  <span>{t('reconnect_qz', 'Retry Connect')}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('continue_shift', 'All Set! Continue to POS')}</span>
              </button>
            )}
          </div>

          {/* External Links */}
          {!isConnected && (
            <div className="flex items-center justify-center space-x-4 pt-1 text-[11px] text-slate-400">
              <a
                href="https://qz.io/download/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-500 underline flex items-center gap-1 cursor-pointer"
              >
                <span>qz.io/download (Official)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <a
                href="https://github.com/qzind/tray/releases"
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-500 underline flex items-center gap-1 cursor-pointer"
              >
                <span>GitHub Releases</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
