import React, { useState } from 'react';
import { X, Check, Link, Sparkles, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';

interface WhatsAppPostTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSampleLink?: (link: string) => void;
}

export const WhatsAppPostTutorialModal: React.FC<WhatsAppPostTutorialModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            soundFx.playClick();
            onClose();
          }}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-sm sm:max-w-md rounded-3xl liquid-glass border border-emerald-500/40 shadow-2xl overflow-hidden z-10 my-auto bg-[#080d18] max-h-[92vh] flex flex-col"
        >
          {/* Simple Clean Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Tutorial Salin Link Postingan
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="p-3 sm:p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
            {/* FULL ORIGINAL SCREENSHOT UI (NO CROP - 100% UNABRIDGED VERTICAL SCREENSHOT) */}
            <div className="rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-xl bg-[#0b141a] relative flex flex-col font-sans select-none">
              {/* Android System Status Bar */}
              <div className="bg-[#0b141a] px-3.5 pt-1.5 pb-1 flex items-center justify-between text-[11px] font-mono text-slate-300 border-b border-slate-900/60">
                <span className="font-semibold tracking-wider">01.06 📷</span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>2,15 KB/d</span>
                  <span className="bg-slate-800 px-1 rounded text-[9px] font-sans">VoLTE</span>
                  <span>4G+</span>
                  <span className="border border-slate-400 px-1 rounded text-[9px] font-bold">57</span>
                </div>
              </div>

              {/* WhatsApp Selected Action Bar with the EXACT Original White Arrow & White Box */}
              <div className="bg-[#1f2c34] px-3 py-2.5 flex items-center justify-between text-white relative shadow-md">
                {/* Back and Counter */}
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-slate-300 cursor-default">←</span>
                  <span className="text-base font-black text-white">1</span>
                </div>

                {/* Toolbar Icons & Highlighted Link Icon */}
                <div className="flex items-center gap-2.5 sm:gap-3 relative">
                  {/* Star */}
                  <span className="text-sm opacity-70">⭐</span>

                  {/* HIGHLIGHTED CHAIN LINK ICON WITH WHITE BOX & ARROW */}
                  <div className="relative">
                    {/* The EXACT White Pointer Arrow from the User's Screenshot */}
                    <div className="absolute -top-7 -left-5 flex items-center pointer-events-none z-20">
                      <svg width="32" height="24" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 5 L28 22 M28 22 L18 22 M28 22 L26 12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>

                    {/* White rounded rectangle box surrounding the link button */}
                    <div className="px-2.5 py-1 rounded-xl border-[2.5px] border-white bg-slate-800/90 text-white flex items-center justify-center shadow-lg shadow-white/20 animate-pulse">
                      <Link className="w-4 h-4 text-white stroke-[2.8]" />
                    </div>
                  </div>

                  {/* Forward, Search, 3-Dots */}
                  <span className="text-sm opacity-70">⤳</span>
                  <span className="text-sm opacity-70">🔍</span>
                  <span className="text-sm opacity-70">⋮</span>
                </div>
              </div>

              {/* Full Channel Content Body */}
              <div className="p-3 bg-[#0b141a] space-y-3 relative text-[11px] text-slate-200">
                {/* Channel Header Profile Card */}
                <div className="flex flex-col items-center text-center space-y-1.5 py-1">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center text-slate-300">
                      <span className="text-xl">📢</span>
                    </div>
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]">
                      📷
                    </span>
                  </div>
                  <div className="font-extrabold text-xs text-white">Mulai kembangkan &quot;Test&quot;</div>
                  <div className="w-full space-y-1 pt-1 max-w-[240px]">
                    <div className="py-1 px-3 rounded-full border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1 bg-emerald-950/20">
                      <span>⭕</span> Bagikan ke status saya
                    </div>
                    <div className="py-1 px-3 rounded-full border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1 bg-emerald-950/20">
                      <span>+</span> Undang menjadi admin
                    </div>
                  </div>
                </div>

                {/* Message 1: Yo */}
                <div className="space-y-1">
                  <div className="max-w-[75%] rounded-xl rounded-tl-none p-2 bg-[#1f2c34] text-[11px]">
                    <div className="text-white font-medium">Yo</div>
                    <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 mt-0.5">
                      <span>1 pemirsa</span>
                      <span>•</span>
                      <span>18.22 ✓</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#182229] border border-slate-700/60 text-[10px]">
                    <span>🔥 276</span>
                    <span className="opacity-50 text-[9px]">⤳</span>
                  </div>
                </div>

                {/* Date Divider: Kemarin */}
                <div className="flex justify-center my-0.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#182229] text-[9px] text-slate-400 font-semibold shadow-xs">
                    Kemarin
                  </span>
                </div>

                {/* Message 2: Test */}
                <div className="space-y-1">
                  <div className="max-w-[75%] rounded-xl rounded-tl-none p-2 bg-[#1f2c34] text-[11px]">
                    <div className="text-white font-medium">Test</div>
                    <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 mt-0.5">
                      <span>1 pemirsa</span>
                      <span>•</span>
                      <span>21.37 ✓</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#182229] border border-slate-700/60 text-[10px]">
                    <span>🔥 🎣 👍 64</span>
                    <span className="opacity-50 text-[9px]">⤳</span>
                  </div>
                </div>

                {/* Date Divider: Hari ini */}
                <div className="flex justify-center my-0.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#182229] text-[9px] text-slate-400 font-semibold shadow-xs">
                    Hari ini
                  </span>
                </div>

                {/* Message 3: Pe */}
                <div className="space-y-1">
                  <div className="max-w-[75%] rounded-xl rounded-tl-none p-2 bg-[#1f2c34] text-[11px]">
                    <div className="text-white font-medium">Pe</div>
                    <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 mt-0.5">
                      <span>1 pemirsa</span>
                      <span>•</span>
                      <span>12.44 ✓</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#182229] border border-slate-700/60 text-[10px]">
                    <span>🔥 295</span>
                    <span className="opacity-50 text-[9px]">⤳</span>
                  </div>
                </div>

                {/* Message 4: Hdh */}
                <div className="space-y-1">
                  <div className="max-w-[75%] rounded-xl rounded-tl-none p-2 bg-[#1f2c34] text-[11px]">
                    <div className="text-white font-medium">Hdh</div>
                    <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 mt-0.5">
                      <span>1 pemirsa</span>
                      <span>•</span>
                      <span>12.49 ✓</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#182229] border border-slate-700/60 text-[10px]">
                    <span>👍 296</span>
                    <span className="opacity-50 text-[9px]">⤳</span>
                  </div>
                </div>

                {/* Message 5: Pe */}
                <div className="max-w-[75%] rounded-xl rounded-tl-none p-2 bg-[#1f2c34] text-[11px]">
                  <div className="text-white font-medium">Pe</div>
                  <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 mt-0.5">
                    <span>1 pemirsa</span>
                    <span>•</span>
                    <span>12.59 ✓</span>
                  </div>
                </div>

                {/* THE SELECTED POSTINGAN WITH REACTION BAR (EXACT AS USER SCREENSHOT) */}
                <div className="relative pt-6">
                  {/* Floating WhatsApp Reaction Emoji Bar */}
                  <div className="absolute top-0 left-2 px-3 py-1 rounded-full bg-[#233138] border border-slate-600 flex items-center gap-2 shadow-2xl z-10">
                    <span className="text-sm">👍</span>
                    <span className="text-sm">❤️</span>
                    <span className="text-sm">😂</span>
                    <span className="text-sm">😮</span>
                    <span className="text-sm">😢</span>
                    <span className="text-sm">🙏</span>
                    <span className="text-sm">👏</span>
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold">+</span>
                  </div>

                  {/* Selected Green Message */}
                  <div className="rounded-xl rounded-tl-none p-2.5 bg-[#005c4b] border border-emerald-400/80 text-[11px] shadow-lg">
                    <div className="text-white font-semibold leading-relaxed">
                      Tutorial mengambil link postingan chanel
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200 mt-1">
                      <span>1 pemirsa</span>
                      <span>•</span>
                      <span>13.06 ✓</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Bottom Chat Input Bar */}
                <div className="pt-2 flex items-center gap-2">
                  <div className="flex-1 rounded-full bg-[#1f2c34] px-3 py-1.5 flex items-center justify-between text-slate-400 text-xs">
                    <div className="flex items-center gap-2">
                      <span>😊</span>
                      <span className="text-[10px]">Tulis info</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span>📎</span>
                      <span>📷</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#00a884] text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                    🎤
                  </div>
                </div>

                {/* Android Bottom Navigation Bar */}
                <div className="pt-2 flex items-center justify-around text-slate-500 font-bold text-sm select-none border-t border-slate-900/60">
                  <span>|||</span>
                  <span className="text-xs">⭘</span>
                  <span>&lt;</span>
                </div>
              </div>
            </div>

            {/* Singkat & Padat Tutorial (No Bloat) */}
            <div className="space-y-2 text-xs text-slate-200 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <span><strong>Tekan & tahan</strong> postingan di Saluran WhatsApp hingga muncul menu atas.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <span>Klik <strong>ikon Tautan (🔗)</strong> di bilah atas untuk menyalin link.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <span><strong>Tempel (Paste)</strong> link ke kolom input WA Reach Tools.</span>
              </div>
            </div>

            {/* OK Button */}
            <button
              type="button"
              onClick={() => {
                soundFx.playSuccess();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Mengerti, Tutup Panduan</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
