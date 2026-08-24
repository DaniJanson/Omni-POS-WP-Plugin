import React, { useState, useEffect, useCallback } from 'react';
import { posApi } from '../../services/api';
import { db } from '../../db';
import { usePosStore } from '../../store/usePosStore';
import { ProductEditModal } from './ProductEditModal';
import { BarcodePrintModal } from './BarcodePrintModal';
import { t } from '../../utils/i18n';
import type { Product } from '../../types';
import {
  Search,
  Plus,
  RotateCw,
  Edit2,
  Trash2,
  Barcode,
  Printer,
  ChevronLeft,
  ChevronRight,
  Package,
  Layers,
  AlertTriangle,
  Minus,
  Check,
  Info,
} from 'lucide-react';

export const AdminProductsView: React.FC = () => {
  const { categories, showNotification, initData, adminSettings } = usePosStore();
  const isDirectControl = (adminSettings?.inventory_mode || window.omniPosConfig?.inventoryMode) === 'omni_pos';

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [stockStatus, setStockStatus] = useState<'all' | 'instock' | 'lowstock' | 'outofstock'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [productToPrint, setProductToPrint] = useState<Product | null>(null);

  // Quick stock adjustment state indicator
  const [adjustingStockId, setAdjustingStockId] = useState<number | null>(null);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${t('confirm_bulk_delete', 'Are you sure you want to delete the selected items?')} (${selectedIds.length})`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const resp = await posApi.bulkDelete('products', selectedIds);
      if (resp.success) {
        setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
        for (const id of selectedIds) {
          await db.products.delete(id);
        }
        showNotification(t('items_deleted_success', 'Selected items deleted successfully!'), 'success');
        setSelectedIds([]);
        fetchProducts();
      }
    } catch (err: any) {
      showNotification(t('error', 'Failed to delete items') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await posApi.getAdminProducts({
        page,
        per_page: 15,
        search,
        category_id: categoryId,
        stock_status: stockStatus,
      });

      if (resp.success) {
        setProducts(resp.products);
        setTotalPages(resp.total_pages || 1);
        setTotalCount(resp.total || 0);
      }
    } catch (err: any) {
      console.error('Fetch Admin Products Error:', err);
      showNotification(t('sync_error', 'Failed to load products') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, categoryId, stockStatus, showNotification]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleStockAdjust = async (product: Product, action: 'add' | 'subtract', amount: number = 1) => {
    setAdjustingStockId(product.id);
    try {
      const resp = await posApi.adjustProductStock(product.id, action, amount);
      if (resp.success && resp.product) {
        // Update state in table
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, stock_quantity: resp.stock_quantity, in_stock: resp.in_stock } : p))
        );
        // Update in Dexie IndexedDB
        await db.products.put(resp.product);
        showNotification(`${product.name}: ${resp.stock_quantity} ${t('in_stock_unit', 'units')}`, 'success');
      }
    } catch (err: any) {
      showNotification(t('error', 'Stock update failed') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setAdjustingStockId(null);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`${t('delete', 'Delete')} "${product.name}"?`)) {
      return;
    }

    try {
      const resp = await posApi.deleteAdminProduct(product.id);
      if (resp.success) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        await db.products.delete(product.id);
        showNotification(t('product_moved_trash', 'Product moved to trash'), 'success');
      }
    } catch (err: any) {
      showNotification(t('error', 'Error') + ': ' + (err.message || 'Error'), 'error');
    }
  };

  const currency = initData?.store.currency_symbol || '$';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>📦 {t('products_stock', 'Products & Stock Management')}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-500/20">
              {totalCount} {t('all', 'Total')}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('dashboard_subtitle', 'Directly manage prices, live stock quantities (+/-), barcodes and categories.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchProducts()}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            title={t('sync_catalogue', 'Refresh List')}
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {isDirectControl && (
            <button
              onClick={() => {
                setProductToEdit(null);
                setIsEditModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('add_product', 'Add Product')}</span>
            </button>
          )}
        </div>
      </div>

      {/* WooCommerce Standard Mode Notice Banner */}
      {!isDirectControl && (
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <strong className="block font-bold text-amber-900 dark:text-amber-200">
                {t('wc_standard_mode', 'WooCommerce Standard Mode is Active')}
              </strong>
              <span>
                {t('settings_desc', 'Products and stock levels are synced directly from WooCommerce.')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('search_placeholder', 'Search by title, SKU, or barcode...')}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Categories & Stock Status Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          {/* Category Dropdown */}
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(parseInt(e.target.value) || 0);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>{t('all_categories', 'All Categories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter Pill Buttons */}
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs">
            {(['all', 'instock', 'lowstock', 'outofstock'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStockStatus(status);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-semibold text-[11px] capitalize transition-all cursor-pointer ${
                  stockStatus === status
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {status === 'lowstock' ? t('low_stock_items', 'Low Stock') : status === 'outofstock' ? t('out_of_stock', 'Out of Stock') : status === 'instock' ? t('in_stock', 'In Stock') : t('all', 'All')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-semibold">{t('item', 'Product')}</th>
                <th className="py-3 px-4 font-semibold">{t('sku', 'SKU / Barcode')}</th>
                <th className="py-3 px-4 font-semibold">{t('product_category', 'Category')}</th>
                <th className="py-3 px-4 font-semibold">{t('price', 'Prices')}</th>
                <th className="py-3 px-4 font-semibold text-center">{t('remaining_stock', 'Live Stock')}</th>
                <th className="py-3 px-4 font-semibold text-right">{t('actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {products.map((product) => {
                const isLowStock = product.manage_stock && product.stock_quantity <= 5 && product.stock_quantity > 0;
                const isOutOfStock = product.manage_stock && product.stock_quantity <= 0;
                const isAdjusting = adjustingStockId === product.id;
                const isSelected = selectedIds.includes(product.id);

                return (
                  <tr key={product.id} className={`transition-colors ${isSelected ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'}`}>
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(product.id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* Thumbnail & Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700/60 shrink-0 flex items-center justify-center">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block max-w-xs truncate">
                            {product.name}
                          </span>
                          <span className="text-[10px] text-slate-400">ID: #{product.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* SKU & Barcode */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      <div>{t('sku', 'SKU')}: <span className="text-slate-800 dark:text-slate-200">{product.sku || '—'}</span></div>
                      {product.barcode && (
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                          <Barcode className="w-3 h-3" />
                          <span>{product.barcode}</span>
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      {product.categories?.[0] ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                          {product.categories[0].name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Prices */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {currency}{product.price.toFixed(2)}
                      </div>
                      {product.is_on_sale && product.regular_price && (
                        <div className="text-[10px] text-slate-400 line-through">
                          {currency}{product.regular_price.toFixed(2)}
                        </div>
                      )}
                      {product.cost_price && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {t('cost_price', 'Cost')}: {currency}{product.cost_price.toFixed(2)}
                        </div>
                      )}
                    </td>

                    {/* Stock Display / Quick Adjuster */}
                    <td className="py-3 px-4 text-center">
                      {product.manage_stock ? (
                        isDirectControl ? (
                          <div className="inline-flex items-center space-x-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                            {/* Decrement Button */}
                            <button
                              onClick={() => handleStockAdjust(product, 'subtract', 1)}
                              disabled={isAdjusting || product.stock_quantity <= 0}
                              title="Subtract 1 unit"
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all disabled:opacity-30 shadow-xs cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            {/* Stock Badge */}
                            <span
                              className={`min-w-[42px] px-2 py-0.5 rounded-lg text-center font-bold text-xs ${
                                isOutOfStock
                                  ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                                  : isLowStock
                                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              {isAdjusting ? '...' : product.stock_quantity}
                            </span>

                            {/* Increment Button */}
                            <button
                              onClick={() => handleStockAdjust(product, 'add', 1)}
                              disabled={isAdjusting}
                              title="Add 1 unit"
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-xs ${
                              isOutOfStock
                                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                                : isLowStock
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {product.stock_quantity} {t('in_stock_unit', 'in stock')}
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                          {t('in_stock', 'In Stock')}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Print Barcode Label */}
                        <button
                          onClick={() => {
                            setProductToPrint(product);
                            setIsPrintModalOpen(true);
                          }}
                          title={t('barcode_labels', 'Print Barcode Labels')}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Edit Product (Direct Mode) */}
                        {isDirectControl && (
                          <>
                            <button
                              onClick={() => {
                                setProductToEdit(product);
                                setIsEditModalOpen(true);
                              }}
                              title={t('edit_product', 'Edit Product')}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(product)}
                              title={t('delete', 'Delete')}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{t('no_products_found', 'No products found')}</p>
                    <p className="text-xs">{t('no_products_desc', 'Try searching for a different keyword or create a new product.')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {page} / {totalPages} ({totalCount} {t('units', 'items')})
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between p-3.5 px-5 bg-slate-900/95 dark:bg-slate-800/95 text-white rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 animate-slideUp">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold font-mono">
              {selectedIds.length} {t('selected_count', 'Selected')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isBulkDeleting ? t('processing', 'Deleting...') : t('delete_selected', 'Delete Selected')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit / Create Modal */}
      <ProductEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        productToEdit={productToEdit}
        categories={categories}
        onSaved={() => fetchProducts()}
      />

      {/* Barcode Print Modal */}
      <BarcodePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        product={productToPrint}
        currency={currency}
        storeName={initData?.store.name || 'Omni POS'}
      />
    </div>
  );
};
