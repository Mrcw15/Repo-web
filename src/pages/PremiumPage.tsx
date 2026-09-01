import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Check, 
  Gift, 
  Crown, 
  Clock, 
  Zap, 
  Copy,
  
  ShieldCheck,
  CreditCard,
  QrCode
} from 'lucide-react';
import { motion } from 'motion/react';
import { soundFx } from '../utils/audio';
import { 
  saveUserProfile, 
  type UserProfile 
} from '../utils/storage';
import { syncUserProfileToFirebase, redeemVoucherCode } from '../services/firebaseService';
import { VIPBadge } from '../components/VIPBadge';

interface PremiumPageProps {
  userProfile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onNavigateTab: (tab: string) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const PremiumPage: React.FC<PremiumPageProps> = ({
  userProfile,
  onUpdateProfile,
  onNavigateTab,
  onShowToast,
}) => {
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const isPremium = userProfile.role === 'premium' || userProfile.role === 'admin';

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#F59E0B', '#10B981', '#06B6D4', '#EC4899', '#8B5CF6'],
      });
    } catch {}
  };

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = redeemCode.trim().toUpperCase();
    if (!cleanCode || isRedeeming) return;

    soundFx.playClick();
    setIsRedeeming(true);

    try {
      // 1. Validate directly via Firestore and master codes
      const redeemResult = await redeemVoucherCode(cleanCode, userProfile.username || userProfile.nickname);

      if (redeemResult.success) {
        soundFx.playSuccess();
        triggerConfetti();

        let updated: UserProfile = { ...userProfile };

        if (redeemResult.voucherType === 'quota_boost') {
          const currentLimit = userProfile.customDailyLimit || 10;
          const bonus = redeemResult.bonusQuota || 50;
          updated = {
            ...userProfile,
            customDailyLimit: currentLimit + bonus,
          };
        } else {
          const durationDays = redeemResult.durationDays || (redeemResult.voucherType === 'unlimited_pass' ? 365 : 30);
          const expiresAt = redeemResult.expiresAt || (Date.now() + durationDays * 86400000);
          updated = {
            ...userProfile,
            role: 'premium',
            premiumExpiresAt: expiresAt,
          };
        }

        saveUserProfile(updated);
        syncUserProfileToFirebase(updated);
        onUpdateProfile(updated);
        setRedeemCode('');
        onShowToast('success', 'Voucher Berhasil Diklaim!', redeemResult.message || 'Keuntungan voucher telah aktif di akun Anda!');

        // Optional serverless sync
        try {
          fetch('/api/premium/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: cleanCode, username: userProfile.username }),
          });
        } catch {}

        return;
      }

      // 2. Try Server API if Firestore code was not found
      try {
        const res = await fetch('/api/premium/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: cleanCode }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            soundFx.playSuccess();
            triggerConfetti();

            const updated: UserProfile = {
              ...userProfile,
              role: 'premium',
              premiumExpiresAt: data.expiresAt || (Date.now() + (data.durationDays || 30) * 86400000),
            };

            saveUserProfile(updated);
            syncUserProfileToFirebase(updated);
            onUpdateProfile(updated);
            setRedeemCode('');
            onShowToast('success', 'Upgrade Berhasil', data.message || 'Akun Anda berhasil menjadi VIP!');
            return;
          }
        }
      } catch {}

      soundFx.playError();
      onShowToast('error', 'Redeem Gagal', redeemResult.message || 'Kode voucher tidak valid atau sudah expired.');
    } catch {
      soundFx.playError();
      onShowToast('error', 'Error', 'Terjadi kesalahan saat memproses kode voucher.');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="min-h-full pb-36 sm:pb-28 pt-2 sm:pt-4 px-3 sm:px-6 max-w-5xl mx-auto space-y-5 sm:space-y-6">
      {/* Top Banner Status Card with VIP Badge & Reactive Hover */}
      <motion.div 
        whileHover={{ y: -3, transition: { duration: 0.25, ease: 'easeOut' } }}
        className={`rounded-3xl p-5 sm:p-7 shadow-xl border ${
          isPremium
            ? 'liquid-glass-amber border-amber-400/35'
            : 'liquid-glass border-white/10'
        } relative overflow-hidden`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Status Keanggotaan:
              </span>
              <VIPBadge 
                role={userProfile.role} 
                premiumExpiresAt={userProfile.premiumExpiresAt} 
                showDetails={true} 
                size="md" 
              />
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">
              {isPremium ? 'Akses VIP Aktif' : 'Status Akun: Free Member'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isPremium
                ? 'Nikmati fitur Unlimited Reach WhatsApp Channel, prioritas antrean server, dan lencana VIP di seluruh fitur.'
                : 'Akun free dibatasi 10x reach/hari. Dapatkan akses VIP untuk kuota boost channel tanpa batas.'}
            </p>
          </div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="liquid-glass rounded-2xl p-4 sm:p-5 border border-white/10 shadow-md min-w-[220px] w-full md:w-auto"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Limit Harian
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5" />
              {isPremium ? 'Unlimited' : '10 Reach / Hari'}
            </div>
            {isPremium && userProfile.premiumExpiresAt && (
              <div className="text-[11px] font-medium text-slate-300 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Berlaku s/d {new Date(userProfile.premiumExpiresAt).toLocaleDateString('id-ID')}</span>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Redeem Voucher Card with Reactive Motion Hover */}
      <motion.div 
        whileHover={{ y: -3, transition: { duration: 0.25, ease: 'easeOut' } }}
        className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Gift className="w-5 h-5 text-amber-400" />
          <h3 className="text-base sm:text-lg font-bold text-white">
            Klaim Voucher / Kode VIP
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Masukkan kode voucher VIP untuk aktivasi instan akun Anda.
        </p>

        <form onSubmit={handleRedeemSubmit} className="mt-4 flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            id="input-redeem-code"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
            placeholder="Masukkan kode voucher VIP..."
            className="flex-1 glass-input px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold tracking-wider font-mono outline-none uppercase"
            disabled={isRedeeming}
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            id="btn-submit-redeem"
            disabled={!redeemCode.trim() || isRedeeming}
            className="glass-btn px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isRedeeming ? 'Memvalidasi...' : 'Klaim VIP'}</span>
          </motion.button>
        </form>
      </motion.div>

      {/* Pricing Cards Grid */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            Pilihan Paket Langganan VIP
          </h3>
          <p className="text-xs text-slate-400">
            Akses instan tanpa antrean, unlimited reach, dan perlindungan keamanan maksimal
          </p>
        </div>

        <div className="flex justify-center">
          <motion.div 
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="liquid-glass-amber rounded-3xl p-5 sm:p-6 border border-amber-400/40 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden w-full max-w-md"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> PREMIUM
                </span>
                <span className="text-[11px] text-amber-300/80 font-mono font-bold">VIP Akses</span>
              </div>

              <div>
                <span className="text-3xl font-black text-white">Rp 2.000</span>
                <span className="text-xs text-amber-200/80"> / langganan</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">Unlimited Reach Channel</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Prioritas Antrean Server</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>VIP Badge Eksklusif di Profile</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dukungan Admin Khusus</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigateTab('owner')}
              className="glass-btn w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              <Crown className="w-4 h-4" />
              <span>Beli VIP Premium</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
