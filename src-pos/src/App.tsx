import React, { useEffect, useState } from 'react';
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
import { AdminLayout } from './components/admin/AdminLayout';
import { OpenShiftModal } from './components/shifts/OpenShiftModal';
import { CloseShiftModal } from './components/shifts/CloseShiftModal';
import { ResumeShiftModal } from './components/shifts/ResumeShiftModal';
import { CashMovementModal } from './components/shifts/CashMovementModal';
import { RefreshCw, Zap } from 'lucide-react';

export const App: React.FC = () => {
  const {
    initialize,
    isLoadingInit,
    handleBarcodeScan,
    initData,
    activeView,
    setActiveView,
    adminSettings,
    currentShift,
    fetchCurrentShift,
    setCurrentShift,
    isOpenShiftModalOpen,
    setIsOpenShiftModalOpen,
    isCloseShiftModalOpen,
    setIsCloseShiftModalOpen,
    isCashMovementModalOpen,
    setIsCashMovementModalOpen,
  } = usePosStore();

  const isDirectControl = (adminSettings?.inventory_mode || window.omniPosConfig?.inventoryMode) === 'omni_pos';

  // Shift resume state on session start
  const [isResumeShiftModalOpen, setIsResumeShiftModalOpen] = useState(false);
  const [hasCheckedShiftSession, setHasCheckedShiftSession] = useState(false);

  // Check shift status when entering POS Terminal (only in Direct Control mode)
  useEffect(() => {
    if (activeView === 'pos' && isDirectControl && !hasCheckedShiftSession && !isLoadingInit && initData) {
      setHasCheckedShiftSession(true);
      fetchCurrentShift().then((shift) => {
        if (shift && shift.status === 'open') {
          // Previously opened shift is still active -> ask cashier if they want to continue or close & start new
          setIsResumeShiftModalOpen(true);
        } else {
          // No open shift -> prompt to open register shift
          setIsOpenShiftModalOpen(true);
        }
      });
    }
  }, [activeView, isDirectControl, hasCheckedShiftSession, isLoadingInit, initData, fetchCurrentShift]);

  // 1. Hardware Barcode Scanner integration (Global listener active during POS mode)
  useBarcodeScanner({
    onScan: (barcode) => {
      if (activeView === 'pos') {
        handleBarcodeScan(barcode);
      }
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

  // 3. Render Dedicated Standalone Admin Hub (Only in Direct Control Mode)
  if (activeView === 'admin' && isDirectControl) {
    return (
      <>
        <AdminLayout />
        <NotificationToast />
      </>
    );
  }

  // 4. Render POS Register
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

      {/* Shift Flow Modals */}
      {isDirectControl && (
        <>
          {/* Ask to continue active shift or close it */}
          <ResumeShiftModal
            isOpen={isResumeShiftModalOpen}
            shift={currentShift}
            onContinue={() => {
              setIsResumeShiftModalOpen(false);
            }}
            onCloseAndStartNew={() => {
              setIsResumeShiftModalOpen(false);
              setIsCloseShiftModalOpen(true);
            }}
          />

          {/* Open Shift Modal */}
          <OpenShiftModal
            isOpen={isOpenShiftModalOpen}
            onClose={() => setIsOpenShiftModalOpen(false)}
            onShiftOpened={(shift) => {
              setCurrentShift(shift);
              setIsOpenShiftModalOpen(false);
            }}
          />

          {/* Close Shift Modal */}
          <CloseShiftModal
            isOpen={isCloseShiftModalOpen}
            onClose={() => setIsCloseShiftModalOpen(false)}
            shift={currentShift}
            onShiftClosed={() => {
              setCurrentShift(null);
              setIsCloseShiftModalOpen(false);
              // Prompt to open new shift
              setIsOpenShiftModalOpen(true);
            }}
          />

          {/* Cash In / Cash Out Movement Modal */}
          <CashMovementModal
            isOpen={isCashMovementModalOpen}
            onClose={() => setIsCashMovementModalOpen(false)}
            onMovementLogged={(updatedShift) => {
              setCurrentShift(updatedShift);
            }}
          />
        </>
      )}
    </div>
  );
};

export default App;

