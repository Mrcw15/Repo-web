import React, { useState } from 'react';
import { AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import type { UserProfile } from '../utils/storage';
import { submitAppealRequest } from '../services/firebaseService';

interface AppealPageProps {
  userProfile: UserProfile;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const AppealPage: React.FC<AppealPageProps> = ({ userProfile, onShowToast }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      onShowToast('error', 'Gagal', 'Alasan banding tidak boleh kosong!');
      return;
    }

    setIsSubmitting(true);
    const success = await submitAppealRequest(userProfile.username || 'unknown', reason);
    setIsSubmitting(false);

    if (success) {
      setSubmitted(true);
      onShowToast('success', 'Banding Terkirim', 'Permintaan pembukaan blokir Anda telah dikirim ke admin.');
    } else {
      onShowToast('error', 'Gagal', 'Terjadi kesalahan saat mengirim banding. Silakan coba lagi nanti.');
    }
  };

  return (
    <div className="min-h-screen pt-4 sm:pt-8 pb-32 px-2 sm:px-6">
      <div className="max-w-xl mx-auto space-y-4">
        
        {/* Banner Terblokir */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-rose-950/30 border border-rose-500/20 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-rose-300">AKUN DIBLOKIR</h2>
            <p className="text-sm text-rose-200/80">
              {userProfile.blockedReason || 'Akun Anda saat ini diblokir karena melanggar ketentuan layanan.'}
            </p>
          </div>
        </div>

        {/* Form Banding */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/50 border border-white/5 shadow-xl backdrop-blur-sm">
          {submitted ? (
            <div className="flex flex-col items-center text-center space-y-3 py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-emerald-400">Banding Sedang Diproses</h3>
              <p className="text-sm text-slate-400">
                Permintaan pembukaan blokir Anda telah kami terima dan akan segera ditinjau oleh tim Admin. Mohon bersabar.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Ajukan Banding</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Merasa tidak melakukan pelanggaran? Jelaskan kepada kami melalui form di bawah ini agar Admin dapat meninjau kembali status akun Anda.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Alasan & Penjelasan
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan alasan mengapa akun Anda harus dibuka blokirnya..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Kirim Permintaan Banding</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
