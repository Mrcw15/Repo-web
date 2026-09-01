import React from 'react';
import { Loader2, Radio, Zap, ShieldCheck } from 'lucide-react';

interface ReachLoaderProps {
  channel: string;
}

export const ReachLoader: React.FC<ReachLoaderProps> = ({ channel }) => {
  return (
    <div 
      id="reach-loader-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full border border-emerald-500/40 shadow-2xl space-y-5 text-center relative overflow-hidden">
        {/* Glowing Background Ambient */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Animated Radial Pulse Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            Mengalirkan Reach WhatsApp
          </h3>
          <p className="text-xs text-slate-300 font-mono truncate px-4 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
            Target: {channel}
          </p>
        </div>

        {/* Progress Bar Animation */}
        <div className="space-y-2 text-left">
          <div className="flex justify-between items-center text-[11px] font-bold">
            <span className="text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 animate-bounce" />
              Menghubungkan API Gateway...
            </span>
            <span className="text-slate-400">Proses</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/60">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 animate-liquid-pulse w-full" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Enkripsi REST Protocol Aktif • Mohon tunggu sebentar</span>
        </div>
      </div>
    </div>
  );
};
