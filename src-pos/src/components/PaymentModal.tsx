import React, { useState } from 'react';
import { usePosStore } from '../store/usePosStore';
import { formatPrice } from '../utils/format';
import { t } from '../utils/i18n';
import {
  X,
  Banknote,
  CreditCard,
  Layers,
  CheckCircle2,
  Building2,
  Receipt,
} from 'lucide-react';

export const PaymentModal: React.FC = () => {
  const {
    isPaymentModalOpen,
    closePaymentModal,
    cart,
    orderDiscountAmount,
    orderNote,
    setOrderNote,
    completeCheckout,
    initData,
  } = usePosStore();

  const [method, setMethod] = useState<string>('cash');
  const [tenderedCash, setTenderedCash] = useState<string>('');
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const subtotal = cart.reduce((sum, item) => {
    const price = item.custom_price ?? item.price;
    const discount = item.custom_discount_percent ? (price * item.custom_discount_percent) / 100 : 0;
    return sum + (price - discount) * item.quantity;
  }, 0);

  const total = Math.max(0, subtotal - orderDiscountAmount);

  const paymentMethods = initData?.payment_methods || [
    { id: 'cash', name: 'Cash', icon: 'banknotes' },
    { id: 'card', name: 'Credit / Debit Card (POS)', icon: 'credit-card' },
    { id: 'split', name: 'Split Payment', icon: 'arrows-right-left' },
  ];

  React.useEffect(() => {
    if (isPaymentModalOpen) {
      setMethod('cash');
      setTenderedCash(String(total));
      setSplitCash(String((total / 2).toFixed(2)));
      setSplitCard(String((total / 2).toFixed(2)));
      setIsSubmitting(false);
    }
  }, [isPaymentModalOpen, total]);

  if (!isPaymentModalOpen) return null;

  const isCashMethod = method === 'cash' || method === 'cod';
  const isSplitMethod = method === 'split';

  const tenderedNum = parseFloat(tenderedCash) || 0;
  const changeDue = Math.max(0, tenderedNum - total);

  const handleQuickCash = (amount: number) => {
    setTenderedCash(String(amount));
  };

  const getMethodIcon = (id: string) => {
    switch (id) {
      case 'cash':
      case 'cod':
        return <Banknote className="w-5 h-5" />;
      case 'split':
        return <Layers className="w-5 h-5" />;
      case 'bacs':
        return <Building2 className="w-5 h-5" />;
      case 'cheque':
        return <Receipt className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (isCashMethod && tenderedNum < total) {
      alert('Tendered cash is less than the total payable amount!');
      return;
    }

    if (isSplitMethod) {
      const c = parseFloat(splitCash) || 0;
      const k = parseFloat(splitCard) || 0;
      if (Math.abs(c + k - total) > 0.01) {
        alert('Sum of Cash and Card payments must equal total amount!');
        return;
      }
    }

    setIsSubmitting(true);
    await completeCheckout({
      method,
      tendered_cash: isCashMethod ? tenderedNum : total,
      change_due: isCashMethod ? changeDue : 0,
      split_details:
        isSplitMethod
          ? { cash: parseFloat(splitCash) || 0, card: parseFloat(splitCard) || 0 }
          : undefined,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131b2e] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{t('payment_checkout', 'Payment Checkout')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('select_payment_method', 'Select payment method')}</p>
            </div>
          </div>
          <button
            onClick={closePaymentModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Total Banner */}
          <div className="bg-blue-50 dark:bg-gradient-to-r dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-500/30 rounded-xl p-3.5 flex items-baseline justify-between">
            <span className="text-xs uppercase font-bold text-blue-700 dark:text-blue-300 tracking-wider">
              {t('payable_amount', 'Payable Amount')}
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatPrice(total, initData?.store)}
            </span>
          </div>

          {/* Dynamic Payment Gateways Selector (WooCommerce + POS) */}
          <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
            {paymentMethods.map(pm => {
              const isSelected = method === pm.id;
              return (
                <button
                  key={pm.id}
                  onClick={() => setMethod(pm.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all text-center ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/30 dark:bg-blue-600/20 dark:border-blue-500 dark:text-blue-300'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {getMethodIcon(pm.id)}
                  <span className="text-xs font-bold line-clamp-1">{pm.name}</span>
                </button>
              );
            })}
          </div>

          {/* Cash Calculation Content */}
          {isCashMethod && (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  {t('tendered_cash', 'Tendered Cash')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={tenderedCash}
                  onChange={e => setTenderedCash(e.target.value)}
                  className="w-full text-lg font-bold font-mono px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickCash(total)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-sm"
                >
                  {t('exact', 'Exact')} ({formatPrice(total, initData?.store)})
                </button>
                {[5, 10, 20, 50, 100, 200].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickCash(amt)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono shadow-sm"
                  >
                    {amt}
                  </button>
                ))}
              </div>

              {/* Change calculation */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{t('change_due', 'Change Due:')}</span>
                <span className={`text-lg font-black font-mono ${changeDue > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {formatPrice(changeDue, initData?.store)}
                </span>
              </div>
            </div>
          )}

          {/* Split Payment Content */}
          {isSplitMethod && (
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  {t('cash', 'Cash')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={splitCash}
                  onChange={e => {
                    const val = e.target.value;
                    setSplitCash(val);
                    const n = parseFloat(val) || 0;
                    setSplitCard(String(Math.max(0, total - n).toFixed(2)));
                  }}
                  className="w-full font-mono font-bold px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  {t('card', 'Card')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={splitCard}
                  onChange={e => setSplitCard(e.target.value)}
                  className="w-full font-mono font-bold px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
          )}

          {/* Note Input */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
              {t('order_note', 'Order note (optional)')}
            </label>
            <input
              type="text"
              value={orderNote}
              onChange={e => setOrderNote(e.target.value)}
              placeholder={t('order_note_placeholder', 'e.g. Table 4, customer reference...')}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131b2e] flex items-center space-x-3">
          <button
            type="button"
            onClick={closePaymentModal}
            className="flex-1 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            {t('cancel', 'Cancel (Esc)')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-1.5 active:scale-95 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? t('processing', 'Processing...') : t('complete_payment', 'Complete Payment')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
