import React, { useState, useEffect, useMemo } from 'react';
import { usePosStore } from '../../store/usePosStore';
import { niceLabelClient, type NiceLabelItem } from '../../services/niceLabelClient';
import { NiceLabelDocsModal } from './NiceLabelDocsModal';
import { formatPrice } from '../../utils/format';
import { t } from '../../utils/i18n';
import type { Product } from '../../types';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Sparkles,
  RotateCw,
  X,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  Tag,
  Zap,
  Clock,
  Filter,
  BookOpen,
} from 'lucide-react';

interface AdminBarcodeHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
}

interface QueuedItem {
  product: Product;
  quantity: number;
}

export const AdminBarcodeHubModal: React.FC<AdminBarcodeHubModalProps> = ({
  isOpen,
  onClose,
  initialProduct,
}) => {
  const { products, categories, initData, adminSettings } = usePosStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | 'all'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'outofstock'>('all');

  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [printFeedback, setPrintFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [templateName, setTemplateName] = useState('product_label.nlbl');
  const [printerName, setPrinterName] = useState('');

  // Auto-add initial product if opened from product row
  useEffect(() => {
    if (isOpen && initialProduct) {
      setQueue((prev) => {
        if (prev.some((q) => q.product.id === initialProduct.id)) return prev;
        return [{ product: initialProduct, quantity: Math.max(1, initialProduct.stock_quantity || 1) }, ...prev];
      });
    }
  }, [isOpen, initialProduct]);

  // Recent 10 products
  const recentProducts = useMemo(() => {
    return products.slice(0, 10);
  }, [products]);

  // Filtered product catalog
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      // Category filter
      if (selectedCatId !== 'all') {
        const inCat = p.categories && p.categories.some((c) => c.id === selectedCatId);
        if (!inCat) return false;
      }

      // Stock filter
      if (stockFilter === 'instock' && (!p.stock_quantity || p.stock_quantity <= 0)) return false;
      if (stockFilter === 'outofstock' && (p.stock_quantity && p.stock_quantity > 0)) return false;

      // Search query filter (title, barcode, SKU)
      if (q) {
        const matchTitle = p.name?.toLowerCase().includes(q);
        const matchBarcode = p.barcode?.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        if (!matchTitle && !matchBarcode && !matchSku) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCatId, stockFilter]);

  if (!isOpen) return null;

  // Add product to queue
  const addToQueue = (product: Product, defaultQty?: number) => {
    setQueue((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      const initialQty = defaultQty !== undefined ? defaultQty : (product.stock_quantity && product.stock_quantity > 0 ? product.stock_quantity : 1);
      return [...prev, { product, quantity: Math.max(1, initialQty) }];
    });
  };

  // Remove from queue
  const removeFromQueue = (productId: number) => {
    setQueue((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Update quantity
  const updateQuantity = (productId: number, qty: number) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return { ...item, quantity: Math.max(1, qty) };
        }
        return item;
      })
    );
  };

  // Set all to stock quantities
  const setAllToStockQty = () => {
    setQueue((prev) =>
      prev.map((item) => ({
        ...item,
        quantity: Math.max(1, item.product.stock_quantity || 1),
      }))
    );
  };

  // Clear queue
  const clearQueue = () => {
    setQueue([]);
  };

  // Total stickers
  const totalStickers = queue.reduce((sum, item) => sum + item.quantity, 0);

  // Send print job to NiceLabel
  const handlePrintNiceLabel = async () => {
    if (!queue.length) return;

    setIsPrinting(true);
    setPrintFeedback(null);

    const itemsToPrint: NiceLabelItem[] = queue.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      priceFormatted: formatPrice(item.product.price, initData?.store),
      barcode: item.product.barcode || item.product.sku || `${item.product.id}`,
      sku: item.product.sku || '',
      quantity: item.quantity,
      category: item.product.categories?.[0]?.name || '',
    }));

    const result = await niceLabelClient.printBatch(
      itemsToPrint,
      {
        template: templateName,
        printer: printerName || undefined,
      },
      initData?.store?.name || 'Omni POS'
    );

    setIsPrinting(false);
    setPrintFeedback(result);

    if (result.success) {
      setTimeout(() => setPrintFeedback(null), 5000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t('barcode_hub_title', 'NiceLabel Barcode & Label Print Hub')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold uppercase">
                  Batch Thermal
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('barcode_hub_desc', 'Select products, set label quantities, and print directly to NiceLabel thermal printers.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDocsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t('nicelabel_docs_btn', '📖 NiceLabel ინსტრუქცია')}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content (2-Column Grid) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          {/* Left Column: Product Search & Catalog (7 cols) */}
          <div className="lg:col-span-7 border-r border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder={t('search_products_barcode', 'Search by title, barcode, or SKU...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-xs">
                {/* Category selector */}
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">{t('all_categories', 'All Categories')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.count || 0})
                    </option>
                  ))}
                </select>

                {/* Stock filter buttons */}
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    stockFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {t('all', 'All')}
                </button>

                <button
                  type="button"
                  onClick={() => setStockFilter('instock')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    stockFilter === 'instock'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {t('in_stock', 'In Stock')}
                </button>
              </div>
            </div>

            {/* Product List Scrollable */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
              {/* Recent 10 Products Section (if not searching) */}
              {!searchQuery && selectedCatId === 'all' && stockFilter === 'all' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t('recent_10_products', 'Recent 10 Products')}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recentProducts.map((p) => {
                      const isQueued = queue.some((q) => q.product.id === p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => addToQueue(p)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isQueued
                              ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/80'
                              : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-blue-400'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {p.name}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{formatPrice(p.price, initData?.store)}</span>
                              {p.barcode && <span className="opacity-75">#{p.barcode}</span>}
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform active:scale-90 ${
                              isQueued
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Filtered Full Catalog */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span>{t('catalog_items', 'Catalog Products')} ({filteredProducts.length})</span>
                </div>

                <div className="space-y-2">
                  {filteredProducts.map((p) => {
                    const isQueued = queue.some((q) => q.product.id === p.id);
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3 truncate">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}

                          <div className="truncate">
                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {p.name}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                {formatPrice(p.price, initData?.store)}
                              </span>
                              {p.barcode && <span>EAN: {p.barcode}</span>}
                              {p.sku && <span>SKU: {p.sku}</span>}
                              <span className="opacity-75">Stock: {p.stock_quantity ?? '∞'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => addToQueue(p)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                            isQueued
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                              : 'bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 hover:text-blue-600 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isQueued ? t('added', 'Added') : t('add', 'Add')}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Print Queue & NiceLabel Action (5 cols) */}
          <div className="lg:col-span-5 flex flex-col overflow-hidden bg-slate-50/60 dark:bg-slate-900/60">
            {/* Queue Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>{t('print_queue', 'Print Queue')}</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                    {queue.length} items ({totalStickers} labels)
                  </span>
                </h3>
              </div>

              {queue.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={setAllToStockQty}
                    className="text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Set quantity of each product to its current stock amount"
                  >
                    ⚡ {t('all_to_stock', 'All to Stock')}
                  </button>

                  <button
                    type="button"
                    onClick={clearQueue}
                    className="text-[11px] font-bold p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Clear queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Queue Items List */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-2.5">
              {queue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
                    <Tag className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('queue_empty', 'Print queue is empty')}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Select products from the left catalog to build your thermal label print queue.
                  </p>
                </div>
              ) : (
                queue.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="truncate pr-2">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{formatPrice(item.product.price, initData?.store)}</span>
                        {item.product.barcode && <span>#{item.product.barcode}</span>}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                        className="w-12 text-center py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFromQueue(item.product.id)}
                        className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors cursor-pointer ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* NiceLabel Action Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shrink-0">
              {/* Template & Optional Printer */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    NiceLabel Template (.nlbl)
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="product_label.nlbl"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Target Printer (Optional)
                  </label>
                  <input
                    type="text"
                    value={printerName}
                    onChange={(e) => setPrinterName(e.target.value)}
                    placeholder="Template default"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {printFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    printFeedback.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {printFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{printFeedback.message}</span>
                </div>
              )}

              {/* Big Print Button */}
              <button
                type="button"
                onClick={handlePrintNiceLabel}
                disabled={isPrinting || queue.length === 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPrinting ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                <span>
                  {isPrinting
                    ? t('printing_to_nicelabel', 'Sending to NiceLabel...')
                    : `${t('print_on_nicelabel', 'Print on NiceLabel')} (${totalStickers} ${t('labels', 'Labels')})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NiceLabel Documentation Modal */}
      <NiceLabelDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
};
