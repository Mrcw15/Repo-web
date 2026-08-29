import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { soundFx } from '../utils/audio';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const BrutalistToast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-18 right-3 sm:right-6 z-50 flex flex-col gap-2.5 max-w-xs sm:max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderGlow = 'border-sky-500/40 text-sky-600 dark:text-sky-400 bg-sky-500/10';
        let Icon = Info;

        if (toast.type === 'success') {
          borderGlow = 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
          Icon = CheckCircle2;
        } else if (toast.type === 'error') {
          borderGlow = 'border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10';
          Icon = XCircle;
        } else if (toast.type === 'warning') {
          borderGlow = 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10';
          Icon = AlertTriangle;
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className="pointer-events-auto liquid-glass rounded-2xl p-3 sm:p-3.5 shadow-xl border border-white/60 dark:border-white/10 transform transition-all duration-300 animate-in slide-in-from-top-3 fade-in"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <div className={`p-1.5 rounded-xl border ${borderGlow} shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {toast.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed break-words">
                    {toast.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  soundFx.playClick();
                  onDismiss(toast.id);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
