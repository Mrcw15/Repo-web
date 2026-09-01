import React from 'react';
import { Volume2, VolumeX, Shield, Sparkles, Zap, LogOut, User } from 'lucide-react';
import { soundFx } from '../utils/audio';
import type { UserProfile } from '../utils/storage';
import { VIPBadge } from './VIPBadge';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userProfile: UserProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  userProfile,
  soundEnabled,
  onToggleSound,
  onLogout,
}) => {
  const isPremium = userProfile.role === 'premium' || userProfile.role === 'admin';
  const displayUsername = userProfile.username || userProfile.nickname || 'User';

  return (
    <header className="sticky top-0 z-40 px-2 sm:px-6 pt-2 sm:pt-3 pb-1 transition-all w-full overflow-x-hidden">
      {/* Liquid Glass Floating Header Container */}
      <div className="max-w-6xl mx-auto liquid-glass-dock rounded-2xl px-2.5 sm:px-5 py-1.5 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-3 bg-slate-900/85 border border-white/10 shadow-xl backdrop-blur-sm">
        {/* Brand Logo with Glow Badge */}
        <div 
          onClick={() => {
            soundFx.playClick();
            onTabChange('reach');
          }}
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group select-none shrink-0"
          id="header-brand-logo"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-black text-xs sm:text-sm group-hover:scale-105 transition-transform shrink-0">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-sm sm:text-lg font-extrabold tracking-tight text-white leading-none">
                WA Reach
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium hidden md:inline -mt-0.5">
              Channel Growth Engine
            </span>
          </div>
        </div>

        {/* Header Right Actions - Responsive, Compact & 100% Mobile Safe */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* User Profile Pill */}
          <div 
            className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[10px] sm:text-xs text-slate-200 shrink-0"
            title={`Login sebagai @${displayUsername}`}
          >
            <div 
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white shadow-xs shrink-0"
              style={{ backgroundColor: userProfile.avatarColor || '#10B981' }}
            >
              {displayUsername.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold max-w-[50px] min-[370px]:max-w-[70px] sm:max-w-[120px] truncate">
              @{displayUsername}
            </span>
          </div>

          {/* User Role VIP Badge */}
          <VIPBadge
            role={userProfile.role}
            premiumExpiresAt={userProfile.premiumExpiresAt}
            size="sm"
            onClick={() => {
              soundFx.playClick();
              onTabChange('premium');
            }}
          />

          {/* Action Icon Buttons Group */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Sound Toggle Button */}
            <button
              onClick={onToggleSound}
              id="header-sound-toggle-btn"
              className={`glass-btn w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800/50 text-slate-400 border-slate-700/40'
              }`}
              title={soundEnabled ? 'Mute Audio' : 'Nyalakan Audio'}
            >
              {soundEnabled ? <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            </button>

            {/* Admin Panel Button (Admin Only) */}
            {userProfile.role === 'admin' && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  onTabChange('admin');
                }}
                id="header-admin-nav-btn"
                className={`glass-btn w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                  currentTab === 'admin'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-xs'
                    : 'bg-slate-800/50 text-slate-400 border-slate-700/40 hover:bg-slate-800'
                }`}
                title="Admin Dashboard"
              >
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={() => {
                soundFx.playClick();
                onLogout();
              }}
              id="header-logout-btn"
              className="glass-btn w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/40 hover:border-rose-500/30 transition-all shrink-0"
              title="Keluar / Ganti Akun"
            >
              <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
