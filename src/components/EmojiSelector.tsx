import React, { useState, useMemo } from 'react';
import { Sparkles, Check, X, Shuffle, RotateCcw, Flame, Search, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';

// Top Featured Emojis from JereAPI Docs
export const JEREAPI_FEATURED_EMOJIS = ['🔥', '❤️', '👍', '😂', '🎉'];

// Curated 200+ Everyday WhatsApp & JereAPI Emojis Organized into Categories
export const EMOJI_CATEGORIES = [
  {
    id: 'popular',
    name: 'Populer',
    icon: '🔥',
    emojis: [
      '🔥', '❤️', '👍', '😂', '🎉', '🚀', '💯', '⚡', '👏', '🙏',
      '😍', '🥳', '😎', '🥰', '🤩', '💖', '✨', '🌟', '🏆', '💎',
      '😮', '💪', '🎯', '👑', '🌈', '💐', '🎂', '🍻', '🍿', '☕'
    ],
  },
  {
    id: 'faces',
    name: 'Ekspresi Wajah',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋',
      '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
      '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
      '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥵',
      '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐',
      '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '😈', '👿', '💀'
    ],
  },
  {
    id: 'hands',
    name: 'Tangan & Gestur',
    icon: '👍',
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘',
      '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚',
      '🖐️', '🖖', '👋', '🤙', '💪', '🖕', '✍️', '🙏', '🤝', '👏',
      '🙌', '👐', '🤲', '🦶', '🦵', '🤳', '💅', '🫂', '🙇', '🙋'
    ],
  },
  {
    id: 'hearts',
    name: 'Hati & Cinta',
    icon: '💖',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌',
      '💋', '😻', '😽', '🫦', '🫀', '🌹', '💐', '🌸', '🌺', '🌻'
    ],
  },
  {
    id: 'objects',
    name: 'Simbol & Pesta',
    icon: '🎉',
    emojis: [
      '🔥', '⚡', '💥', '💫', '✨', '🌟', '⭐️', '🌈', '☀️', '🌙',
      '🎉', '🎊', '🎈', '🎁', '🎀', '🏆', '🥇', '🥈', '🥉', '🏅',
      '🎖️', '👑', '💎', '💍', '🚀', '🎯', '💯', '🔮', '🧿', '🛡️',
      '⚔️', '🪄', '🔔', '📣', '📢', '💬', '💭', '💤', '🍿', '☕',
      '🍻', '🥂', '🍷', '🍀', '🍔', '🍕', '🍦', '🎂', '🎮', '🕹️',
      '📱', '💡', '💰', '💵', '💸', '⏳', '⏰', '📌', '📍', '🪄'
    ],
  },
];

// Flat unique list of all 200+ emojis
export const ALL_SUPPORTED_EMOJIS = Array.from(
  new Set(EMOJI_CATEGORIES.flatMap((c) => c.emojis))
);

interface EmojiSelectorProps {
  selectedEmojis: string[];
  onChange: (emojis: string[]) => void;
  maxSelect?: number;
  disabled?: boolean;
}

