import React from 'react';
import { usePosStore } from '../store/usePosStore';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notification } = usePosStore();

  if (!notification) return null;

  const isSuccess = notification.type === 'success';
  const isError = notification.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md ${
          isSuccess
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
            : isError
            ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
            : 'bg-slate-900/90 border-blue-500/40 text-slate-200'
        }`}
      >
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
        {isError && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-400 shrink-0" />}

        <span className="text-xs font-semibold">{notification.message}</span>
      </div>
    </div>
  );
};
