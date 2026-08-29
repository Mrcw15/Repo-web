import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'premium';
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-24 right-4 sm:right-8 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4500);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const bgColors = {
    success: 'bg-[#B4FF00]',
    error: 'bg-[#FF6B6B]',
    info: 'bg-[#FFEB3B]',
    premium: 'bg-[#FF2E93] text-white',
  };

  const icons = {
    success: <CheckCircle className="w-6 h-6 text-black" />,
    error: <AlertTriangle className="w-6 h-6 text-black" />,
    info: <Info className="w-6 h-6 text-black" />,
    premium: <Sparkles className="w-6 h-6 text-yellow-300 fill-yellow-300" />,
  };

  return (
    <div
      className={`pointer-events-auto border-[4px] border-black p-4 ${
        bgColors[toast.type]
      } brutal-shadow-md animate-toast-in relative transition-all`}
    >
      {/* Decorative Washi Tape on top */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] font-black px-3 py-0.5 border-[2px] border-black rotate-[-2deg] tracking-widest uppercase">
        NOTICE
      </div>

      <div className="flex items-start gap-3 mt-1">
        <div className="shrink-0 p-1 bg-white border-[2px] border-black brutal-shadow-sm">
          {icons[toast.type]}
        </div>

        <div className="flex-1">
          <h4 className="font-heading text-sm uppercase font-black tracking-tight leading-tight">
            {toast.title}
          </h4>
          <p className="text-xs font-bold mt-1 text-black leading-snug break-words">
            {toast.message}
          </p>

          {toast.actionText && toast.onAction && (
            <button
              onClick={() => {
                sound.playClick();
                toast.onAction?.();
              }}
              className="mt-2 text-xs font-black bg-white text-black border-[2px] border-black px-2.5 py-1 brutal-shadow-sm brutal-btn hover:bg-black hover:text-white uppercase inline-block"
            >
              {toast.actionText} →
            </button>
          )}
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onDismiss(toast.id);
          }}
          className="shrink-0 p-1 bg-white border-[2px] border-black brutal-shadow-sm hover:bg-black hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
