import React from 'react';
import { usePosStore } from '../store/usePosStore';
import { ProductCard } from './ProductCard';
import { t } from '../utils/i18n';
import { Search, X, Barcode, Grid, RefreshCw } from 'lucide-react';

export const ProductGrid: React.FC = () => {
  const {
    products,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    handleBarcodeScan,
    isProductsLoading,
    syncCatalog,
  } = usePosStore();

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = searchQuery.trim();
      if (val) {
        handleBarcodeScan(val);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-[#0b0f19] overflow-hidden transition-colors">
      {/* Top Search & Filter Bar */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0f172a]/70 backdrop-blur-md flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search & Barcode Input */}
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search_placeholder', 'Search products or scan barcode...')}
            className="w-full pl-9 pr-24 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-inner transition-colors"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center space-x-1.5">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="hidden sm:flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-400">
              <Barcode className="w-3 h-3 text-blue-500 dark:text-blue-400" />
              <span>{t('auto', 'Auto')}</span>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId(0)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryId === 0
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-black/5 dark:ring-white/10'
                : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/50 shadow-sm'
            }`}
          >
            {t('all', 'All')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategoryId === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-black/5 dark:ring-white/10'
                  : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/50 shadow-sm'
              }`}
            >
              {cat.name}
              {cat.count > 0 && (
                <span className="ml-1.5 text-[10px] opacity-70">({cat.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isProductsLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
              <span>{t('products_loading', 'Loading products...')}</span>
            </div>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-600 shadow-sm">
              <Grid className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">{t('no_products_found', 'No products found')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              {t('no_products_desc', 'Try a different search query, change category, or sync catalogue from server.')}
            </p>
            <button
              onClick={() => syncCatalog(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t('full_sync_button', 'Full Catalogue Sync')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
