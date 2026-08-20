import React from 'react';
import type { Product, ProductVariation } from '../types';
import { usePosStore } from '../store/usePosStore';
import { formatPrice } from '../utils/format';
import { t } from '../utils/i18n';
import { Plus, Barcode, Layers } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, initData } = usePosStore();
  const [selectedVarId, setSelectedVarId] = React.useState<number | null>(null);

  const hasVariations = Boolean(product.variations?.length);
  const activeVariation: ProductVariation | undefined = hasVariations
    ? product.variations?.find(v => v.id === selectedVarId) || product.variations?.[0]
    : undefined;

  const currentPrice = activeVariation ? activeVariation.price : product.price;
  const currentRegularPrice = activeVariation ? activeVariation.regular_price : product.regular_price;
  const currentStock = activeVariation ? activeVariation.stock_quantity : product.stock_quantity;
  const inStock = activeVariation ? activeVariation.in_stock : product.in_stock;
  const currentBarcode = activeVariation ? activeVariation.barcode : product.barcode;

  const handleCardClick = () => {
    if (!inStock && product.manage_stock) return;
    addToCart(product, activeVariation);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white dark:bg-[#131b2e] hover:bg-slate-50 dark:hover:bg-[#1a253e] border border-slate-200 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-xl p-3 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md dark:shadow-md dark:hover:shadow-xl dark:hover:shadow-blue-500/5 active:scale-[0.98] ${
        !inStock && product.manage_stock ? 'opacity-50 grayscale' : ''
      }`}
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden mb-2.5 flex items-center justify-center border border-slate-200 dark:border-slate-800/50">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-slate-400 dark:text-slate-600 font-bold text-xl">📦</div>
        )}

        {/* Stock Badge */}
        {product.manage_stock && (
          <div
            className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight shadow-sm backdrop-blur-md ${
              inStock
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-500/30'
                : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-500/30'
            }`}
          >
            {inStock ? `${currentStock} ${t('in_stock_unit', 'in stock')}` : t('out_of_stock', 'Out of stock')}
          </div>
        )}

        {/* Variation Badge */}
        {hasVariations && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-500/30 text-[10px] font-medium flex items-center space-x-1 backdrop-blur-md">
            <Layers className="w-3 h-3" />
            <span>{product.variations?.length} {t('variations', 'options')}</span>
          </div>
        )}

        {/* Quick Add Overlay on Hover */}
        <div className="absolute inset-0 bg-blue-600/10 dark:bg-blue-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Title and Barcode */}
      <div className="flex-1 min-h-[48px]">
        <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {product.name}
        </h3>

        {currentBarcode && (
          <div className="mt-1 flex items-center space-x-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <Barcode className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate">{currentBarcode}</span>
          </div>
        )}
      </div>

      {/* Variations Selector if any */}
      {hasVariations && product.variations && (
        <div className="mt-2" onClick={e => e.stopPropagation()}>
          <select
            value={activeVariation?.id}
            onChange={e => setSelectedVarId(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] rounded px-1.5 py-1 focus:outline-none focus:border-blue-500"
          >
            {product.variations.map(v => (
              <option key={v.id} value={v.id}>
                {Object.values(v.attributes).join(' / ')} — {formatPrice(v.price, initData?.store)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Price & Action */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {formatPrice(currentPrice, initData?.store)}
          </span>
          {product.is_on_sale && currentRegularPrice > currentPrice && (
            <span className="ml-1.5 text-[10px] text-slate-400 line-through">
              {formatPrice(currentRegularPrice, initData?.store)}
            </span>
          )}
        </div>

        <button
          onClick={e => {
            e.stopPropagation();
            handleCardClick();
          }}
          disabled={!inStock && product.manage_stock}
          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white dark:bg-blue-600/20 dark:hover:bg-blue-600 dark:text-blue-400 dark:hover:text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
