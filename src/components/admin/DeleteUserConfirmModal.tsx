import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { soundFx } from '../../utils/audio';
import type { AdminUserRecord } from '../../services/firebaseService';

interface DeleteUserConfirmModalProps {
  user: AdminUserRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (username: string) => Promise<void>;
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const DeleteUserConfirmModal: React.FC<DeleteUserConfirmModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirmDelete,
  onShowToast,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  if (!isOpen || !user) return null;

  const handleDelete = async () => {
    if (user.username.toLowerCase() === 'admin') {
      soundFx.playError();
      onShowToast?.('error', 'Ditolak', 'Akun Super Admin tidak boleh dihapus!');
      return;
    }

    setIsDeleting(true);
    soundFx.playClick();

    try {
      await onConfirmDelete(user.username);
      soundFx.playSuccess();
      onShowToast?.('success', 'User Dihapus', `Akun @${user.username} berhasil dihapus permanen dari server & database.`);
      onClose();
    } catch {
      soundFx.playError();
      onShowToast?.('error', 'Gagal', 'Terjadi kendala saat menghapus akun pengguna.');
    } finally {
      setIsDeleting(false);
      setConfirmInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md liquid-glass rounded-3xl p-6 border border-rose-500/30 shadow-2xl space-y-4 text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Hapus Akun Pengguna
              </h3>
              <p className="text-xs text-rose-300">Tindakan ini bersifat permanen</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-rose-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Peringatan Penghapusan Permanen</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Apakah Anda yakin ingin menghapus akun <strong className="text-white font-mono">@{user.username}</strong>?
            Semua data akun, sesi login, sisa kuota, dan riwayat boost akun ini akan dihapus dari server dan database Firestore.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Batal
          </button>
        </div>

      </div>
    </div>
  );
};
