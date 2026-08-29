import React from 'react';
import { Target, MessageSquare, Crown, User } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface FooterNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  unreadChatCount?: number;
}

export const FooterNav: React.FC<FooterNavProps> = ({
  currentTab,
  onTabChange,
  unreadChatCount = 0,
}) => {
  const navItems = [
    {
      id: 'reach',
      label: 'Boost',
      shortLabel: 'Boost',
      icon: Target,
      activeColor: 'text-emerald-300 font-black',
      activeBg: 'bg-emerald-500/20 border-emerald-500/40 shadow-sm',
    },
    {
      id: 'chat',
      label: 'Global Chat',
      shortLabel: 'Chat',
      icon: MessageSquare,
      activeColor: 'text-cyan-300 font-black',
      activeBg: 'bg-cyan-500/20 border-cyan-500/40 shadow-sm',
      badge: unreadChatCount > 0 ? unreadChatCount : null,
    },
    {
      id: 'premium',
      label: 'VIP Upgrade',
      shortLabel: 'VIP',
      icon: Crown,
      activeColor: 'text-amber-300 font-black',
      activeBg: 'bg-amber-500/20 border-amber-500/40 shadow-sm',
    },
    {
      id: 'owner',
      label: 'Developer',
      shortLabel: 'Dev',
      icon: User,
      activeColor: 'text-rose-300 font-black',
      activeBg: 'bg-rose-500/20 border-rose-500/40 shadow-sm',
    },
  ];

  return (
    <div className="fixed bottom-2 sm:bottom-5 left-0 right-0 z-40 flex justify-center px-2 sm:px-4 pointer-events-none w-full">
      <nav 
        id="global-footer-nav" 
        className="pointer-events-auto liquid-glass-dock rounded-full p-1 sm:p-1.5 shadow-2xl flex items-center gap-1 sm:gap-2 max-w-[96%] sm:max-w-md w-full justify-between backdrop-blur-2xl border border-white/15 bg-slate-900/90"
      >
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => {
                soundFx.playClick();
                onTabChange(item.id);
              }}
              className={`relative flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-3 rounded-full transition-all duration-200 glass-btn border ${
                isActive
                  ? `${item.activeBg} ${item.activeColor}`
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60 font-semibold'
              }`}
            >
              {/* Notification Badge */}
              {item.badge && (
                <span className="absolute -top-1 right-1 sm:right-2 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {item.badge}
                </span>
              )}

              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform ${isActive ? 'scale-110 text-white' : ''}`} />
              <span className="text-[11px] sm:text-xs tracking-tight whitespace-nowrap hidden min-[340px]:inline">
                <span className="inline min-[400px]:hidden">{item.shortLabel}</span>
                <span className="hidden min-[400px]:inline">{item.label}</span>
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
