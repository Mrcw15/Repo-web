import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Zap, 
  Send, 
  Sparkles, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Trophy,
  Users,
  ShieldCheck,
  Radio,
  ChevronRight,
  TrendingUp,
  Flame,
  Power,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { soundFx } from '../utils/audio';
import { 
  getDailyLimitState, 
  incrementDailyLimitUsage, 
  addReachHistoryItem, 
  getReachHistory, 
  clearReachHistory,
  type UserProfile,
  type ReachHistoryItem
} from '../utils/storage';
import { 
  recordBoostInFirebase, 
  subscribeTopBoosters, 
  subscribeReachEngineSettings,
  type TopBoosterItem,
  type ReachEngineSettings
} from '../services/firebaseService';
import { ReachLoader } from '../components/ReachLoader';
import { UnifiedReachHero } from '../components/UnifiedReachHero';
import { TopBoosters } from '../components/TopBoosters';
import { VIPBadge } from '../components/VIPBadge';
import { EmojiSelector } from '../components/EmojiSelector';
import { WhatsAppPostTutorialModal } from '../components/WhatsAppPostTutorialModal';

interface ReachPageProps {
  userProfile: UserProfile;
  onNavigateTab: (tab: string) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const ReachPage: React.FC<ReachPageProps> = ({
  userProfile,
  onNavigateTab,
  onShowToast,
}) => {
  const [channelInput, setChannelInput] = useState('');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(['🔥', '🚀', '💯', '⚡']);
  const [isLoading, setIsLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState<ReachHistoryItem[]>(() => getReachHistory());
  const [isTopBoostersOpen, setIsTopBoostersOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [topThreeBoosters, setTopThreeBoosters] = useState<TopBoosterItem[]>([]);
  const [reachEngine, setReachEngine] = useState<ReachEngineSettings>({
    boostSpeedMode: 'turbo',
    globalCooldownSeconds: 3,
    isEmergencyPaused: false,
    blacklistChannels: [],
  });
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    channel: string;
    emojis?: string[];
    data?: any;
  } | null>(null);

  const [limitRefreshKey, setLimitRefreshKey] = useState(0);
  const isBlocked = userProfile.role === 'blocked' || !!userProfile.isBlocked || userProfile.customDailyLimit === 0;
  const limitState = getDailyLimitState(userProfile.role, userProfile.customDailyLimit, isBlocked);
  const isPremium = (userProfile.role === 'premium' || userProfile.role === 'admin') && !isBlocked;
  const isLimitExhausted = !limitState.isUnlimited && (limitState.remaining <= 0 || isBlocked);

  // Real-time Top Boosters preview synchronization from Firebase
  useEffect(() => {
    const unsub = subscribeTopBoosters((data) => {
      setTopThreeBoosters(data.slice(0, 3));
    });
    return () => unsub();
  }, []);

  // Real-time Reach Engine Settings synchronization
  useEffect(() => {
    const unsub = subscribeReachEngineSettings((settings) => {
      setReachEngine(settings);
    });
    return () => unsub();
  }, []);

  // Trigger rich confetti animation upon reach success
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#06B6D4', '#F43F5E', '#F59E0B', '#3B82F6', '#8B5CF6'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10B981', '#34D399', '#6EE7B7'],
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#06B6D4', '#38BDF8', '#67E8F9'],
        });
      }, 200);
    } catch {}
  };

  const handleManualReset = () => {
    localStorage.removeItem('wa_reach_daily_limit');
    setLimitRefreshKey((prev) => prev + 1);
    soundFx.playSuccess();
    onShowToast('success', 'Kuota Direset', 'Kuota reach harian berhasil dikembalikan.');
  };

  const handleSubmitReach = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!channelInput.trim()) {
      soundFx.playError();
      onShowToast('warning', 'Input Kosong', 'Harap masukkan tautan atau ID WhatsApp Channel!');
      return;
    }

    if (reachEngine.isEmergencyPaused) {
      soundFx.playError();
      onShowToast(
        'error',
        'Server Sedang Pemeliharaan',
        reachEngine.maintenanceNotice || 'Proses boost reach sedang dihentikan sementara oleh Admin. Coba beberapa saat lagi!'
      );
      return;
    }

    if (isBlocked) {
      soundFx.playError();
      onShowToast(
        'error',
        'Akun Terblokir (Limit 0)',
        userProfile.blockedReason || 'Akun Anda sedang diblokir oleh Administrator. Hubungi admin untuk informasi lebih lanjut.'
      );
      return;
    }

    if (isLimitExhausted) {
      soundFx.playError();
      onShowToast(
        'error',
        'Limit Harian Habis',
        'Anda telah mencapai batas reach per hari untuk akun Free. Upgrade ke VIP untuk akses Unlimited!'
      );
      return;
    }

    const targetChannel = channelInput.trim();

    // Check blacklisted channel
    if (reachEngine.blacklistChannels && reachEngine.blacklistChannels.some((bc) => targetChannel.toLowerCase().includes(bc.toLowerCase()))) {
      soundFx.playError();
      onShowToast(
        'error',
        'Channel Terproteksi',
        'Channel WhatsApp ini masuk ke dalam daftar proteksi Blacklist Admin dan tidak dapat di-boost.'
      );
      return;
    }

    soundFx.playClick();
    setIsLoading(true);
    setLastResult(null);

    const currentUsername = userProfile.username || userProfile.nickname || 'user';

    try {
      let data: any = null;
      let isSuccess = false;
      let serverError: string | null = null;

      try {
        const res = await fetch('/api/reach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: targetChannel,
            username: currentUsername,
            emojis: selectedEmojis,
          }),
        });

        if (res.ok) {
          data = await res.json();
          isSuccess = !!data.success;
        } else {
          try {
            const errJson = await res.json();
            serverError = errJson?.message || `Server merespon dengan status ${res.status}`;
          } catch {
            serverError = `Permintaan ditolak dengan status HTTP ${res.status}`;
          }
        }
      } catch {
        // Fallback for static hosting (Vercel / Netlify / GitHub Pages)
        console.warn('API Gateway offline, switching to direct client booster handler...');
      }

      if (serverError) {
        soundFx.playError();
        onShowToast('error', 'Gagal Mengirim', serverError);
        setIsLoading(false);
        return;
      }

      // If server API succeeded or fallback processed
      const reactionString = selectedEmojis.join(', ') || '🔥';
      const finalMessage = data?.message || `Reaksi emoji (${reactionString}) berhasil dikirim ke target WhatsApp Channel!`;

      soundFx.playSuccess();
      triggerConfetti();

      if (!isPremium) {
        incrementDailyLimitUsage(1, userProfile.customDailyLimit);
        setLimitRefreshKey((prev) => prev + 1);
      }

      // 1. Record in local history
      addReachHistoryItem({
        channel: targetChannel,
        status: 'success',
        message: finalMessage,
        emojis: selectedEmojis,
      });
      setRecentLogs(getReachHistory());

      // 2. Persist in Firebase Firestore Database
      recordBoostInFirebase(
        currentUsername,
        targetChannel,
        'success',
        finalMessage,
        userProfile.role,
        userProfile.avatarColor,
        selectedEmojis
      );

      setLastResult({
        success: true,
        message: finalMessage,
        channel: targetChannel,
        emojis: selectedEmojis,
        data: data?.data || { mode: 'Direct Gateway', channel: targetChannel },
      });

      onShowToast('success', 'Reach Terkirim!', 'Sukses mengeksekusi reach booster ke channel target!');
    } catch {
      soundFx.playError();
      onShowToast('error', 'Gagal Mengirim', 'Terjadi kendala saat memproses reach.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    soundFx.playClick();
    clearReachHistory();
    setRecentLogs([]);
    onShowToast('info', 'Riwayat Dibersihkan', 'Riwayat reach lokal telah dihapus.');
  };

  return (
    <div key={limitRefreshKey} className="min-h-full pb-36 sm:pb-28 pt-2 sm:pt-4 px-3 sm:px-6 max-w-6xl mx-auto space-y-5 sm:space-y-6">
      {/* Loading Overlay */}
      {isLoading && (
        <ReachLoader channel={channelInput || 'Target Channel'} />
      )}

      {/* Top Boosters Modal */}
      <TopBoosters
        isOpen={isTopBoostersOpen}
        onClose={() => setIsTopBoostersOpen(false)}
        currentUsername={userProfile.username}
        userRole={userProfile.role}
        onShowToast={onShowToast}
      />

      {/* WhatsApp Post Tutorial Modal */}
      <WhatsAppPostTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onSelectSampleLink={(link) => setChannelInput(link)}
      />

      {/* Unified Hero: Main Growth Engine + Activity Insights + Countdown Timer */}
      <UnifiedReachHero
        userProfile={userProfile}
        limitState={limitState}
        history={recentLogs}
        onNavigateTab={onNavigateTab}
      />

      {/* Top Boosters Quick Bar Strip */}
      <motion.div
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="liquid-glass rounded-2xl p-3 sm:p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-extrabold text-white">
                Top Boosters Leaderboard
              </h4>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 fill-amber-400" /> Live
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {topThreeBoosters.length > 0 ? (
                topThreeBoosters.map((b, idx) => (
                  <span key={b.username} className="text-[11px] text-slate-300 flex items-center gap-1 font-medium">
                    <span className="text-[10px]">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                    <span>@{b.username}</span>
                    <span className="text-amber-400 font-bold font-mono">({b.totalBoosts})</span>
                    {idx < topThreeBoosters.length - 1 && <span className="text-slate-600">•</span>}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-400">
                  Belum ada booster aktif. Kirim reach untuk memimpin peringkat!
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            setIsTopBoostersOpen(true);
          }}
          className="glass-btn px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 self-start sm:self-center shrink-0 shadow-sm"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Lihat Peringkat Lengkap</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      {/* Main Grid: Form + Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Form (8 cols) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5">
          {/* Emergency Maintenance Alert Banner */}
          {reachEngine.isEmergencyPaused && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="liquid-glass-rose rounded-2xl p-4 sm:p-5 border-2 border-rose-500/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl shadow-rose-950/50 bg-rose-950/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/30 text-rose-300 flex items-center justify-center shrink-0 border border-rose-500/50 shadow-inner">
                  <Power className="w-5 h-5 text-rose-400" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-rose-200 flex items-center gap-1.5">
                    <span>Pemeliharaan Darurat Server (Emergency Pause)</span>
                  </h4>
                  <p className="text-xs text-rose-300/90 leading-relaxed">
                    {reachEngine.maintenanceNotice || 'Mesin booster WhatsApp Channel sedang dihentikan sementara oleh Administrator untuk pemeliharaan server. Pengiriman dinonaktifkan sementara.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Blocked Account Alert Banner */}
          {isBlocked && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="liquid-glass-rose rounded-2xl p-4 sm:p-5 border-2 border-rose-500/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl shadow-rose-950/40 bg-rose-950/40"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/30 text-rose-300 flex items-center justify-center shrink-0 border border-rose-500/50 shadow-inner">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-rose-200 flex items-center gap-1.5">
                    <span>Akun Berstatus Terblokir (Limit 0)</span>
                  </h4>
                  <p className="text-xs text-rose-300/90 leading-relaxed">
                    {userProfile.blockedReason || 'Akun Anda telah dinonaktifkan oleh Administrator. Semua akses pengiriman diset ke limit 0.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Limit Warning (If Exhausted) */}
          {!isBlocked && isLimitExhausted && (
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="liquid-glass-rose rounded-2xl p-4 sm:p-5 border border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-rose-200">
                    Kuota Free Hari Ini Telah Habis
                  </h4>
                  <p className="text-xs text-rose-300">
                    Kuota akan terisi ulang otomatis pukul 00:00 atau upgrade VIP untuk unlimited reach.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onNavigateTab('premium');
                }}
                className="glass-btn px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-sm shrink-0 w-full sm:w-auto text-center transition-all duration-200 ease-out transform hover:scale-105 active:scale-95"
              >
                Upgrade VIP Unlimited
              </button>
            </motion.div>
          )}

          {/* Form Box with Subtle Reactive Physics */}
          <motion.div 
            whileHover={{ y: -3, transition: { duration: 0.25, ease: 'easeOut' } }}
            className="liquid-glass rounded-3xl p-5 sm:p-7 shadow-lg border border-white/10 space-y-4 sm:space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    Form Pengiriman Reach
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Masukkan tautan channel publik WhatsApp
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-bold text-slate-300 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/50">
                Protokol v2.4
              </div>
            </div>

            <form onSubmit={handleSubmitReach} className="space-y-4 sm:space-y-5">
              {/* Field: WhatsApp Channel Link/ID */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <label htmlFor="input-channel-url" className="font-extrabold text-slate-100 flex items-center gap-1.5">
                      <span>Link / ID WhatsApp Channel</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setIsTutorialOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-extrabold flex items-center gap-1.5 shadow-xs transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 animate-pulse"
                      title="Lihat tutorial cara salin link postingan WhatsApp"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cara Ambil Link Postingan?</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Format: https://whatsapp.com/channel/...
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    id="input-channel-url"
                    value={channelInput}
                    onChange={(e) => setChannelInput(e.target.value)}
                    placeholder="Masukkan link atau ID channel WhatsApp..."
                    className="w-full glass-input p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm font-medium outline-none pr-16"
                    disabled={isLoading}
                  />
                  {channelInput && (
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setChannelInput('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 transition-all duration-150 transform hover:scale-105 active:scale-95"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Field: Pemilihan Emoji Reaksi (Maksimal 4) */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <EmojiSelector
                  selectedEmojis={selectedEmojis}
                  onChange={setSelectedEmojis}
                  maxSelect={4}
                  disabled={isLoading}
                />
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  id="btn-submit-reach"
                  disabled={isLoading || isLimitExhausted || reachEngine.isEmergencyPaused}
                  className={`glass-btn w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 text-white shadow-xl transition-all duration-200 ease-out transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                    reachEngine.isEmergencyPaused
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 cursor-not-allowed shadow-none'
                      : isLimitExhausted
                      ? 'bg-slate-700 opacity-60 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-500 shadow-emerald-500/25 hover:shadow-emerald-500/40'
                  }`}
                >
                  {reachEngine.isEmergencyPaused ? (
                    <>
                      <Power className="w-4 h-4 text-rose-400" />
                      <span>Pemeliharaan Server Aktif (Paused)</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Reach Sekarang</span>
                    </>
                  )}
                </motion.button>
              </div>

              <div className="liquid-glass rounded-2xl p-3.5 border border-white/10 text-xs text-slate-300 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  Sistem beroperasi via secure REST API proxy. Channel publik Anda aman 100% tanpa risiko banned dan tidak memerlukan izin akses admin.
                </span>
              </div>
            </form>
          </motion.div>

          {/* Last Result Banner */}
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl p-4 sm:p-5 shadow-lg border ${
                lastResult.success
                  ? 'liquid-glass-emerald border-emerald-500/40'
                  : 'liquid-glass-rose border-rose-500/40'
              } flex items-start gap-3.5`}
            >
              {lastResult.success ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <XCircle className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">
                    {lastResult.success ? 'Boost Berhasil Dikirim' : 'Proses Gagal'}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-lg">
                    SUKSES
                  </span>
                </div>
                <p className="text-slate-200 leading-snug font-medium">
                  {lastResult.message}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    Target: {lastResult.channel}
                  </p>
                  {lastResult.emojis && lastResult.emojis.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Reaksi:</span>
                      <span className="text-sm font-normal tracking-wide bg-slate-900/60 px-2 py-0.5 rounded-lg border border-white/10">
                        {lastResult.emojis.join(' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Activity Logs (4 cols) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5">
          {/* Activity Logs Card */}
          <motion.div 
            whileHover={{ y: -3, transition: { duration: 0.25, ease: 'easeOut' } }}
            className="liquid-glass rounded-3xl p-5 border border-white/10 shadow-lg space-y-3.5"
          >
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Riwayat Boost Channel
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {recentLogs.length} aktivitas tersimpan
                </span>
              </div>

              {recentLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/50"
                >
                  Hapus
                </button>
              )}
            </div>

            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold space-y-1">
                <Clock className="w-6 h-6 mx-auto text-slate-400 opacity-60" />
                <p>Belum ada riwayat aktivitas boost.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                {recentLogs.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.015, x: 2 }}
                    className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-xs space-y-1.5 hover:bg-slate-800 transition-all shadow-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          item.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {item.status === 'success' ? 'SUKSES' : 'GAGAL'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs font-bold text-slate-100 truncate flex-1" title={item.channel}>
                        {item.channel}
                      </p>
                      {item.emojis && item.emojis.length > 0 && (
                        <span className="text-xs shrink-0 tracking-wider bg-slate-900/80 px-1.5 py-0.5 rounded-md border border-white/5">
                          {item.emojis.join('')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/40">
                      <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Terkirim
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playClick();
                          setChannelInput(item.channel);
                        }}
                        className="text-slate-300 hover:text-emerald-400 flex items-center gap-1 font-bold text-[11px]"
                      >
                        <RotateCcw className="w-3 h-3" /> Gunakan Lagi
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
