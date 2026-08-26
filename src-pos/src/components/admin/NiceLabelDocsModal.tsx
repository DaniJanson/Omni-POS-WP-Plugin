import React, { useState } from 'react';
import { t } from '../../utils/i18n';
import { niceLabelClient } from '../../services/niceLabelClient';
import { usePosStore } from '../../store/usePosStore';
import {
  X,
  BookOpen,
  Copy,
  Check,
  Zap,
  Server,
  FileCode,
  Tag,
  Printer,
  ChevronRight,
  ExternalLink,
  RotateCw,
  Sparkles,
  Layers,
  Code2,
  Download,
  FolderArchive,
  PlayCircle,
} from 'lucide-react';

interface NiceLabelDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NiceLabelDocsModal: React.FC<NiceLabelDocsModalProps> = ({ isOpen, onClose }) => {
  const { showNotification } = usePosStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'automation' | 'template' | 'json' | 'troubleshooting'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showNotification(t('copied', 'Copied to clipboard!'), 'success');
  };

  const handleDownloadPackage = async () => {
    setIsDownloading(true);
    try {
      const resp = await fetch(
        (window.omniPosConfig?.restUrl || '/wp-json/') + 'omni-pos/v1/admin/nicelabel/download',
        {
          headers: {
            'X-WP-Nonce': window.omniPosConfig?.nonce || '',
          },
        }
      );
      const data = await resp.json();
      if (data && data.download_url) {
        const a = document.createElement('a');
        a.href = data.download_url;
        a.download = 'omni-nicelabel-ready-package.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        showNotification('მზა NiceLabel პაკეტი ჩამოიტვირთა!', 'success');
      } else {
        alert('Could not download NiceLabel package.');
      }
    } catch (e: any) {
      alert('Download error: ' + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    try {
      const res = await niceLabelClient.printBatch([
        {
          name: 'Omni NiceLabel Doc Sample',
          priceFormatted: '19.99 ₾',
          price: 19.99,
          barcode: '200000088990',
          sku: 'DOCS-SAMPLE',
          quantity: 1,
          category: 'Documentation',
        },
      ]);
      if (res.success) {
        showNotification(res.message, 'success');
      } else {
        showNotification('NiceLabel Error: ' + res.message, 'error');
      }
    } catch (e: any) {
      showNotification('Error: ' + e.message, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const sampleJson = JSON.stringify(
    {
      template: 'product_label.nlbl',
      printer: 'TSC TE200',
      labels: [
        {
          ProductName: 'Adidas Sneakers Pro',
          Price: '149.00 ₾',
          PriceRaw: 149.0,
          Barcode: '200000012345',
          SKU: 'ADI-PRO-42',
          Quantity: 2,
          Category: 'Footwear',
          StoreName: 'Omni Store',
          Date: '2026-08-26',
        },
      ],
      timestamp: '2026-08-26T19:00:00.000Z',
    },
    null,
    2
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>NiceLabel & Omni POS კონფიგურაციის გზამკვლევი</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider">
                  Official Guide
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                NiceLabel Automation-ისა და .nlbl შაბლონების გამართვის სრული ინსტრუქცია
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

        {/* 1-Click Ready Solution Download Banner */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <FolderArchive className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-xs flex items-center gap-1.5">
                <span>📦 მზა კონფიგურაციის პაკეტი (100% აწყობილი)</span>
                <span className="text-[10px] px-2 py-0.2 bg-amber-400 text-slate-900 font-black rounded-full uppercase">
                  რეკომენდებული
                </span>
              </div>
              <p className="text-[11px] text-white/90 mt-0.5">
                ჩამოტვირთეთ მზა <code className="bg-black/20 px-1 py-0.5 rounded font-mono">.misx</code> Solution და <code className="bg-black/20 px-1 py-0.5 rounded font-mono">.nlbl</code> შაბლონი (ხელით აწყობა აღარ დაგჭირდებათ).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadPackage}
            disabled={isDownloading}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-indigo-900 font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 shrink-0 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isDownloading ? 'გადმოწერა...' : '⬇️ მზა Solution-ის ჩამოტვირთვა (.ZIP)'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-2 overflow-x-auto bg-slate-50/40 dark:bg-slate-800/20 custom-scrollbar">
          {[
            { id: 'overview', label: '1. მზა ფაილების გახსნა (10 წამში)', icon: Sparkles },
            { id: 'automation', label: '2. ხელით გამართვა (Manual Setup)', icon: Server },
            { id: 'template', label: '3. შაბლონის ცვლადები (.nlbl)', icon: Tag },
            { id: 'json', label: '4. JSON სტრუქტურა', icon: Code2 },
            { id: 'troubleshooting', label: '5. პრობლემების მოგვარება', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 text-xs font-bold whitespace-nowrap border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-slate-800 dark:text-slate-200 text-xs">
          {/* TAB 1: OVERVIEW & 1-CLICK FAST TRACK */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 space-y-2">
                <div className="font-bold text-sm flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>როგორ გავუშვათ მზა ფაილი 3 ნაბიჯში (ხელით აწყობის გარეშე):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed pt-1">
                  <li>დააჭირეთ ზემოთ ლურჯ ღილაკს <strong>[ ⬇️ მზა Solution-ის ჩამოტვირთვა (.ZIP) ]</strong> და ამოაარქივეთ.</li>
                  <li>NiceLabel Automation Builder-ში დააჭირეთ <strong>File ➔ Open</strong> და აირჩიეთ ფაილი: <code className="bg-emerald-100 dark:bg-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">Omni_POS_NiceLabel_Automation.misx</code>.</li>
                  <li>დააჭირეთ ზედა მენიუში <strong>Start Service</strong> (ან Run Preview).</li>
                </ol>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                  🎉 მზადაა! Automation უკვე 100%-ით გაწერილია და მზადაა ბეჭდვისთვის!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center">1</div>
                  <div className="font-bold text-slate-900 dark:text-white">Omni Extension</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    ბრაუზერიდან აგზავნის JSON პაკეტს ლოკალურ HTTP პორტზე (გვერდს უვლის CORS შეზღუდვებს).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center">2</div>
                  <div className="font-bold text-slate-900 dark:text-white">NiceLabel Automation</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    იღებს JSON-ს, ამოიკითხავს ცვლადებს და ხსნის მითითებულ <code className="font-mono text-indigo-500">.nlbl</code> შაბლონს.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center">3</div>
                  <div className="font-bold text-slate-900 dark:text-white">თერმოპრინტერი</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    იბეჭდება ზუსტი რაოდენობის სტიკერები (მაგ. TSC, Zebra, Xprinter, Godex).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUTOMATION */}
          {activeTab === 'automation' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" />
                <span>NiceLabel Automation Builder-ის ხელით გამართვა (HTTP Trigger)</span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <div className="font-bold text-xs text-blue-600 dark:text-blue-400">
                    ნაბიჯი 1: Trigger-ის დამატება
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    გახსენით <strong>NiceLabel Automation Builder</strong> ➔ დააჭირეთ <strong>Add Trigger</strong> ➔ აირჩიეთ <strong>HTTP Server</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    ნაბიჯი 2: პორტისა და მისამართის მითითება
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span><strong>Port:</strong> <code className="text-blue-500 font-bold">56424</code></span>
                      <button
                        onClick={() => handleCopy('56424', 'port')}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] font-bold"
                      >
                        {copiedKey === 'port' ? 'დაკოპირდა!' : 'კოპირება'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span><strong>URL Path:</strong> <code className="text-indigo-500 font-bold">/print</code></span>
                      <button
                        onClick={() => handleCopy('/print', 'path')}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] font-bold"
                      >
                        {copiedKey === 'path' ? 'დაკოპირდა!' : 'კოპირება'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <div className="font-bold text-xs text-purple-600 dark:text-purple-400">
                    ნაბიჯი 3: Action-ების დამატება (Filter Data & Open and Print)
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                    <li>Trigger Actions-ში დაამატეთ <strong>Use Data Filter</strong> (Data Source: <code className="font-bold">Use data received by the trigger</code>).</li>
                    <li>დააჭირეთ <strong>[ + Add ]</strong> Filter ➔ შექმენით JSON Filter სახელად <code className="font-bold">Omni_JSON_Filter</code>.</li>
                    <li>შემდეგ დაამატეთ <strong>Open Document and Print</strong>.</li>
                    <li>მიუთითეთ თქვენი შაბლონის ფაილის გზა (მაგ. <code className="text-slate-800 dark:text-slate-200 font-mono">product_label.nlbl</code>).</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEMPLATE VARIABLES */}
          {activeTab === 'template' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                <span>NiceLabel Designer (.nlbl) შაბლონის ცვლადები</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ჩვენს მზა <code className="font-bold text-indigo-500">product_label.nlbl</code> შაბლონში ეს ცვლადები უკვე ჩაშენებულია:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: 'Barcode', type: 'Text / Code128', desc: 'პროდუქტის შტრიხკოდი (Barcode)' },
                  { name: 'ProductName', type: 'Text', desc: 'პროდუქტის სრული დასახელება' },
                  { name: 'Price', type: 'Text (12.50 ₾)', desc: 'ფორმატირებული ფასი ვალუტის სიმბოლოთი' },
                  { name: 'PriceRaw', type: 'Number (12.5)', desc: 'სუფთა რიცხვითი ფასი' },
                  { name: 'SKU', type: 'Text', desc: 'პროდუქტის არტიკული (SKU)' },
                  { name: 'Quantity', type: 'Number', desc: 'ამოსაბეჭდი სტიკერების რაოდენობა' },
                  { name: 'Category', type: 'Text', desc: 'პროდუქტის კატეგორია' },
                  { name: 'StoreName', type: 'Text', desc: 'მაღაზიის სახელი' },
                  { name: 'Date', type: 'Date/Text', desc: 'ბეჭდვის თარიღი' },
                ].map((v) => (
                  <div
                    key={v.name}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">{v.name}</code>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                          {v.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{v.desc}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(v.name, v.name)}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="Copy Variable Name"
                    >
                      {copiedKey === v.name ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: JSON STRUCTURE */}
          {activeTab === 'json' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-purple-500" />
                  <span>Omni POS-იდან გაგზავნილი JSON Payload-ის ნიმუში</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(sampleJson, 'sampleJson')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  {copiedKey === 'sampleJson' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'sampleJson' ? 'დაკოპირდა!' : 'JSON-ის კოპირება'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed custom-scrollbar select-text">
                {sampleJson}
              </pre>
            </div>
          )}

          {/* TAB 5: TROUBLESHOOTING */}
          {activeTab === 'troubleshooting' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>ხშირად დასმული კითხვები & პრობლემების მოგვარება</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  ❓ რა ვქნა, თუ ბეჭდვისას მიწერს "Could not connect to NiceLabel"?
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  დარწმუნდით, რომ Automation Builder-ში გაშვებულია სერვისი (Start Service) და უსმენს პორტს (<code className="font-mono text-blue-500">56424</code>).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  ❓ როგორ დავრწმუნდე, რომ Omni Extension აყენია?
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  გადადით <code className="font-mono text-indigo-500">chrome://extensions</code>-ზე, ჩართეთ Developer mode და მონიშნეთ Omni POS-ის Extension საქაღალდე. Omni POS-ის ჰედერში გამოჩნდება მწვანე სტატუსი.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadPackage}
              disabled={isDownloading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>⬇️ მზა Solution (.ZIP)</span>
            </button>

            <button
              type="button"
              onClick={handleTestPrint}
              disabled={isTesting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isTesting ? <RotateCw className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
              <span>{isTesting ? 'იგზავნება...' : '🏷️ სატესტო ბეჭდვა'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            {t('close', 'დახურვა')}
          </button>
        </div>
      </div>
    </div>
  );
};
