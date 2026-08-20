import React from 'react';
import { usePosStore } from '../store/usePosStore';
import { formatPrice } from '../utils/format';
import { t } from '../utils/i18n';
import {
  Trash2,
  Plus,
  Minus,
  User,
  ShoppingBag,
  Percent,
  CreditCard,
  X,
} from 'lucide-react';

export const Cart: React.FC = () => {
  const {
    cart,
    customer,
    orderDiscountAmount,
    setOrderDiscountAmount,
    updateItemQty,
    removeFromCart,
    clearCart,
    openPaymentModal,
    setCustomerModalOpen,
    initData,
  } = usePosStore();

  const [isDiscountOpen, setIsDiscountOpen] = React.useState(false);
  const [discountInput, setDiscountInput] = React.useState('');

  const subtotal = cart.reduce((sum, item) => {
    const price = item.custom_price ?? item.price;
    const discount = item.custom_discount_percent ? (price * item.custom_discount_percent) / 100 : 0;
    return sum + (price - discount) * item.quantity;
  }, 0);

  const total = Math.max(0, subtotal - orderDiscountAmount);

  const handleApplyDiscount = () => {
    const val = parseFloat(discountInput);
    if (!isNaN(val) && val >= 0) {
      setOrderDiscountAmount(val);
      setIsDiscountOpen(false);
    }
  };

  return (
    <div className="w-full lg:w-96 xl:w-[420px] bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 flex flex-col h-full select-none z-10 shadow-xl transition-colors">
      {/* Customer Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#131b2e] flex items-center justify-between">
        <button
          onClick={() => setCustomerModalOpen(true)}
          className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all text-left flex-1 mr-2 shadow-sm"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none mb-1">{t('customer', 'Customer')}</div>
            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-none">
              {customer?.name || t('walk_in_customer', 'Walk-in Customer (Guest)')}
            </div>
          </div>
        </button>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            title={t('clear_cart', 'Clear Cart')}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-700/50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-slate-50/40 dark:bg-transparent">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-3 text-slate-400 dark:text-slate-600 shadow-sm">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('cart_empty', 'Cart is empty')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">
              {t('cart_empty_desc', 'Scan a barcode or click a product to add to cart')}
            </p>
          </div>
        ) : (
          cart.map(item => {
            const itemPrice = item.custom_price ?? item.price;
            const itemTotal = itemPrice * item.quantity;

            return (
              <div
                key={item.cart_id}
                className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
              >
                {/* Line 1: Image, Title, Price, Delete */}
                <div className="flex items-start space-x-2.5">
                  <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs">📦</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 leading-tight">
                      {item.name}
                    </h4>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {formatPrice(itemPrice, initData?.store)} / unit
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatPrice(itemTotal, initData?.store)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cart_id)}
                      className="text-slate-400 hover:text-rose-500 mt-1 p-0.5 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Line 2: Quantity Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    SKU: {item.sku || 'N/A'}
                  </div>

                  <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700/60">
                    <button
                      onClick={() => updateItemQty(item.cart_id, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center active:scale-95 transition-all shadow-sm"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-xs text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateItemQty(item.cart_id, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center active:scale-95 transition-all shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Checkout */}
      {cart.length > 0 && (
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#131b2e] space-y-3">
          {/* Subtotal & Discount rows */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{t('subtotal', 'Subtotal')}</span>
              <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">{formatPrice(subtotal, initData?.store)}</span>
            </div>

            {orderDiscountAmount > 0 && (
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>{t('discount', 'Discount')}</span>
                <span className="font-mono">-{formatPrice(orderDiscountAmount, initData?.store)}</span>
              </div>
            )}

            {/* Discount Form Modal/Collapsible */}
            {isDiscountOpen ? (
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="number"
                  step="0.01"
                  value={discountInput}
                  onChange={e => setDiscountInput(e.target.value)}
                  placeholder="Amount"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleApplyDiscount}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                >
                  OK
                </button>
                <button
                  onClick={() => setIsDiscountOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setDiscountInput(orderDiscountAmount ? String(orderDiscountAmount) : '');
                  setIsDiscountOpen(true);
                }}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 font-medium"
              >
                <Percent className="w-3 h-3" />
                <span>{t('add_discount', 'Add discount')}</span>
              </button>
            )}

            {/* Final Total */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex items-baseline justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t('total_payable', 'Total Payable')}</span>
              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight font-mono">
                {formatPrice(total, initData?.store)}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={openPaymentModal}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 ring-1 ring-black/5 dark:ring-white/20"
          >
            <CreditCard className="w-5 h-5" />
            <span>{t('pay', 'Pay')} ({formatPrice(total, initData?.store)})</span>
          </button>
        </div>
      )}
    </div>
  );
};
