import React, { useState } from 'react';
import { usePosStore } from '../store/usePosStore';
import { qzClient } from '../services/qzClient';
import { EscPosBuilder } from '../services/escpos';
import { QzTraySetupModal } from './hardware/QzTraySetupModal';
import { formatPrice } from '../utils/format';
import { t } from '../utils/i18n';
import { Printer, Check, X, RotateCcw, Zap } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const {
    isReceiptModalOpen,
    closeReceiptModal,
    lastReceipt,
    initData,
    showNotification,
  } = usePosStore();

  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isQzPrinting, setIsQzPrinting] = useState(false);

  if (!isReceiptModalOpen || !lastReceipt) return null;

  const handleUnifiedPrint = async () => {
    const isManager = Boolean(initData?.cashier?.capabilities?.manage_pos || (window as any).omniPosConfig?.isAdmin);
    const printerName = initData?.settings?.receipt_printer;

    if (qzClient.isConnected() && printerName) {
      setIsQzPrinting(true);
      try {
        const completedOrder: any = {
          order_number: lastReceipt.order_number,
          created_at: lastReceipt.date,
          cashier_name: lastReceipt.cashier,
          customer: { id: 0, name: lastReceipt.customer_name || '' },
          items: lastReceipt.items.map((i: any) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            total: i.total,
          })),
          subtotal: lastReceipt.subtotal,
          discount_total: lastReceipt.discount || 0,
          tax_total: lastReceipt.tax || 0,
          total: lastReceipt.total,
          payment_method: lastReceipt.payment_method || 'cash',
          amount_tendered: lastReceipt.tendered || lastReceipt.total,
          change_amount: lastReceipt.change || 0,
        };

        const rawEscPos = EscPosBuilder.buildReceipt(completedOrder, initData?.store, {
          kickDrawer: lastReceipt.payment_method === 'cash' && initData?.settings?.cash_drawer_kick !== false,
          autoCut: initData?.settings?.auto_paper_cut !== false,
          receiptHeader: initData?.settings?.receipt_header,
          receiptFooter: initData?.settings?.receipt_footer,
        });

        await qzClient.printRaw(printerName, rawEscPos);
        showNotification(t('test_print_sent', 'Receipt sent to thermal printer!'), 'success');
        return;
      } catch (err: any) {
        console.warn('QZ print failed, falling back to browser print:', err);
      } finally {
        setIsQzPrinting(false);
      }
    }

    if (!qzClient.isConnected() && isManager && printerName) {
      setIsSetupModalOpen(true);
      return;
    }

    // Fallback standard browser print
    window.print();
  };

  const store = initData?.store;
  const settings = initData?.settings;
  const isManager = Boolean(initData?.cashier?.capabilities?.manage_pos || (window as any).omniPosConfig?.isAdmin);

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
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
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
                <span>{t('receipt_number', 'Receipt #:')}</span>
                <span className="font-bold">{lastReceipt.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('date', 'Date:')}</span>
                <span>{lastReceipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('cashier', 'Cashier:')}</span>
                <span>{lastReceipt.cashier}</span>
              </div>
              {lastReceipt.customer_name && (
                <div className="flex justify-between">
                  <span>{t('customer', 'Customer:')}</span>
                  <span>{lastReceipt.customer_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t('cash', 'Payment:')}</span>
                <span>{lastReceipt.payment_method}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="pb-2 mb-2 border-b border-dashed border-black">
              <div className="grid grid-cols-12 font-bold pb-1 text-[11px] border-b border-gray-300">
                <span className="col-span-6">{t('item', 'Item')}</span>
                <span className="col-span-2 text-center">{t('qty', 'Qty')}</span>
                <span className="col-span-4 text-right">{t('total', 'Total')}</span>
              </div>
              <div className="divide-y divide-gray-100 text-[11px]">
                {lastReceipt.items.map((item: any, idx: number) => {
                  const qty = item.qty || item.quantity || 1;
                  return (
                    <div key={idx} className="py-1">
                      <div className="font-bold truncate">{item.name}</div>
                      <div className="flex justify-between text-gray-600 text-[10px]">
                        <span>{qty} x {formatPrice(item.price, store)}</span>
                        <span className="font-bold text-black">{formatPrice(item.total, store)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-black pb-2 mb-2">
              <div className="flex justify-between">
                <span>{t('subtotal', 'Subtotal:')}</span>
                <span>{formatPrice(lastReceipt.subtotal, store)}</span>
              </div>

              {lastReceipt.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{t('discount', 'Discount:')}</span>
                  <span>-{formatPrice(lastReceipt.discount, store)}</span>
                </div>
              )}

              {lastReceipt.tax > 0 && (
                <div className="flex justify-between">
                  <span>{t('tax', 'Tax (VAT):')}</span>
                  <span>{formatPrice(lastReceipt.tax, store)}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
                <span>{t('total', 'TOTAL:')}</span>
                <span>{formatPrice(lastReceipt.total, store)}</span>
              </div>

              {lastReceipt.payment_method === 'cash' && lastReceipt.tendered > 0 && (
                <>
                  <div className="flex justify-between pt-1">
                    <span>{t('tendered_cash', 'Tendered:')}</span>
                    <span>{formatPrice(lastReceipt.tendered, store)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('change_due', 'Change:')}</span>
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
            type="button"
            onClick={handleUnifiedPrint}
            disabled={isQzPrinting}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isQzPrinting ? t('processing', 'Printing...') : t('print_receipt', 'Print Receipt (80mm)')}</span>
          </button>

          <button
            type="button"
            onClick={closeReceiptModal}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('new_sale', 'New Sale')}</span>
          </button>
        </div>
      </div>

      {/* QZ Tray Setup Modal (Only for Managers / Admins) */}
      {isManager && (
        <QzTraySetupModal
          isOpen={isSetupModalOpen}
          onClose={() => setIsSetupModalOpen(false)}
          onSuccess={() => {
            setIsSetupModalOpen(false);
            handleUnifiedPrint();
          }}
        />
      )}
    </div>
  );
};
