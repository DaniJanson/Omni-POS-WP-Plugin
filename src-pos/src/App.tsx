import React, { useEffect } from 'react';
import { usePosStore } from './store/usePosStore';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { PosHeader } from './components/PosHeader';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { OrdersModal } from './components/OrdersModal';
import { CustomerModal } from './components/CustomerModal';
import { SyncProgressModal } from './components/SyncProgressModal';
import { NotificationToast } from './components/NotificationToast';
import { RefreshCw, Zap } from 'lucide-react';

export const App: React.FC = () => {
  const {
    initialize,
    isLoadingInit,
    handleBarcodeScan,
    initData,
  } = usePosStore();

  // 1. Hardware Barcode Scanner integration (Global listener)
  useBarcodeScanner({
    onScan: (barcode) => {
      handleBarcodeScan(barcode);
    },
    maxDelay: initData?.settings.barcode_delay || 50,
  });

  // 2. Initialize store & IndexedDB on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoadingInit && !initData) {
    return (
      <div className="h-screen w-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20 ring-1 ring-white/20 animate-pulse">
          <Zap className="w-8 h-8 text-white fill-white/40" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">Omni POS</h2>
        <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span>Initializing POS system...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0f19] overflow-hidden">
      {/* Top Header */}
      <PosHeader />

      {/* Main POS Interface (Product Catalog Left + Cart Right) */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <ProductGrid />
        <Cart />
      </main>

      {/* Modals & Overlays */}
      <PaymentModal />
      <ReceiptModal />
      <OrdersModal />
      <CustomerModal />
      <SyncProgressModal />
      <NotificationToast />
    </div>
  );
};

export default App;