export const EmojiSelector: React.FC<EmojiSelectorProps> = ({
  selectedEmojis,
  onChange,
  maxSelect = 4,
  disabled = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('popular');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isMaxReached = selectedEmojis.length >= maxSelect;

  // Filtered emojis based on Category or Search Query
  const displayedEmojis = useMemo(() => {
    if (searchQuery.trim()) {
      return ALL_SUPPORTED_EMOJIS.filter((e) => e.includes(searchQuery.trim()));
    }
    if (activeCategory === 'all') {
      return ALL_SUPPORTED_EMOJIS;
    }
    const cat = EMOJI_CATEGORIES.find((c) => c.id === activeCategory);
    return cat ? cat.emojis : ALL_SUPPORTED_EMOJIS;
  }, [activeCategory, searchQuery]);

  const handleToggleEmoji = (emoji: string) => {
    if (disabled) return;

    if (selectedEmojis.includes(emoji)) {
      soundFx.playClick();
      onChange(selectedEmojis.filter((e) => e !== emoji));
    } else {
      if (selectedEmojis.length < maxSelect) {
        soundFx.playClick();
        onChange([...selectedEmojis, emoji]);
      } else {
        soundFx.playError();
      }
    }
  };

  const handleSelectDefaultFlame = () => {
    if (disabled) return;
    soundFx.playSuccess();
    onChange(['🔥']);
  };

  const handleRandomize = () => {
    if (disabled) return;
    soundFx.playClick();
    const shuffled = [...ALL_SUPPORTED_EMOJIS].sort(() => 0.5 - Math.random());
    onChange(shuffled.slice(0, maxSelect));
  };

  const handleClear = () => {
    if (disabled) return;
    soundFx.playClick();
    onChange([]);
  };

  // Comma formatted representation for API visualization
  const formattedCommaString = selectedEmojis.join(', ');

  return (
    <div className="space-y-3">
      {/* Header & Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <label className="font-extrabold text-slate-100 text-xs flex items-center gap-1">
            <span>Pilih Emoji Reaksi</span>
            <span className="text-emerald-400 font-bold">(Maks. {maxSelect})</span>
          </label>
          <span
            className={`text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full border transition-all ${
              selectedEmojis.length === maxSelect
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs shadow-emerald-500/20'
                : selectedEmojis.length > 0
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700/60'
            }`}
          >
            {selectedEmojis.length} / {maxSelect} Terpilih
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-xs">
          <button
            type="button"
            onClick={handleSelectDefaultFlame}
            disabled={disabled}
            className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-colors"
            title="Pilih emoji default JereAPI: 🔥"
          >
            <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>Default (🔥)</span>
          </button>

          <button
            type="button"
            onClick={handleRandomize}
            disabled={disabled}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-colors"
            title="Pilih emoji acak dari 200+ emoji"
          >
            <Shuffle className="w-3 h-3 text-cyan-400" />
            <span className="hidden min-[380px]:inline">Acak</span>
          </button>

          {selectedEmojis.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/60 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Emojis Active Tray with Real Comma Separation Preview */}
      <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Reaksi Terpilih:</span>
          </span>
          {selectedEmojis.length > 0 && (
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
              Format API: <strong className="text-white">{formattedCommaString}</strong>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-h-[42px]">
          {selectedEmojis.length === 0 ? (
            <p className="text-[11px] text-slate-400 font-medium px-1">
              Klik emoji di bawah (1-4 emoji). Sistem otomatis menggabungkan dengan koma (<code className="text-amber-300">🔥, ❤️, 👍</code>) untuk JereAPI.
            </p>
          ) : (
            <AnimatePresence>
              {selectedEmojis.map((emoji, idx) => (
                <React.Fragment key={emoji}>
                  <motion.button
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => handleToggleEmoji(emoji)}
                    disabled={disabled}
                    className="group px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-rose-500/20 hover:to-rose-600/20 border border-emerald-500/40 hover:border-rose-500/40 text-white flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    <X className="w-3 h-3 text-emerald-300 group-hover:text-rose-300 transition-colors" />
                  </motion.button>
                  {idx < selectedEmojis.length - 1 && (
                    <span className="text-slate-500 font-bold text-xs select-none">,</span>
                  )}
                </React.Fragment>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Category Filter Pills (Horizontal Scroll on Mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            setActiveCategory('popular');
            setSearchQuery('');
          }}
          className={`px-2.5 py-1 rounded-xl border font-bold flex items-center gap-1 whitespace-nowrap transition-all shrink-0 ${
            activeCategory === 'popular' && !searchQuery
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <span>🔥</span>
          <span>Populer</span>
        </button>

        {EMOJI_CATEGORIES.filter((c) => c.id !== 'popular').map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveCategory(cat.id);
              setSearchQuery('');
            }}
            className={`px-2.5 py-1 rounded-xl border font-bold flex items-center gap-1 whitespace-nowrap transition-all shrink-0 ${
              activeCategory === cat.id && !searchQuery
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            setActiveCategory('all');
            setSearchQuery('');
          }}
          className={`px-2.5 py-1 rounded-xl border font-bold flex items-center gap-1 whitespace-nowrap transition-all shrink-0 ${
            activeCategory === 'all' && !searchQuery
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-xs'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Semua ({ALL_SUPPORTED_EMOJIS.length})</span>
        </button>
      </div>

      {/* 200+ Emoji Selection Grid (Max Height Scrollable & Android Finger Friendly) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1">
          <span>DAFTAR EMOJI SEHARI-HARI ({displayedEmojis.length} EMOJI AKTIF)</span>
          <span className="text-emerald-400 font-semibold">✓ JereAPI Multi-Reaction</span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-48 sm:max-h-56 overflow-y-auto p-1.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 custom-scrollbar">
          {displayedEmojis.map((emoji) => {
            const isSelected = selectedEmojis.includes(emoji);
            const isDisabled = !isSelected && isMaxReached;
            const isFeatured = JEREAPI_FEATURED_EMOJIS.includes(emoji);

            return (
              <motion.button
                key={emoji}
                type="button"
                whileHover={{ scale: isDisabled ? 1 : 1.15, y: isDisabled ? 0 : -2 }}
                whileTap={{ scale: isDisabled ? 1 : 0.9 }}
                onClick={() => handleToggleEmoji(emoji)}
                disabled={disabled || isDisabled}
                className={`h-10 sm:h-11 rounded-xl flex items-center justify-center text-lg sm:text-xl transition-all relative select-none ${
                  isSelected
                    ? 'bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border-2 border-emerald-400 shadow-md shadow-emerald-500/20 z-10'
                    : isDisabled
                    ? 'bg-slate-900/30 border border-slate-800/30 opacity-20 cursor-not-allowed text-slate-600'
                    : isFeatured
                    ? 'bg-slate-800/90 hover:bg-slate-700 border border-amber-500/30 hover:border-amber-400/60 cursor-pointer shadow-xs'
                    : 'bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 hover:border-slate-500 cursor-pointer'
                }`}
              >
                <span>{emoji}</span>
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[9px] shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                {isFeatured && !isSelected && !isDisabled && (
                  <span className="absolute -bottom-0.5 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" title="Rekomendasi Utama JereAPI" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
