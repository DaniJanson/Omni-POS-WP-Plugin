import React, { useState, useEffect } from 'react';
import { niceLabelClient } from '../../services/niceLabelClient';
import { posApi } from '../../services/api';
import { t } from '../../utils/i18n';
import {
  Puzzle,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCw,
  X,
  Zap,
  Copy,
  Check,
  FolderArchive,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ExtensionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtensionSetupModal: React.FC<ExtensionSetupModalProps> = ({ isOpen, onClose }) => {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const checkStatus = async () => {
    setIsChecking(true);
    const installed = await niceLabelClient.isExtensionInstalled(800);
    setIsInstalled(installed);
    setIsChecking(false);
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      const interval = setInterval(async () => {
        const installed = await niceLabelClient.isExtensionInstalled(500);
        if (installed) {
          setIsInstalled(true);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const resp = await fetch(
        (window.omniPosConfig?.restUrl || '/wp-json/') + 'omni-pos/v1/admin/extension/download',
        {
          headers: {
            'X-WP-Nonce': window.omniPosConfig?.nonce || '',
          },
        }
      );
      const data = await resp.json();
      if (data && data.download_url) {
        // Trigger download
        const a = document.createElement('a');
        a.href = data.download_url;
        a.download = 'omni-nicelabel-print-extension.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert('Could not download extension zip.');
      }
    } catch (e: any) {
      alert('Download error: ' + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await niceLabelClient.printBatch([
      {
        name: 'Omni NiceLabel Sample',
        priceFormatted: '25.00 ₾',
        price: 25.0,
        barcode: '200000012345',
        sku: 'TEST-SKU',
        quantity: 1,
      },
    ]);
    setIsTesting(false);
    setTestResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 text-white">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t('extension_setup_title', 'Omni NiceLabel Print Extension')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold uppercase">
                  1-Click Bridge
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('extension_setup_subtitle', 'Direct silent label printing to NiceLabel & thermal printers.')}
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Live Status Hero Banner */}
          <div
            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
              isInstalled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 shadow-md shadow-emerald-500/10'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800/80 text-slate-900 dark:text-white'
            }`}
          >
            <div className="flex items-center space-x-3.5">
              {isInstalled ? (
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6 animate-scaleUp" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
                  <Puzzle className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <span>
                    {isInstalled
                      ? t('extension_active', '🎉 Extension Active & Connected!')
                      : t('extension_not_installed', 'Chrome Extension Ready for Setup')}
                  </span>
                  {isInstalled && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                      v1.0.0
                    </span>
                  )}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {isInstalled
                    ? t('extension_ready_desc', 'Ready for direct silent printing to NiceLabel & thermal printers.')
                    : t('extension_missing_desc', 'Follow the 3 quick steps below to activate 1-click printing.')}
                </div>
              </div>
            </div>

            <button
              onClick={checkStatus}
              disabled={isChecking}
              className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              title="Refresh status"
            >
              <RotateCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* If Installed: Test Print & Connected Confirmation */}
          {isInstalled ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {t('test_print_label', 'NiceLabel Communication Test')}
                  </span>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold">
                    Connected to Browser
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleTestPrint}
                  disabled={isTesting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isTesting ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 text-amber-300" />
                  )}
                  <span>{isTesting ? t('sending_test', 'Sending to NiceLabel...') : t('send_test_btn', 'Send Test Label to NiceLabel')}</span>
                </button>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium ${
                      testResult.success
                        ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-100/70 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 3-Step Simple Installation Guide */
            <div className="space-y-4">
              {/* Step 1: 1-Click Download Button */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        ჩამოტვირთეთ Extension და ამოაარქივეთ
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        დააჭირეთ ღილაკს, გადმოწერეთ ZIP ფაილი და ამოშალეთ საქაღალდეში.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={isDownloading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDownloading ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isDownloading ? 'გადმოწერა...' : '⬇️ ჩამოტვირთეთ Extension (.ZIP)'}</span>
                </button>
              </div>

              {/* Step 2: Open chrome://extensions & toggle Developer mode */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      გახსენით Chrome Extensions და ჩართეთ Developer mode
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      ბრაუზერის მისამართების ზოლში ჩაწერეთ <strong className="text-blue-500">chrome://extensions</strong> და მარჯვენა ზედა კუთხეში ჩართეთ <strong className="text-indigo-500">Developer mode</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'დაკოპირდა!' : '📋 დააკოპირეთ ბმული: chrome://extensions'}</span>
                  </button>
                </div>
              </div>

              {/* Step 3: Click Load unpacked & select folder */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    დააჭირეთ "Load unpacked" და მონიშნეთ საქაღალდე
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    მარცხენა ზედა კუთხეში დააჭირეთ <strong className="text-slate-800 dark:text-slate-200">Load unpacked (ჩატვირთვა საქაღალდიდან)</strong> და აირჩიეთ ამოარქივებული საქაღალდე. სისტემა ავტომატურად დაუკავშირდება!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/70 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            {isInstalled ? t('done', 'Done') : t('close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
