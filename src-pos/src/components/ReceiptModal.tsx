import React from 'react';
import { usePosStore } from '../store/usePosStore';
import { formatPrice } from '../utils/format';
import { t } from '../utils/i18n';
import { Printer, Check, X, RotateCcw } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const {
    isReceiptModalOpen,
    closeReceiptModal,
    lastReceipt,
    initData,
  } = usePosStore();

  if (!isReceiptModalOpen || !lastReceipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const store = initData?.store;
  const settings = initData?.settings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="p-3 bg-[#131b2e] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-white">{t('payment_success', 'Payment Successful!')}</span>
          </div>
          <button
            onClick={closeReceiptModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 80mm Thermal Receipt Content Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 flex justify-center custom-scrollbar">
          <div
            id="omni-receipt-print-area"
            className="w-full bg-white text-black p-4 text-[12px] font-mono leading-tight shadow-md rounded border border-slate-200"
            style={{ maxWidth: '78mm' }}
          >
            {/* Header */}
            <div className="text-center pb-3 mb-2 border-b border-dashed border-black">
              <h2 className="font-bold text-base uppercase tracking-tight">{store?.name || 'Store'}</h2>
              {store?.tax_number && (
                <p className="text-[11px] mt-0.5">Tax ID: {store.tax_number}</p>
              )}
              {store?.phone && (
                <p className="text-[11px]">Tel: {store.phone}</p>
              )}
              {store?.address?.address_1 && (
                <p className="text-[10px] text-gray-700">{store.address.address_1}, {store.address.city}</p>
              )}
              {settings?.receipt_header && (
                <p className="text-[11px] mt-2 whitespace-pre-line italic font-sans font-semibold">
                  {settings.receipt_header}
                </p>
              )}
            </div>

            {/* Meta */}
            <div className="text-[11px] space-y-0.5 pb-2 mb-2 border-b border-dashed border-black">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{lastReceipt.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{lastReceipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{lastReceipt.cashier}</span>
              </div>
              {lastReceipt.customer_name && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{lastReceipt.customer_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Payment:</span>
                <span>{lastReceipt.payment_method}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="pb-2 mb-2 border-b border-dashed border-black">
              <div className="grid grid-cols-12 font-bold pb-1 text-[11px] border-b border-gray-300">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-4 text-right">Total</span>
              </div>
              <div className="space-y-1.5 pt-1.5">
                {lastReceipt.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px]">
                    <span className="col-span-6 break-words pr-1">{item.name}</span>
                    <span className="col-span-2 text-center">{item.qty}</span>
                    <span className="col-span-4 text-right font-bold">{formatPrice(item.total, store)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-1 text-[11px] pb-2 mb-2 border-b border-dashed border-black">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(lastReceipt.subtotal, store)}</span>
              </div>
              {lastReceipt.discount > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Discount:</span>
                  <span>-{formatPrice(lastReceipt.discount, store)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-black">
                <span>Total:</span>
                <span>{formatPrice(lastReceipt.total, store)}</span>
              </div>
              {lastReceipt.tendered > 0 && (
                <>
                  <div className="flex justify-between pt-1">
                    <span>Tendered:</span>
                    <span>{formatPrice(lastReceipt.tendered, store)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span>{formatPrice(lastReceipt.change, store)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {settings?.receipt_footer && (
              <div className="text-center text-[10px] text-gray-700 whitespace-pre-line pt-1 italic">
                {settings.receipt_footer}
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 bg-[#131b2e] border-t border-slate-800 flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{t('print_receipt', 'Print Receipt (80mm)')}</span>
          </button>
          <button
            onClick={closeReceiptModal}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('new_sale', 'New Sale')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
