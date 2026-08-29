import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  RefreshCw, 
  Sparkles, 
  Zap, 
  Crown, 
  CheckCircle2, 
  Flame,
  ArrowRight,
  Info
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface ResetCountdownTimerProps {
  isUnlimited: boolean;
  remaining: number;
  max: number;
  onUpgradeClick?: () => void;
  onResetManual?: () => void;
  className?: string;
  variant?: 'compact' | 'full';
}

export const ResetCountdownTimer: React.FC<ResetCountdownTimerProps> = ({
  isUnlimited,
  remaining,
  max,
  onUpgradeClick,
  onResetManual,
  className = '',
  variant = 'full',
}) => {
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');
  const [progressDay, setProgressDay] = useState(0);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);

      const totalDayMs = 24 * 60 * 60 * 1000;
      const elapsedMs = now.getTime() - startOfDay.getTime();
      const remainingMs = Math.max(0, endOfDay.getTime() - now.getTime());

      const pct = Math.min(100, Math.max(0, (elapsedMs / totalDayMs) * 100));
      setProgressDay(pct);

      const h = Math.floor(remainingMs / (1000 * 60 * 60));
      const m = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((remainingMs % (1000 * 60)) / 1000);

      setHours(String(h).padStart(2, '0'));
      setMinutes(String(m).padStart(2, '0'));
      setSeconds(String(s).padStart(2, '0'));
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (variant === 'compact') {
    return (
      <div 
        id="reset-countdown-compact"
        className={`liquid-glass rounded-2xl p-3 sm:p-3.5 border border-white/70 dark:border-white/10 shadow-sm flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Reset Kuota Harian
            </span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Pukul 00:00 (Tengah Malam)
            </span>
          </div>
        </div>

        {/* Live Digits Box */}
        <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-black bg-slate-900/5 dark:bg-slate-950/40 px-2.5 py-1 rounded-xl border border-slate-300/40 dark:border-slate-800">
          <span className="text-emerald-600 dark:text-emerald-400">{hours}</span>
          <span className="text-slate-400 animate-pulse">:</span>
          <span className="text-emerald-600 dark:text-emerald-400">{minutes}</span>
          <span className="text-slate-400 animate-pulse">:</span>
          <span className="text-emerald-600 dark:text-emerald-400">{seconds}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="reset-countdown-card"
      className={`liquid-glass rounded-3xl p-5 sm:p-6 border border-white/70 dark:border-white/10 shadow-lg space-y-4 relative overflow-hidden ${className}`}
    >
      {/* Background Liquid Ambience */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-0.5 shadow-sm shadow-emerald-500/20">
            <div className="w-full h-full rounded-2xl bg-white/90 dark:bg-slate-900/90 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Countdown Reset Kuota Harian
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                Otomatis
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Kuota harian 10x reach akun free akan terisi kembali otomatis
            </p>
          </div>
        </div>

        {/* Replenish Schedule Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-200/50 dark:bg-slate-800/60 border border-slate-300/40 dark:border-slate-700/50 text-[11px] font-semibold text-slate-700 dark:text-slate-300 self-start sm:self-auto">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Replenish: <strong>00:00:00</strong></span>
        </div>
      </div>

      {/* Digital Countdown Timer Pods */}
      <div className="relative z-10">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {/* Hours Card */}
          <div className="liquid-glass rounded-2xl p-3 sm:p-4 text-center border border-white/80 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-slate-900 dark:text-white">
              {hours}
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-0.5">
              Jam
            </span>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500/40 rounded-b-2xl" />
          </div>

          {/* Minutes Card */}
          <div className="liquid-glass rounded-2xl p-3 sm:p-4 text-center border border-white/80 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-slate-900 dark:text-white">
              {minutes}
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-0.5">
              Menit
            </span>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-teal-500/40 rounded-b-2xl" />
          </div>

          {/* Seconds Card */}
          <div className="liquid-glass rounded-2xl p-3 sm:p-4 text-center border border-white/80 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-emerald-600 dark:text-emerald-400">
              {seconds}
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-0.5">
              Detik
            </span>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-cyan-500/40 rounded-b-2xl" />
          </div>
        </div>
      </div>

      {/* Day Progress Tube */}
      <div className="space-y-1.5 relative z-10">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1">
            <span>Siklus Hari Ini:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
              {Math.round(progressDay)}% Berjalan
            </strong>
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-mono">
            Tersisa {hours}j {minutes}m {seconds}s
          </span>
        </div>

        <div className="w-full h-2 rounded-full liquid-progress-track p-0.5 overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progressDay}%` }}
          />
        </div>
      </div>

      {/* Info & Action Banner */}
      <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border-t border-slate-200/60 dark:border-slate-800/80 relative z-10">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Info className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            {isUnlimited 
              ? 'Akun Anda berstatus VIP tanpa batasan kuota reset.'
              : `Kuota aktif: ${remaining}/${max} reach tersisa untuk hari ini.`}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!isUnlimited && onUpgradeClick && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onUpgradeClick();
              }}
              className="glass-btn flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Bypass Kuota VIP</span>
            </button>
          )}

          {onResetManual && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onResetManual();
              }}
              className="glass-btn px-2.5 py-1.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-300/40 dark:border-slate-700/50 text-[11px] font-bold flex items-center gap-1"
              title="Reset kuota untuk testing"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
