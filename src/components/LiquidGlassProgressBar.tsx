import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Zap, 
  Crown, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  Flame, 
  ChevronRight,
  Info,
  Lock
} from 'lucide-react';
import { soundFx } from '../utils/audio';

export interface LiquidGlassProgressBarProps {
  used: number;
  max: number;
  remaining: number;
  isUnlimited: boolean;
  isBlocked?: boolean;
  blockedReason?: string;
  onUpgradeClick?: () => void;
  variant?: 'hero' | 'card';
  className?: string;
}

export const LiquidGlassProgressBar: React.FC<LiquidGlassProgressBarProps> = ({
  used,
  max,
  remaining,
  isUnlimited,
  isBlocked = false,
  blockedReason,
  onUpgradeClick,
  variant = 'card',
  className = '',
}) => {
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = tomorrow.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeUntilReset(`${String(hours).padStart(2, '0')}j ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const effectiveMax = isBlocked ? 0 : max;
  const effectiveRemaining = isBlocked ? 0 : remaining;

  const percentage = isBlocked
    ? 0
    : isUnlimited
    ? 100
    : Math.max(0, Math.min(100, Math.round((effectiveRemaining / Math.max(1, effectiveMax)) * 100)));

  const isExhausted = !isUnlimited && !isBlocked && effectiveRemaining <= 0;
  const isLow = !isUnlimited && !isBlocked && effectiveRemaining > 0 && effectiveRemaining <= 3;

  let fillClass = 'liquid-progress-fill-emerald';
  let badgeBorderClass = 'border-emerald-500/40 text-emerald-800 dark:text-emerald-300 bg-emerald-500/20';
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let statusText = 'Optimal';

  if (isBlocked) {
    fillClass = 'liquid-progress-fill-rose';
    badgeBorderClass = 'border-rose-500/50 text-rose-300 bg-rose-500/20';
    glowColor = 'rgba(244, 63, 94, 0.4)';
    statusText = 'Akun Terblokir';
  } else if (isUnlimited) {
    fillClass = 'liquid-progress-fill-unlimited';
    badgeBorderClass = 'border-cyan-500/40 text-cyan-800 dark:text-cyan-300 bg-cyan-500/20';
    glowColor = 'rgba(6, 182, 212, 0.4)';
    statusText = 'VIP Unlimited';
  } else if (isExhausted) {
    fillClass = 'liquid-progress-fill-rose';
    badgeBorderClass = 'border-rose-500/40 text-rose-800 dark:text-rose-300 bg-rose-500/20';
    glowColor = 'rgba(244, 63, 94, 0.4)';
    statusText = 'Habis';
  } else if (isLow) {
    fillClass = 'liquid-progress-fill-amber';
    badgeBorderClass = 'border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-500/20';
    glowColor = 'rgba(245, 158, 11, 0.4)';
    statusText = 'Hampir Habis';
  }

  // Render Compact Hero Version
  if (variant === 'hero') {
    return (
      <div 
        id="hero-liquid-progress-tracker"
        className={`liquid-glass rounded-2xl p-4 sm:p-5 border border-white/80 dark:border-white/10 shadow-lg min-w-[270px] sm:min-w-[300px] space-y-3 transition-all duration-300 ${className}`}
      >
        {/* Top Header: Label + Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${isBlocked ? 'bg-rose-500 animate-pulse' : isUnlimited ? 'bg-cyan-500 animate-pulse' : isExhausted ? 'bg-rose-500' : 'bg-emerald-500 animate-liquid-droplet'}`} />
            <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Kuota Harian
            </span>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border flex items-center gap-1 ${badgeBorderClass}`}>
            {isBlocked ? (
              <>
                <Lock className="w-3 h-3 text-rose-400" /> Terkunci (0x)
              </>
            ) : isUnlimited ? (
              <>
                <Crown className="w-3 h-3" /> VIP Active
              </>
            ) : (
              `${effectiveRemaining}/${effectiveMax} Sisa`
            )}
          </span>
        </div>

        {/* Big Counter Metric */}
        <div className="flex items-baseline justify-between">
          <div className="text-2xl sm:text-3xl font-black flex items-center gap-1.5">
            {isBlocked ? (
              <span className="text-rose-400 font-black font-mono flex items-center gap-1.5 text-xl sm:text-2xl">
                <Lock className="w-5 h-5 text-rose-500" /> 0 / 0 Terkunci
              </span>
            ) : isUnlimited ? (
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent flex items-center gap-1.5 font-black">
                <Sparkles className="w-5 h-5 text-emerald-500 fill-emerald-500" /> Unlimited
              </span>
            ) : (
              <>
                <span className="text-emerald-700 dark:text-emerald-300 font-black font-mono">
                  {effectiveRemaining}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                  / {effectiveMax} reach tersisa
                </span>
              </>
            )}
          </div>

          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
            {isBlocked ? '0%' : isUnlimited ? '100%' : `${percentage}%`}
          </span>
        </div>

        {/* Liquid Glass Progress Bar Tube */}
        <div className="relative w-full h-3.5 rounded-full liquid-progress-track overflow-hidden p-0.5">
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 dark:from-white/20 to-transparent rounded-t-full pointer-events-none z-10" />

          {/* Liquid Fill */}
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${fillClass}`}
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-liquid-shimmer pointer-events-none" />
          </div>
        </div>

        {/* Footer Sub-Info: Reset Countdown */}
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-0.5 font-medium">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Reset: <strong className="font-mono text-slate-900 dark:text-white font-bold">{timeUntilReset}</strong></span>
          </span>

          {!isBlocked && !isUnlimited && onUpgradeClick && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onUpgradeClick();
              }}
              className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5"
            >
              <span>Upgrade</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render Full Standalone Card Variant
  return (
    <div 
      id="liquid-glass-daily-limit-tracker"
      className={`liquid-glass rounded-3xl p-5 sm:p-6 border border-white/70 dark:border-white/10 shadow-xl space-y-4 relative overflow-hidden transition-all duration-300 ${className}`}
    >
      <div 
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40"
        style={{ backgroundColor: glowColor }}
      />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border shadow-sm ${
            isBlocked
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              : isUnlimited 
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
              : isExhausted 
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
          }`}>
            {isBlocked ? <Lock className="w-4 h-4" /> : isUnlimited ? <Crown className="w-4 h-4" /> : isExhausted ? <ShieldAlert className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Daily Reach Usage Tracker
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeBorderClass}`}>
                {statusText}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {isBlocked
                ? 'Akun Anda dinonaktifkan oleh Administrator (Limit harian 0x).'
                : isUnlimited 
                ? 'Akun VIP: Akses tanpa batas kuota harian'
                : `Tersisa ${effectiveRemaining} dari total kuota ${effectiveMax} reach gratis hari ini`}
            </p>
          </div>
        </div>

        {/* Time Reset Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-800/70 border border-slate-300/50 dark:border-slate-700/50 text-xs text-slate-700 dark:text-slate-300 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[11px] font-semibold">
            Reset: <strong className="font-mono text-slate-900 dark:text-white">{timeUntilReset}</strong>
          </span>
        </div>
      </div>

      {/* The Liquid Glass Tube Visualizer */}
      <div className="space-y-2 relative z-10">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>Status Penggunaan:</span>
            <strong className="text-slate-900 dark:text-white font-bold">
              {isBlocked ? 'Terkunci (0/0)' : isUnlimited ? 'Aktif (Unlimited)' : `${used} Digunakan (${Math.round((used / Math.max(1, effectiveMax)) * 100)}%)`}
            </strong>
          </span>

          <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-bold">
            {isBlocked ? '0 / 0 Terkunci' : isUnlimited ? '∞ / ∞' : `${effectiveRemaining} / ${effectiveMax} Tersisa`}
          </span>
        </div>

        {/* Master Liquid Glass Gauge Bar */}
        <div className="relative w-full h-5 rounded-2xl liquid-progress-track overflow-hidden p-1">
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 dark:from-white/20 to-transparent rounded-2xl pointer-events-none z-20" />

          <div
            className={`h-full rounded-xl transition-all duration-700 ease-out relative overflow-hidden ${fillClass}`}
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-liquid-shimmer pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Action Notice */}
      {isBlocked ? (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-3 text-xs">
          <Lock className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-rose-200">
            <span className="font-bold">Akun Terblokir: </span>
            <span>{blockedReason || 'Akun Anda telah dinonaktifkan oleh Administrator. Hubungi admin untuk membuka blokir.'}</span>
          </div>
        </div>
      ) : isUnlimited ? (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Akun VIP Anda aktif dengan prioritas server dan kuota unlimited.</span>
          </div>
          <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] uppercase shrink-0">
            VIP Active
          </span>
        </div>
      ) : isExhausted ? (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-medium">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Kuota harian 10x Anda telah habis. Upgrade ke VIP untuk akses tanpa batas.</span>
          </div>
          {onUpgradeClick && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onUpgradeClick();
              }}
              className="glass-btn px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm shrink-0"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Upgrade VIP</span>
            </button>
          )}
        </div>
      ) : isLow ? (
        <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Sisa kuota menipis ({remaining} tersisa). Upgrade VIP jika butuh boost tambahan.</span>
          </div>
          {onUpgradeClick && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onUpgradeClick();
              }}
              className="text-amber-800 dark:text-amber-300 font-bold hover:underline flex items-center gap-0.5 shrink-0"
            >
              <span>Voucher VIP</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};
