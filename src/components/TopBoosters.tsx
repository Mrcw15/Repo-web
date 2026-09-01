import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  Crown, 
  X, 
  Medal, 
  ArrowUpRight, 
  Users, 
  RefreshCw, 
  Zap,
  TrendingUp,
  Trash2,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  subscribeTopBoosters, 
  removeUserFromLeaderboard, 
  clearAllLeaderboard,
  type TopBoosterItem 
} from '../services/firebaseService';
import { soundFx } from '../utils/audio';
import { VIPBadge } from './VIPBadge';

interface TopBoostersProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername?: string;
  userRole?: string;
  onSelectUser?: (username: string) => void;
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const TopBoosters: React.FC<TopBoostersProps> = ({
  isOpen,
  onClose,
  currentUsername,
  userRole,
  onSelectUser,
  onShowToast,
}) => {
  const [boosters, setBoosters] = useState<TopBoosterItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);

  // Check if current user is admin strictly by verified user role
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeTopBoosters((data) => {
      setBoosters(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const totalAllBoosts = boosters.reduce((acc, curr) => acc + (curr.totalBoosts || 0), 0);

  const handleDeleteUser = async (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    if (!isAdmin) return;

    if (!confirm(`Hapus @${username} dari Top Leaderboard?`)) {
      return;
    }

    soundFx.playClick();
    setDeletingUser(username);

    try {
      const ok = await removeUserFromLeaderboard(username);
      if (ok) {
        soundFx.playSuccess();
        if (onShowToast) {
          onShowToast('success', 'User Dihapus', `@${username} telah dihapus dari leaderboard.`);
        }
      } else {
        soundFx.playError();
        if (onShowToast) {
          onShowToast('error', 'Gagal Menghapus', 'Gagal memperbarui status user di Firebase.');
        }
      }
    } catch {
      soundFx.playError();
    } finally {
      setDeletingUser(null);
    }
  };

  const handleClearAllLeaderboard = async () => {
    if (!isAdmin) return;

    if (!confirm('Peringatan: Apakah Anda yakin ingin mereset dan membersihkan SEMUA data leaderboard?')) {
      return;
    }

    soundFx.playClick();
    setIsClearingAll(true);

    try {
      const ok = await clearAllLeaderboard();
      if (ok) {
        soundFx.playSuccess();
        if (onShowToast) {
          onShowToast('success', 'Leaderboard Direset', 'Semua data booster leaderboard berhasil dibersihkan.');
        }
      }
    } catch {
      soundFx.playError();
    } finally {
      setIsClearingAll(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg shadow-amber-500/30 border border-yellow-200">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shadow-slate-300/20 border border-white">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-600 text-amber-100 font-black text-xs flex items-center justify-center shadow-md shadow-amber-700/20 border border-amber-500/50">
          🥉
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-xl bg-slate-800/80 text-slate-400 font-bold text-xs flex items-center justify-center border border-slate-700/60">
        #{rank}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal / Sidebar Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-lg max-h-[85vh] flex flex-col liquid-glass-dock rounded-3xl border border-white/15 bg-slate-900/90 text-slate-100 shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Top Boosters Leaderboard
                    </h3>
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Firebase
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Peringkat pengguna dengan jumlah reach WhatsApp terbanyak
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stat Summary Strip & Admin Bar */}
            <div className="px-5 py-2.5 bg-slate-950/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>{boosters.length} Booster Teratas</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{totalAllBoosts.toLocaleString('id-ID')} Total Boost</span>
                </div>
                {isAdmin && boosters.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllLeaderboard}
                    disabled={isClearingAll}
                    className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-extrabold flex items-center gap-1 transition-colors"
                    title="Khusus Admin: Reset semua peringkat leaderboard"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>{isClearingAll ? 'Mereset...' : 'Reset Semua'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Booster List Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5 custom-scrollbar">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                  <span className="text-xs">Memuat data dari Firebase...</span>
                </div>
              ) : boosters.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Belum ada aktivitas booster yang tercatat. Kirim reach untuk memimpin peringkat!
                </div>
              ) : (
                boosters.map((booster, index) => {
                  const isCurrent = currentUsername && booster.username.toLowerCase() === currentUsername.toLowerCase();
                  const isTopThree = index < 3;
                  const isDeleting = deletingUser === booster.username;

                  return (
                    <motion.div
                      key={booster.id || booster.username}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      whileHover={{ scale: 1.015, x: 2 }}
                      onClick={() => {
                        if (onSelectUser) {
                          soundFx.playClick();
                          onSelectUser(booster.username);
                        }
                      }}
                      className={`p-3 sm:p-3.5 rounded-2xl flex items-center justify-between gap-3 border transition-all ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-400/50 shadow-md shadow-amber-500/10'
                          : isTopThree
                          ? 'bg-slate-800/70 border-slate-700/80 hover:border-slate-600'
                          : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Left: Rank & Avatar & User Info */}
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        {getRankBadge(booster.rank || index + 1)}

                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm shrink-0"
                          style={{ backgroundColor: booster.avatarColor || '#10B981' }}
                        >
                          {booster.username.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-100 truncate">
                              @{booster.username}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-extrabold uppercase">
                                Anda
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <VIPBadge role={booster.role} size="sm" />
                          </div>
                        </div>
                      </div>

                      {/* Right: Boost Count Metric & Admin Action */}
                      <div className="flex items-center gap-2 shrink-0 pl-2">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1 text-sm sm:text-base font-black text-amber-400">
                            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{(booster.totalBoosts || 0).toLocaleString('id-ID')}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Reach Boost
                          </span>
                        </div>

                        {/* Admin Action: Delete User from Leaderboard */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteUser(e, booster.username)}
                            disabled={isDeleting}
                            className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-all hover:scale-105 active:scale-95"
                            title={`Khusus Admin: Hapus @${booster.username} dari leaderboard`}
                          >
                            {isDeleting ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-950/70 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Kirim reach untuk menaikkan peringkatmu
              </span>
              <button
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
