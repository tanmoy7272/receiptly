import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-500 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-200 bg-white text-slate-900',
    error: 'border-red-200 bg-white text-slate-900',
    warning: 'border-amber-200 bg-white text-slate-900',
    info: 'border-sky-200 bg-white text-slate-900',
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 z-50 flex flex-col gap-2 max-w-sm mx-auto sm:mx-0 pb-[env(safe-area-inset-bottom,0px)]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between gap-3 rounded-lg border p-3.5 shadow-lg transition-all transform translate-y-0 ${
            borders[toast.type] || borders.info
          }`}
          role="alert"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {icons[toast.type] || icons.info}
            <p className="text-xs font-semibold text-slate-800 truncate">{toast.message}</p>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded focus:outline-none"
            aria-label="Dismiss toast notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
