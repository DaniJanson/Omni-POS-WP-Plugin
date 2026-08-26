import React, { useState, useMemo, useEffect } from 'react';
import { t } from '../../utils/i18n';
import { niceLabelClient } from '../../services/niceLabelClient';
import { usePosStore } from '../../store/usePosStore';
import { generateCode128Bars } from '../../utils/barcodeSvg';
import type { Product } from '../../types';
import {
  X,
  Printer,
  Barcode as BarcodeIcon,
  Zap,
  Sliders,
  Eye,
  Layers,
  Sparkles,
  RotateCw,
} from 'lucide-react';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  products?: Product[];
  currency: string;
  storeName: string;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  product,
  products = [],
  currency,
  storeName: initialStoreName,
}) => {
  const { initData, showNotification } = usePosStore();

  // Selected items to print
  const itemsToPrint: Product[] = useMemo(() => {
    if (products.length > 0) return products;
    if (product) return [product];
    return [];
  }, [product, products]);

  // Label Customizer State
  const [labelCount, setLabelCount] = useState<number>(4);
  const [labelSize, setLabelSize] = useState<'40x30' | '50x30' | '58x40' | '30x20'>('40x30');
  const [customStoreName, setCustomStoreName] = useState<string>(initialStoreName || 'Omni POS');
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showProductName, setShowProductName] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showSku, setShowSku] = useState<boolean>(true);
  const [showBarcodeNumber, setShowBarcodeNumber] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isExtInstalled, setIsExtInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      niceLabelClient.isExtensionInstalled(500).then(setIsExtInstalled);
    }
  }, [isOpen]);

  if (!isOpen || itemsToPrint.length === 0) return null;

  const targetProduct = itemsToPrint[0];
  const barcodeValue = targetProduct.barcode || targetProduct.sku || targetProduct.id.toString();

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleDirectPrint = async () => {
    setIsPrinting(true);
    try {
      const itemsPayload = itemsToPrint.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        priceFormatted: `${currency}${p.price.toFixed(2)}`,
        barcode: p.barcode || p.sku || p.id.toString(),
        sku: p.sku || '',
        quantity: labelCount,
        category: p.categories?.[0]?.name || '',
      }));

      const res = await niceLabelClient.printBatch(
        itemsPayload,
        {
          printer: initData?.settings?.label_printer,
          template: 'product_label.nlbl',
        },
        customStoreName
      );

      if (res && res.success) {
        showNotification(t('test_print_sent', `Sent ${labelCount * itemsToPrint.length} labels to NiceLabel printer!`), 'success');
        onClose();
      } else {
        showNotification(res ? res.message : 'Print failed', 'error');
      }
    } catch (err: any) {
      console.error('Direct Label Print failed:', err);
      showNotification('Print Error: ' + (err.message || 'Failed'), 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  // Dimensions based on size
  const sizeStyles = {
    '40x30': 'w-48 h-36',
    '50x30': 'w-56 h-36',
    '58x40': 'w-64 h-44',
    '30x20': 'w-36 h-28',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 font-bold">
              <BarcodeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t('barcode_labels', 'Barcode & Label Designer')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {itemsToPrint.length} {itemsToPrint.length === 1 ? 'Product' : 'Products'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {itemsToPrint.length === 1 ? targetProduct.name : `${itemsToPrint.length} items selected for batch printing`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2-Column Grid (Left: Visual Controls, Right: Live Preview) */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 overflow-y-auto flex-1">
          {/* Left Column: Customizer Controls (5 cols) */}
          <div className="md:col-span-5 p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/40 overflow-y-auto">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Sliders className="w-4 h-4 text-blue-500" />
              <span>{t('label_customizer', 'Label Content & Dimensions')}</span>
            </div>

            {/* Label Size & Copies */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('label_size', 'Sticker Size')}
                </label>
                <select
                  value={labelSize}
                  onChange={(e) => setLabelSize(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="40x30">40 × 30 mm (Standard)</option>
                  <option value="50x30">50 × 30 mm (Wide)</option>
                  <option value="58x40">58 × 40 mm (Large)</option>
                  <option value="30x20">30 × 20 mm (Mini)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('number_of_copies', 'Copies per Item')}
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={labelCount}
                    onChange={(e) => setLabelCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {itemsToPrint.length === 1 && targetProduct.stock_quantity && targetProduct.stock_quantity > 0 && (
                    <button
                      type="button"
                      onClick={() => setLabelCount(Math.max(1, Math.floor(targetProduct.stock_quantity || 1)))}
                      title="Set copies equal to current stock"
                      className="px-2 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap hover:bg-slate-300"
                    >
                      Stock ({targetProduct.stock_quantity})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Elements Toggle Checklist */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {t('visible_fields', 'Visible Elements')}
              </span>

              {/* Store Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showStoreName}
                    onChange={(e) => setShowStoreName(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {t('store_name', 'Store Name Header')}
                  </span>
                </label>
                {showStoreName && (
                  <input
                    type="text"
                    value={customStoreName}
                    onChange={(e) => setCustomStoreName(e.target.value)}
                    placeholder="Store Name..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                )}
              </div>

              {/* Product Name */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showProductName}
                  onChange={(e) => setShowProductName(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {t('product_name', 'Product Name')}
                </span>
              </label>

              {/* Price */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {t('price', 'Price & Currency Tag')}
                </span>
              </label>

              {/* SKU */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={(e) => setShowSku(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {t('sku', 'SKU / Product Code')}
                </span>
              </label>

              {/* Barcode Number Digits */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBarcodeNumber}
                  onChange={(e) => setShowBarcodeNumber(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {t('barcode_digits', 'Show Digits below Barcode')}
                </span>
              </label>
            </div>
          </div>

          {/* Right Column: Live Visual Preview & Output (7 cols) */}
          <div className="md:col-span-7 p-6 flex flex-col justify-between bg-slate-100/70 dark:bg-slate-950/40">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-500" />
                  <span>{t('thermal_preview', 'Live Thermal Sticker Preview')} ({labelCount * itemsToPrint.length} total)</span>
                </span>

                <span className="text-[11px] font-mono text-slate-500">
                  {labelSize}
                </span>
              </div>

              {/* Live Preview Container */}
              <div
                id="omni-barcode-print-area"
                className="flex flex-wrap gap-4 justify-center items-center max-h-[50vh] overflow-y-auto p-4 custom-scrollbar"
              >
                {itemsToPrint.slice(0, 4).map((prod, pIdx) => {
                  const bVal = prod.barcode || prod.sku || prod.id.toString();
                  const pBars = generateCode128Bars(bVal);

                  return (
                    <div
                      key={pIdx}
                      className={`bg-white text-black p-3 rounded-xl border border-slate-300 shadow-md flex flex-col items-center justify-between text-center select-text ${sizeStyles[labelSize]} transition-all`}
                    >
                      {/* Store Header */}
                      {showStoreName && (
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-600 truncate w-full leading-none">
                          {customStoreName}
                        </span>
                      )}

                      {/* Product Name */}
                      {showProductName && (
                        <span className="text-[11px] font-bold text-slate-900 line-clamp-2 w-full px-0.5 leading-tight my-0.5">
                          {prod.name}
                        </span>
                      )}

                      {/* Vector Barcode */}
                      <div className="flex flex-col items-center my-0.5 w-full">
                        <svg
                          viewBox={`0 0 ${pBars.length} 40`}
                          className="w-full h-8 max-w-[90%]"
                          preserveAspectRatio="none"
                        >
                          {pBars.map((isBar, idx) =>
                            isBar ? (
                              <rect
                                key={idx}
                                x={idx}
                                y={0}
                                width={1}
                                height={40}
                                fill="black"
                              />
                            ) : null
                          )}
                        </svg>

                        {showBarcodeNumber && (
                          <span className="font-mono text-[9px] tracking-widest font-semibold mt-0.5 leading-none">
                            {bVal}
                          </span>
                        )}
                      </div>

                      {/* Footer Row: SKU & Price */}
                      <div className="flex items-center justify-between w-full px-1 pt-0.5 border-t border-slate-200">
                        {showSku && (
                          <span className="text-[9px] text-slate-500 font-mono truncate">
                            {prod.sku ? `SKU: ${prod.sku}` : ''}
                          </span>
                        )}
                        {showPrice && (
                          <span className="text-xs font-black text-slate-950 font-mono ml-auto">
                            {currency}{prod.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {itemsToPrint.length > 4 && (
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  + {itemsToPrint.length - 4} more products in print queue
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Extension Status Badge */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                isExtInstalled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              {isExtInstalled ? '🟢 Extension Active' : '🟡 Browser Print Fallback'}
            </span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {t('cancel', 'Cancel')}
            </button>

            {/* Standard Browser Print */}
            <button
              type="button"
              onClick={handleBrowserPrint}
              title="Print via Browser Dialog (A4 sheet)"
              className="p-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Direct Extension Print */}
            <button
              type="button"
              onClick={handleDirectPrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPrinting ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 text-amber-300" />
              )}
              <span>
                {isPrinting
                  ? 'Printing...'
                  : `🏷️ Print on NiceLabel (${labelCount * itemsToPrint.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
