import React, { useState, useEffect } from 'react';
import { posApi } from '../../services/api';
import { db } from '../../db';
import { usePosStore } from '../../store/usePosStore';
import { t } from '../../utils/i18n';
import type { Product, AdminProductFormData, ProductCategory } from '../../types';
import {
  X,
  Save,
  RotateCw,
  Sparkles,
  Barcode,
  DollarSign,
  Package,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
  categories: ProductCategory[];
  onSaved: (product: Product) => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  categories,
  onSaved,
}) => {
  const { showNotification } = usePosStore();

  const [formData, setFormData] = useState<AdminProductFormData>({
    name: '',
    sku: '',
    barcode: '',
    regular_price: '',
    sale_price: '',
    cost_price: '',
    manage_stock: true,
    stock_quantity: '0',
    category_id: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        id: productToEdit.id,
        name: productToEdit.name,
        sku: productToEdit.sku || '',
        barcode: productToEdit.barcode || '',
        regular_price: productToEdit.regular_price || productToEdit.price || '',
        sale_price: productToEdit.sale_price !== null ? productToEdit.sale_price : '',
        cost_price: productToEdit.cost_price !== null && productToEdit.cost_price !== undefined ? productToEdit.cost_price : '',
        manage_stock: productToEdit.manage_stock,
        stock_quantity: productToEdit.stock_quantity.toString(),
        category_id: productToEdit.categories?.[0]?.id || 0,
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        regular_price: '',
        sale_price: '',
        cost_price: '',
        manage_stock: true,
        stock_quantity: '10',
        category_id: categories?.[0]?.id || 0,
      });
    }
    setErrorMessage('');
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleGenerateBarcode = async () => {
    setIsGeneratingBarcode(true);
    try {
      const resp = await posApi.generateBarcode();
      if (resp.success && resp.barcode) {
        setFormData((prev) => ({ ...prev, barcode: resp.barcode }));
      }
    } catch (err: any) {
      showNotification(t('error', 'Failed to generate barcode') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsGeneratingBarcode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage(t('product_name', 'Product name is required'));
      return;
    }
    if (!formData.regular_price && formData.regular_price !== 0) {
      setErrorMessage(t('regular_price', 'Regular price is required'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let savedProduct: Product;
      if (productToEdit) {
        const resp = await posApi.updateAdminProduct(productToEdit.id, formData);
        savedProduct = resp.product;
        showNotification(t('product_saved_success', 'Product saved successfully!'), 'success');
      } else {
        const resp = await posApi.createAdminProduct(formData);
        savedProduct = resp.product;
        showNotification(t('product_saved_success', 'Product saved successfully!'), 'success');
      }

      // Sync into local IndexedDB immediately
      await db.products.put(savedProduct);

      onSaved(savedProduct);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save product');
      showNotification(t('error', 'Error') + ': ' + (err.message || 'Error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol = usePosStore.getState().initData?.store?.currency_symbol || '$';

  const decodeHtml = (html: string): string => {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {productToEdit ? t('edit_product', 'Edit Product') : t('add_product', 'Add New Product')}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('product_name', 'Product Name')} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('product_name_placeholder', 'e.g. Wireless Ergonomic Mouse')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* SKU & Barcode Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('sku', 'SKU (Stock Keeping Unit)')}
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. SKU-1001"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('barcode', 'Barcode (EAN / Code-128)')}
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  disabled={isGeneratingBarcode}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isGeneratingBarcode ? t('generating', 'Generating...') : t('generate_barcode', 'Auto Generate')}</span>
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="e.g. 2000123456789"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('regular_price', 'Regular Price')} *
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.regular_price}
                  onChange={(e) => setFormData({ ...formData, regular_price: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-400 absolute left-3 pointer-events-none">{currencySymbol}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('sale_price', 'Sale Price')}
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-400 absolute left-3 pointer-events-none">{currencySymbol}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('cost_price', 'Cost Price')}
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-400 absolute left-3 pointer-events-none">{currencySymbol}</span>
              </div>
            </div>
          </div>

          {/* Category & Stock Management */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('product_category', 'Category')}
              </label>
              <div className="relative flex items-center">
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) || 0 })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>{t('select_category', 'Select Category')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {decodeHtml(c.name)} ({c.count})
                    </option>
                  ))}
                </select>
                <Layers className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('stock_quantity', 'Stock Quantity')}
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.manage_stock}
                    onChange={(e) => setFormData({ ...formData, manage_stock: e.target.checked })}
                    className="w-3.5 h-3.5 rounded text-blue-600"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{t('manage_stock_checkbox', 'Track stock')}</span>
                </label>
              </div>

              <input
                type="number"
                min="0"
                disabled={!formData.manage_stock}
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {t('cancel', 'Cancel')}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{productToEdit ? t('save_changes', 'Save Changes') : t('save', 'Create Product')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
