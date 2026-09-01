import React from 'react';
import { Sparkles } from 'lucide-react';
import { VIPBadge } from './VIPBadge';
import { LiquidGlassProgressBar } from './LiquidGlassProgressBar';
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
  onNavigateTab,
}) => {
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
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
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
    </div>
  );
};
