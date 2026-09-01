import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  Trash2, 
  Sparkles, 
  Clock, 
  Gauge, 
  Layers, 
  ShieldCheck, 
  Crown, 
  Ban, 
  User, 
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { soundFx } from '../../utils/audio';
import type { CustomRoleData } from '../../services/firebaseService';

interface CustomRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  customRoles: CustomRoleData[];
  onCreateRole: (role: { name: string; durationDays: number; dailyLimit: number; baseTier: 'user' | 'premium' | 'blocked' }) => Promise<void>;
  onDeleteRole: (roleId: string) => Promise<void>;
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const CustomRoleModal: React.FC<CustomRoleModalProps> = ({
  isOpen,
  onClose,
  customRoles,
  onCreateRole,
  onDeleteRole,
  onShowToast,
}) => {
  const [roleName, setRoleName] = useState('');
  const [durationDays, setDurationDays] = useState<string>('30');
  const [dailyLimit, setDailyLimit] = useState<string>('25');
  const [baseTier, setBaseTier] = useState<'user' | 'premium' | 'blocked'>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      soundFx.playError();
      onShowToast?.('error', 'Nama Wajib Diisi', 'Silakan masukkan nama custom role.');
      return;
    }

    const parsedDays = parseInt(durationDays, 10);
    if (isNaN(parsedDays) || parsedDays < 1) {
      soundFx.playError();
      onShowToast?.('error', 'Durasi Tidak Valid', 'Hari berlaku harus angka positif minimal 1 hari.');
      return;
    }

    const parsedLimit = parseInt(dailyLimit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      soundFx.playError();
      onShowToast?.('error', 'Limit Tidak Valid', 'Limit penggunaan harus berupa angka (0 atau lebih).');
      return;
    }

    // STRICT VALIDATION: Cannot be admin
    if ((baseTier as string) === 'admin') {
      soundFx.playError();
      onShowToast?.('error', 'Ditolak', 'Custom role tidak diizinkan setara dengan role Admin.');
      return;
    }

    setIsSubmitting(true);
    soundFx.playClick();

    try {
      await onCreateRole({
        name: roleName.trim(),
        durationDays: parsedDays,
        dailyLimit: baseTier === 'blocked' ? 0 : parsedLimit,
        baseTier,
      });

      soundFx.playSuccess();
      onShowToast?.('success', 'Custom Role Dibuat', `Role [${roleName}] (${parsedDays} hari, limit ${parsedLimit}x) berhasil ditambahkan!`);
      setRoleName('');
      setDurationDays('30');
      setDailyLimit('25');
      setBaseTier('user');
    } catch {
      soundFx.playError();
      onShowToast?.('error', 'Gagal', 'Terjadi kendala saat membuat custom role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (roleId: string, name: string) => {
    if (!confirm(`Hapus custom role [${name}]?`)) return;
    soundFx.playClick();
    try {
      await onDeleteRole(roleId);
      soundFx.playSuccess();
      onShowToast?.('info', 'Role Dihapus', `Custom role [${name}] telah dihapus.`);
    } catch {
      soundFx.playError();
      onShowToast?.('error', 'Gagal', 'Gagal menghapus custom role.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl space-y-5 text-slate-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Manajemen Custom Role Pengguna
              </h3>
              <p className="text-xs text-slate-400">
                Atur nama role kustom, masa aktif hari, limit harian, dan tingkat akses (User/Premium/Blocked).
              </p>
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

        {/* Form Create Custom Role */}
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-400">
            <Plus className="w-4 h-4" />
            <span>Buat Role Kustom Baru</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* 1. Nama Custom Role */}
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-200 block">
                1. Nama Custom Role <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Contoh: VIP Reseller, Gold Booster, Promo Ramadhan"
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs outline-none font-semibold text-white placeholder-slate-500"
                maxLength={40}
              />
            </div>

            {/* 2. Hari Berlaku (Numeric input) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Hari Berlaku (Durasi)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 30"
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold outline-none text-amber-300"
              />
              <span className="text-[10px] text-slate-400">Masukkan jumlah hari masa aktif (Keyboard Angka).</span>
            </div>

            {/* 3. Limit Penggunaan (Numeric input) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-200 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Limit Penggunaan Harian</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={baseTier === 'blocked' ? '0' : dailyLimit}
                disabled={baseTier === 'blocked'}
                onChange={(e) => setDailyLimit(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 25 (atau 9999 untuk unlimited)"
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold outline-none text-emerald-300 disabled:opacity-50"
              />
              <span className="text-[10px] text-slate-400">Berapa kali boost per hari (Keyboard Angka).</span>
            </div>

            {/* 4. Set Role Setara dengan Role Apa (User, Premium, Blocked - STRICTLY NO ADMIN) */}
            <div className="sm:col-span-2 space-y-2">
              <label className="font-bold text-slate-200 block">
                4. Set Kesetaraan Akses (Role Mapping):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBaseTier('user');
                    if (dailyLimit === '0') setDailyLimit('10');
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    baseTier === 'user'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-extrabold shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <User className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <div className="font-bold text-xs">Setara USER</div>
                  <div className="text-[9px] text-slate-400">Akses user umum</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBaseTier('premium');
                    setDailyLimit('9999');
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    baseTier === 'premium'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-extrabold shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <Crown className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <div className="font-bold text-xs">Setara PREMIUM</div>
                  <div className="text-[9px] text-slate-400">Akses VIP & Kuota besar</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBaseTier('blocked');
                    setDailyLimit('0');
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    baseTier === 'blocked'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-extrabold shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <Ban className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                  <div className="font-bold text-xs">Setara BLOCKED</div>
                  <div className="text-[9px] text-slate-400">Akses ditutup (Limit 0)</div>
                </button>
              </div>
              <p className="text-[10px] text-cyan-400 flex items-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sesuai instruksi keamanan, custom role <strong>tidak dapat setara dengan role Admin</strong>.</span>
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !roleName.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Tambah Custom Role Baru'}</span>
          </button>
        </form>

        {/* Existing Custom Roles List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Daftar Preset Custom Role Tersedia ({customRoles.length})</span>
            </h4>
          </div>

          {customRoles.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
              Belum ada custom role yang dibuat. Gunakan form di atas untuk membuat custom role baru.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {customRoles.map((role) => (
                <div
                  key={role.id || role.name}
                  className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{role.name}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          role.baseTier === 'premium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : role.baseTier === 'blocked'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        Setara: {role.baseTier.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Masa Aktif: <strong className="text-amber-300 font-mono">{role.durationDays} Hari</strong></span>
                      <span>•</span>
                      <span>Limit Harian: <strong className="text-emerald-300 font-mono">{role.dailyLimit === 0 ? '0 (Terkunci)' : role.dailyLimit >= 9999 ? 'Unlimited' : `${role.dailyLimit}x`}</strong></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(role.id || role.name, role.name)}
                    className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-colors"
                    title="Hapus Custom Role"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};
