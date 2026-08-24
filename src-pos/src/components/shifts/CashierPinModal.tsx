import React, { useState } from 'react';
import { posApi } from '../../services/api';
import { usePosStore } from '../../store/usePosStore';
import { X, Lock, Delete, RotateCw, CheckCircle2 } from 'lucide-react';

interface CashierPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCashierSwitched: (cashierName: string) => void;
}

export const CashierPinModal: React.FC<CashierPinModalProps> = ({
  isOpen,
  onClose,
  onCashierSwitched,
}) => {
  const { showNotification } = usePosStore();
  const [pin, setPin] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleDigitClick = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMessage('');
      if (newPin.length >= 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  const verifyPin = async (pinToVerify: string) => {
    setIsVerifying(true);
    try {
      const resp = await posApi.verifyCashierPin(pinToVerify);
      if (resp.success && resp.cashier) {
        showNotification(`Welcome back, ${resp.cashier.name}!`, 'success');
        onCashierSwitched(resp.cashier.name);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid PIN code');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 text-center">
        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Icon & Title */}
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/10 border border-blue-200 dark:border-blue-500/20">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          Cashier Switch PIN
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Enter your 4-digit security PIN to switch register
        </p>

        {/* PIN Masked Dots */}
        <div className="flex justify-center space-x-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-blue-600 border-blue-600 scale-110'
                  : 'bg-transparent border-slate-300 dark:border-slate-700'
              }`}
            />
          ))}
        </div>

        {errorMessage && (
          <div className="mb-4 text-xs font-semibold text-red-600 dark:text-red-400 animate-shake">
            {errorMessage}
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitClick(digit)}
              disabled={isVerifying}
              className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shadow-xs"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            disabled={isVerifying}
            className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shadow-xs"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center active:scale-95 transition-all"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {isVerifying && (
          <div className="flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium mt-4">
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
            <span>Verifying PIN...</span>
          </div>
        )}
      </div>
    </div>
  );
};
