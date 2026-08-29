import React from 'react';
import { Crown, Sparkles, Shield, Clock, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { UserRole } from '../utils/storage';

interface VIPBadgeProps {
  role: UserRole;
  premiumExpiresAt?: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
  onClick?: () => void;
}

export const VIPBadge: React.FC<VIPBadgeProps> = ({
  role,
  premiumExpiresAt,
  size = 'md',
  showDetails = false,
  className = '',
  onClick,
}) => {
  const isPremium = role === 'premium' || role === 'admin';
  const isAdmin = role === 'admin';

  // Calculate days remaining if applicable
  const getRemainingDaysText = () => {
    if (isAdmin) return 'Lifetime VIP';
    if (!premiumExpiresAt) return 'VIP Aktif';
    const diff = premiumExpiresAt - Date.now();
    if (diff <= 0) return 'Kedaluwarsa';
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `${days} Hari Aktif`;
  };

  const remainingText = getRemainingDaysText();

  // Size specific styling
  const sizeClasses = {
    sm: 'text-[10px] sm:text-[11px] px-2 py-0.5 gap-1 rounded-lg shrink-0',
    md: 'text-xs px-3 py-1 gap-1.5 rounded-xl shrink-0',
    lg: 'text-sm px-4 py-2 gap-2 rounded-2xl shrink-0',
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0',
    md: 'w-3.5 h-3.5 shrink-0',
    lg: 'w-4.5 h-4.5 shrink-0',
  };

  if (isAdmin) {
    return (
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`inline-flex items-center font-bold tracking-wide border shadow-md select-none whitespace-nowrap ${sizeClasses[size]} ${
          onClick ? 'cursor-pointer' : ''
        } bg-gradient-to-r from-rose-500/20 via-fuchsia-500/20 to-purple-600/20 text-rose-300 border-rose-500/40 shadow-rose-500/10 ${className}`}
      >
        <Shield className={`${iconSizes[size]} text-rose-400 fill-rose-400/30`} />
        <span>OWNER VIP</span>
        {showDetails && (
          <span className="text-[10px] text-rose-300/80 font-medium pl-1 border-l border-rose-500/30">
            {remainingText}
          </span>
        )}
      </motion.div>
    );
  }

  if (isPremium) {
    return (
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`inline-flex items-center font-bold tracking-wide border shadow-md relative overflow-hidden select-none whitespace-nowrap ${sizeClasses[size]} ${
          onClick ? 'cursor-pointer' : ''
        } bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-600/20 text-amber-300 border-amber-400/40 shadow-amber-500/15 ${className}`}
      >
        {/* Shimmer animation sweep */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 2.8, ease: 'linear' }}
          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
        />

        <Crown className={`${iconSizes[size]} text-amber-400 fill-amber-400 animate-pulse`} />
        <span className="font-extrabold tracking-wider">VIP MEMBER</span>
        
        {showDetails && (
          <div className="flex items-center gap-1 text-[10px] text-amber-200/90 font-medium pl-1.5 border-l border-amber-400/30">
            <Clock className="w-2.5 h-2.5" />
            <span>{remainingText}</span>
          </div>
        )}
      </motion.div>
    );
  }

  if (role === 'blocked') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center font-bold tracking-wide border shadow-md select-none whitespace-nowrap ${sizeClasses[size]} ${
          onClick ? 'cursor-pointer' : ''
        } bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-950/20 ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
        <span>TERBLOKIR (0x)</span>
      </div>
    );
  }

  // Free Tier
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center font-medium border text-slate-400 bg-slate-800/60 border-slate-700/60 select-none whitespace-nowrap ${sizeClasses[size]} ${
        onClick ? 'cursor-pointer hover:border-slate-600 hover:text-slate-200' : ''
      } ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
      <span>Free</span>
      {showDetails && (
        <span className="text-[10px] text-slate-500 pl-1 border-l border-slate-700/50">
          10x/Hari
        </span>
      )}
    </div>
  );
};
