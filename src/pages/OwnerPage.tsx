import React, { useState } from 'react';
import { 
  MessageCircle, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Sparkles,
  HelpCircle,
  Code2,
  Video,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  Activity
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { testFirestoreWriteConnection } from '../services/firebaseService';
import { motion } from 'motion/react';

interface OwnerPageProps {
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

const FAQ_ITEMS = [
  {
    q: 'Apakah tools reach channel ini aman untuk WhatsApp Channel saya?',
    a: 'Sangat aman. Tools ini hanya mengalirkan sinyal reach traffic via REST API publik tanpa meminta kredensial login, QR scan, ataupun session token privat.',
  },
  {
    q: 'Berapa lama proses reach terkirim setelah disubmit?',
    a: 'Proses biasanya membutuhkan waktu antara 5 detik hingga 1 menit tergantung kepadatan antrean gateway API.',
  },
  {
    q: 'Bagaimana cara membeli voucher VIP?',
    a: 'Klik tombol WhatsApp atau Telegram Owner di halaman ini, sebutkan paket yang diinginkan, dan lakukan transfer instan via QRIS / E-Wallet. Kode langsung dikirim saat itu juga.',
  },
  {
    q: 'Apakah bisa untuk semua tipe channel?',
    a: 'Bisa untuk seluruh WhatsApp Channel yang bersifat publik atau memiliki tautan undangan resmi.',
  },
];

export const OwnerPage: React.FC<OwnerPageProps> = ({ onShowToast }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connResult, setConnResult] = useState<{
    success: boolean;
    latencyMs: number;
    docId?: string;
    error?: string;
    projectId?: string;
    timestamp?: number;
  } | null>(null);

  const toggleFaq = (index: number) => {
    soundFx.playClick();
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const handleOpenContact = (url: string) => {
    soundFx.playClick();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTestConnection = async () => {
    soundFx.playClick();
    setIsTestingConn(true);
    setConnResult(null);

    try {
      const result = await testFirestoreWriteConnection();
      setConnResult(result);

      if (result.success) {
        soundFx.playSuccess();
        onShowToast?.(
          'success',
          'Koneksi Firebase Aktif',
          `Sukses menulis & membaca dokumen uji (${result.latencyMs}ms) di project ${result.projectId || 'Firestore'}`
        );
      } else {
        soundFx.playError();
        onShowToast?.(
          'error',
          'Koneksi Firebase Gagal',
          result.error || 'Gagal melakukan write test ke Firestore.'
        );
      }
    } catch (err: any) {
      soundFx.playError();
      const failResult = {
        success: false,
        latencyMs: 0,
        error: err?.message || 'Gagal mengeksekusi tes koneksi.',
      };
      setConnResult(failResult);
      onShowToast?.('error', 'Error Test Koneksi', failResult.error);
    } finally {
      setIsTestingConn(false);
    }
  };

  return (
    <div className="min-h-full pb-28 pt-3 px-3 sm:px-6 max-w-4xl mx-auto space-y-5">
      {/* Developer Profile Liquid Glass Card */}
      <motion.div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-xl border border-white/60 dark:border-white/10 relative overflow-hidden" whileHover={{ scale: 1.01, y: -4, rotateX: 2, rotateY: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
        {/* Ambient liquid blur blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative z-10">
          {/* Avatar Glass Container */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center text-4xl">
                👨‍💻
              </div>
            </div>

            <div className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              Online
            </div>
          </div>

          {/* Bio & Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider border border-slate-300/30 dark:border-slate-700/40">
              <Code2 className="w-3 h-3 text-emerald-500" />
              Owner & Developer
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Official Owner Contact
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Hubungi kontak resmi owner untuk pembelian voucher VIP, kerjasama, atau bantuan teknis seputar WA Reach Tools.
            </p>

            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-xl bg-slate-200/40 dark:bg-slate-800/40 border border-slate-300/30 dark:border-slate-700/30 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                ⚡ Fast Response
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-200/40 dark:bg-slate-800/40 border border-slate-300/30 dark:border-slate-700/30 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                ⭐ 24/7 Support
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-200/40 dark:bg-slate-800/40 border border-slate-300/30 dark:border-slate-700/30 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                🛡️ Verified Official
              </span>
            </div>
          </div>
        </div>

        {/* Contact Buttons - Only WhatsApp, Telegram, TikTok */}
        <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* WhatsApp Button */}
          <button
            onClick={() =>
              handleOpenContact(
                'https://wa.me/6285930156444?text=Halo%20Owner%20WA%20Reach%2C%20saya%20mau%20order%20kode%20voucher%20VIP!'
              )
            }
            className="glass-btn p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
          >
            <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="text-left">
              <span className="block text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-normal uppercase">WhatsApp</span>
              <span className="font-mono font-bold">6285930156444</span>
            </div>
          </button>

          {/* Telegram Button */}
          <button
            onClick={() => handleOpenContact('https://t.me/JennyCuyy')}
            className="glass-btn p-3 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
          >
            <Send className="w-4 h-4 text-sky-500 shrink-0" />
            <div className="text-left">
              <span className="block text-[10px] text-sky-600/80 dark:text-sky-400/80 font-normal uppercase">Telegram</span>
              <span className="font-mono font-bold">t.me/JennyCuyy</span>
            </div>
          </button>

          {/* TikTok Button */}
          <button
            onClick={() => handleOpenContact('https://www.tiktok.com/@marcw_12')}
            className="glass-btn p-3 rounded-2xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-700 dark:text-pink-300 border border-pink-500/30 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
          >
            <Video className="w-4 h-4 text-pink-500 shrink-0" />
            <div className="text-left">
              <span className="block text-[10px] text-pink-600/80 dark:text-pink-400/80 font-normal uppercase">TikTok</span>
              <span className="font-mono font-bold">@marcw_12</span>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Database Diagnostic & Test Connection Card */}
      <div className="liquid-glass rounded-3xl p-5 sm:p-7 border border-white/60 dark:border-white/10 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Verifikasi Koneksi Firebase Firestore
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Uji akses baca/tulis dokumen ke database Firestore di environment aktif
              </p>
            </div>
          </div>

          <button
            id="test-connection"
            onClick={handleTestConnection}
            disabled={isTestingConn}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isTestingConn ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Activity className="w-3.5 h-3.5" />
                <span>Test Connection</span>
              </>
            )}
          </button>
        </div>

        {connResult && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
              connResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                {connResult.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Koneksi Firestore Berhasil & Terverifikasi!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Koneksi Firestore Gagal / Akses Ditolak</span>
                  </>
                )}
              </span>
              <span className="font-mono text-[11px] opacity-80">
                {connResult.latencyMs} ms
              </span>
            </div>

            {connResult.success ? (
              <div className="text-[11px] text-slate-300 space-y-1 font-mono">
                <p>• Target Collection: <span className="text-emerald-400">connection_tests</span></p>
                <p>• Document ID: <span className="text-slate-200">{connResult.docId}</span></p>
                <p>• Project ID: <span className="text-slate-200">{connResult.projectId || 'Active Firebase App'}</span></p>
                <p>• Status: <span className="text-emerald-400">Read & Write Permissions Granted</span></p>
              </div>
            ) : (
              <div className="text-[11px] text-rose-300 space-y-1">
                <p>• Detail Kendala: {connResult.error}</p>
                <p className="text-[10px] text-slate-400">
                  Pastikan Firestore Rules telah mengizinkan write ke koleksi dan kredensial project sudah sesuai.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAQ Accordion Liquid Glass Section */}
      <div className="liquid-glass rounded-3xl p-5 sm:p-7 border border-white/60 dark:border-white/10 shadow-lg space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800/60">
          <HelpCircle className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions (FAQ)
          </h3>
        </div>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-slate-200/30 dark:bg-slate-800/40 border border-slate-300/30 dark:border-slate-700/30 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-3.5 text-left flex justify-between items-center gap-3 font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      Q{index + 1}
                    </span>
                    <span>{item.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-3.5 pt-0 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200/40 dark:border-slate-700/40 mt-1 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer Note */}
      <div className="liquid-glass rounded-2xl p-3.5 border border-white/60 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="leading-relaxed">
          WA Reach Tools dikembangkan secara independen untuk keperluan riset traffic. Tidak berafiliasi resmi dengan WhatsApp Inc / Meta Platforms.
        </span>
      </div>
    </div>
  );
};

