import React, { useState } from 'react';
import { 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Globe, 
  Smartphone, 
  Calendar, 
  Clock, 
  Zap, 
  ShieldAlert, 
  Crown, 
  Sparkles, 
  Ban, 
  X,
  Gauge
} from 'lucide-react';
import { soundFx } from '../../utils/audio';
import type { AdminUserRecord } from '../../services/firebaseService';

interface UserInfoModalProps {
  user: AdminUserRecord | null;
  isOpen?: boolean;
  onClose: () => void;
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const UserInfoModal: React.FC<UserInfoModalProps> = ({
  user,
  onClose,
  onShowToast,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!user) return null;

  const copyToClipboard = (text: string, label: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    onShowToast?.('info', 'Tersalin', `${label} berhasil disalin ke clipboard.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isBlocked = user.isBlocked || user.role === 'blocked';
  const isUnlimited = !isBlocked && (user.role === 'premium' || user.role === 'admin');
  const maxLimit = isBlocked ? 0 : (user.customDailyLimit !== undefined && user.customDailyLimit !== null ? user.customDailyLimit : (user.role === 'premium' ? 9999 : 10));
  const usedToday = user.usedToday || 0;
  const remainingQuota = isUnlimited ? 'Unlimited (VIP)' : `${Math.max(0, maxLimit - usedToday)} / ${maxLimit}x`;

  const formatDate = (ts?: number) => {
    if (!ts) return 'Tidak diketahui';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(ts));
    } catch {
      return new Date(ts).toLocaleString();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl space-y-5 text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-md"
              style={{ backgroundColor: user.avatarColor || '#10B981' }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  @{user.username}
                </h3>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    user.role === 'admin'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : user.role === 'premium'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : isBlocked
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isBlocked ? 'BLOCKED' : user.role.toUpperCase()}
                </span>
                {user.customRoleName && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {user.customRoleName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Informasi Lengkap Profil Akun Server</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* 1. Username */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              1. Nama Pengguna (Username)
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-white text-sm">@{user.username}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(user.username, 'Username')}
                className="p-1 text-slate-400 hover:text-white"
                title="Salin Username"
              >
                {copiedField === 'Username' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 2. Password */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              2. Kata Sandi (Password)
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-amber-300 text-sm truncate">
                {showPassword ? (user.password || '******') : '••••••••'}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setShowPassword(!showPassword);
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.password || '******', 'Password')}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Salin Password"
                >
                  {copiedField === 'Password' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* 3. IP Address */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              3. IP Address Koneksi
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-cyan-300">
                {user.ipAddress || '127.0.0.1 (Lokal)'}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(user.ipAddress || '127.0.0.1', 'IP Address')}
                className="p-1 text-slate-400 hover:text-white"
                title="Salin IP"
              >
                {copiedField === 'IP Address' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 4. Sisa Limit & Kuota */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              4. Sisa Kuota Hari Ini
            </span>
            <div className="flex items-center justify-between">
              <span className={`font-mono font-bold ${isBlocked ? 'text-rose-400' : isUnlimited ? 'text-amber-400' : 'text-emerald-300'}`}>
                {remainingQuota}
              </span>
              <span className="text-[10px] text-slate-400">
                Pakai: {usedToday}x
              </span>
            </div>
          </div>

          {/* 5. Total Reach Boost */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              5. Total Boost Dilakukan
            </span>
            <span className="font-mono font-extrabold text-white text-sm block">
              {user.totalBoosts || 0} Reaksi
            </span>
          </div>

          {/* 6. Device / User Agent */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              6. Device & User Agent
            </span>
            <span className="font-mono text-[10px] text-slate-300 block truncate" title={user.userAgent || 'Web Browser'}>
              {user.userAgent ? (user.userAgent.length > 35 ? user.userAgent.substring(0, 35) + '...' : user.userAgent) : 'Web Client'}
            </span>
          </div>

          {/* 7. Waktu Pendaftaran */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              7. Terdaftar Sejak
            </span>
            <span className="font-mono text-[11px] text-slate-300 block">
              {formatDate(user.createdAt)}
            </span>
          </div>

          {/* 8. Aktivitas Terakhir */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              8. Terakhir Aktif
            </span>
            <span className="font-mono text-[11px] text-slate-300 block">
              {formatDate(user.lastActive)}
            </span>
          </div>
        </div>

        {/* Additional Warnings or Special Status Info */}
        {isBlocked && (
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-200">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-rose-300 block">Status: Akun Sedang Diblokir</strong>
              <span>Alasan: {user.blockedReason || 'Pelanggaran ketentuan sistem.'} Kuota harian diset ke 0.</span>
            </div>
          </div>
        )}

        {user.premiumExpiresAt && (
          <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Masa Aktif VIP Berakhir Pada:</span>
            </div>
            <strong className="font-mono text-amber-300">{formatDate(user.premiumExpiresAt)}</strong>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition-colors"
          >
            Tutup Informasi
          </button>
        </div>
      </div>
    </div>
  );
};
