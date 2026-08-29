import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Calendar 
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { VIPBadge } from './VIPBadge';
import { LiquidGlassProgressBar } from './LiquidGlassProgressBar';
import { soundFx } from '../utils/audio';
import type { ReachHistoryItem, UserRole } from '../utils/storage';

interface UnifiedReachHeroProps {
  userProfile: {
    username: string;
    role: UserRole;
    avatarColor?: string;
    premiumExpiresAt?: number;
    isBlocked?: boolean;
    blockedReason?: string;
  };
  limitState: {
    used: number;
    max: number;
    remaining: number;
    isUnlimited: boolean;
    isBlocked?: boolean;
  };
  history: ReachHistoryItem[];
  onNavigateTab: (tab: string) => void;
}

export const UnifiedReachHero: React.FC<UnifiedReachHeroProps> = ({
  userProfile,
  limitState,
  history,
  onNavigateTab,
}) => {
  const [showChart, setShowChart] = useState(false);
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');

  // Live midnight countdown
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const remainingMs = Math.max(0, endOfDay.getTime() - now.getTime());

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

  // 7-day chart data
  const last7DaysData = React.useMemo(() => {
    const days: { dateStr: string; label: string; boosts: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const label = i === 0 ? 'Hari Ini' : `${dayNames[d.getDay()]} (${day}/${month})`;

      let boosts = 0;
      history.forEach((h) => {
        const itemDate = new Date(h.timestamp);
        const itemDateStr = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
        if (itemDateStr === dateStr && h.status === 'success') {
          boosts += 1;
        }
      });

      if (i === 0 && limitState.used > boosts) {
        boosts = limitState.used;
      }

      days.push({
        dateStr,
        label,
        boosts,
      });
    }

    return days;
  }, [history, limitState.used]);

  const total7DaysBoosts = last7DaysData.reduce((acc, d) => acc + d.boosts, 0);

  return (
    <div 
      id="unified-reach-hero-panel"
      className="liquid-glass rounded-3xl p-5 sm:p-7 border border-white/70 dark:border-white/10 shadow-xl relative overflow-hidden space-y-6"
    >
      {/* Background Soft Glow Ambience */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Main Info */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>WhatsApp Channel Growth Engine</span>
            </div>
            <VIPBadge role={userProfile.role} premiumExpiresAt={userProfile.premiumExpiresAt} size="sm" />
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Tingkatkan Reach{' '}
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              WhatsApp Channel
            </span>{' '}
            Secara Instan
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Otomatisasi pengiriman sinyal interaksi & views channel WhatsApp publik melalui REST API berkecepatan tinggi tanpa login kredensial.
          </p>
        </div>

        {/* Hero Quota Status */}
        <div className="w-full lg:w-72 shrink-0">
          <LiquidGlassProgressBar
            used={limitState.used}
            max={limitState.max}
            remaining={limitState.remaining}
            isUnlimited={limitState.isUnlimited}
            isBlocked={limitState.isBlocked || userProfile.role === 'blocked' || !!userProfile.isBlocked}
            blockedReason={userProfile.blockedReason}
            onUpgradeClick={() => onNavigateTab('premium')}
            variant="hero"
          />
        </div>
      </div>

      {/* Sub-Banner: Unified Countdown + Activity Metric Pills + Chart Toggle */}
      <div className="relative z-10 pt-4 border-t border-slate-200/50 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Countdown Pill */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Reset Kuota Harian
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                00:00
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
              <span className="text-emerald-600 dark:text-emerald-400">{hours}</span>
              <span className="text-slate-400 animate-pulse">:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{minutes}</span>
              <span className="text-slate-400 animate-pulse">:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{seconds}</span>
              <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-1 font-sans">lagi</span>
            </div>
          </div>
        </div>

        {/* Stats and Toggle Chart */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/40 dark:border-slate-700/40 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">7 Hari:</span>
            <span className="font-extrabold text-slate-900 dark:text-white font-mono">{total7DaysBoosts}x</span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setShowChart((prev) => !prev);
            }}
            className="glass-btn px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{showChart ? 'Tutup Grafik' : 'Grafik Aktivitas'}</span>
            {showChart ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Lightweight Activity Chart */}
      <AnimatePresence>
        {showChart && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden pt-2"
          >
            <div className="rounded-2xl p-4 sm:p-5 bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/70 space-y-2">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Tren Pengiriman Reach 7 Hari Terakhir
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Rata-rata: {(total7DaysBoosts / 7).toFixed(1)}/hari
                </span>
              </div>

              <div className="w-full h-40 sm:h-48 pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last7DaysData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="heroAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="liquid-glass rounded-xl p-2.5 border border-emerald-500/40 bg-slate-900/95 shadow-2xl text-xs space-y-1">
                              <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px]">
                                <Calendar className="w-3 h-3 text-emerald-400" />
                                <span>{label}</span>
                              </div>
                              <div className="text-xs font-black text-emerald-400 font-mono">
                                {payload[0].value}x Boost
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="boosts"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#heroAreaGradient)"
                      activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2, fill: '#ffffff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
