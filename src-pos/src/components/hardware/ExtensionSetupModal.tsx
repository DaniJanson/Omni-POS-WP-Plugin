import React, { useState, useEffect } from 'react';
import { niceLabelClient } from '../../services/niceLabelClient';
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
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface ExtensionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtensionSetupModal: React.FC<ExtensionSetupModalProps> = ({ isOpen, onClose }) => {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
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
        setIsInstalled(installed);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestPrint = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await niceLabelClient.printBatch([
      {
        name: 'Omni Test Sample',
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

  const extensionPath = 'wp-content/plugins/omni-pos/extension/';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-scaleUp">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('extension_setup_title', 'Omni NiceLabel Print Extension')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('extension_setup_subtitle', '1-Click Silent Thermal Printing & NiceLabel Bridge')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Live Status Hero */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
              isInstalled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {isInstalled ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="text-xs font-black uppercase tracking-wider">
                  {isInstalled
                    ? t('extension_active', 'Chrome Extension Active')
                    : t('extension_not_installed', 'Extension Not Detected')}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {isInstalled
                    ? t('extension_ready_desc', 'Ready for direct silent printing to NiceLabel & thermal printers.')
                    : t('extension_missing_desc', 'Please install the extension on this browser to enable 1-click printing.')}
                </div>
              </div>
            </div>

            <button
              onClick={checkStatus}
              disabled={isChecking}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold transition-all disabled:opacity-50"
              title="Refresh status"
            >
              <RotateCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* If Installed: Test Print & Connected View */}
          {isInstalled ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('test_print_label', 'NiceLabel Communication Test')}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold">
                    Connected
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleTestPrint}
                  disabled={isTesting}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
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
            /* 3-Step Visual Installation Guide */
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {t('install_steps_title', 'Easy 3-Step Setup (takes 30 seconds)')}:
              </h3>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {t('step_1_title', 'Locate or Download Extension Folder')}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      The extension is located in your WordPress plugin directory:
                    </p>
                    <code className="block px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-900 font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold select-all">
                      {extensionPath}
                    </code>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {t('step_2_title', 'Open Chrome Extensions & Enable Developer Mode')}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      In your Chrome / Edge browser, go to <strong className="text-slate-700 dark:text-slate-200">chrome://extensions</strong> and toggle <strong className="text-blue-500">Developer mode</strong> in the top-right corner.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {t('step_3_title', 'Click "Load unpacked" & Select Folder')}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Click the <strong className="text-slate-700 dark:text-slate-200">Load unpacked</strong> button and select the <code className="text-blue-500 font-mono">extension</code> folder. This modal will automatically detect it!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            {isInstalled ? t('done', 'Done') : t('close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
