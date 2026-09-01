import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, Keyboard, Shuffle, Trash2 } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

interface EmojiSelectorProps {
  selectedEmojis: string[];
  onChange: (emojis: string[]) => void;
  maxSelect?: number;
  disabled?: boolean;
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const EmojiSelector: React.FC<EmojiSelectorProps> = ({
  selectedEmojis,
  onChange,
  disabled = false,
  onShowToast,
}) => {
  const MAX_EMOJIS = 4;
  
  // Create an array of exactly 4 strings for the OTP style boxes
  const slots = Array.from({ length: MAX_EMOJIS }, (_, i) => selectedEmojis[i] || '');
  
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, MAX_EMOJIS);
  }, []);

  const isEmoji = (str: string) => {
    // Check for standard keycap sequences (e.g. 2️⃣)
    if (/^[\u0023-\u0039]\ufe0f?\u20e3$/.test(str)) return true;
    
    // Strip variation selectors to check the base character
    const baseStr = str.replace(/[\uFE0F\uFE0E]/g, '');
    
    // Reject simple textual symbols often classified as emojis (like ©, ®, ™, arrows up to U+21AA)
    if (baseStr.length === 1 && baseStr.charCodeAt(0) <= 0x21AA) {
      return false;
    }
    
    // Accept other pictographic emojis
    return /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(str);
  };

  const handleRandomize = () => {
    if (disabled) return;
    const POPULAR_EMOJIS = ['🔥', '😂', '❤️', '👍', '🚀', '✨', '🎉', '🙌', '💯', '😎', '💡', '✅', '🙏', '😍', '🥰', '🤯', '🤩', '🥶', '😈', '👻', '💀', '🤡', '👽', '🤖', '👾'];
    const shuffled = [...POPULAR_EMOJIS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, MAX_EMOJIS);
    onChange(selected);
    soundFx.playClick();
  };

  const handleClear = () => {
    if (disabled) return;
    onChange([]);
    soundFx.playClick();
  };

  const handleInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Remove formatting characters (spaces, commas, brackets)
    const cleaned = val.replace(/[\s,\[\]]/g, '');
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const graphemes = Array.from(segmenter.segment(cleaned)).map(s => s.segment).filter(s => s.trim() !== '');

    if (graphemes.length === 0) {
      // User cleared the input
      const newEmojis = [...slots];
      newEmojis[index] = '';
      onChange(newEmojis.filter(e => e !== ''));
      return;
    }

    let hasInvalid = false;
    const validEmojis = graphemes.filter(g => {
      if (isEmoji(g)) return true;
      hasInvalid = true;
      return false;
    });

    if (hasInvalid) {
      soundFx.playError();
      if (onShowToast) {
        onShowToast('warning', 'Input Tidak Valid', 'Hanya boleh menggunakan emoji.');
      }
      if (validEmojis.length === 0) {
        return; // Ignore completely if there's no valid emoji
      }
    }

    // User typed or pasted 1 or more emojis
    const newEmojis = [...slots];
    let currIdx = index;
    for (let i = 0; i < validEmojis.length && currIdx < MAX_EMOJIS; i++) {
      newEmojis[currIdx] = validEmojis[i];
      currIdx++;
    }
    
    onChange(newEmojis.filter(e => e !== ''));
    soundFx.playClick();
    
    // Move focus to next slot
    if (currIdx < MAX_EMOJIS) {
      inputRefs.current[currIdx]?.focus();
    } else {
      inputRefs.current[MAX_EMOJIS - 1]?.focus(); // Stay on last if full
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!slots[index] && index > 0) {
        // If current slot is empty and backspace is pressed, focus previous and clear it
        const newEmojis = [...slots];
        newEmojis[index - 1] = '';
        onChange(newEmojis.filter(e => e !== ''));
        inputRefs.current[index - 1]?.focus();
      } else {
        // Just clear current slot
        const newEmojis = [...slots];
        newEmojis[index] = '';
        onChange(newEmojis.filter(e => e !== ''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < MAX_EMOJIS - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // derived string format [🔥, ❤️]
  const displayValue = selectedEmojis.length > 0 ? `[${selectedEmojis.join(', ')}]` : '';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <label className="text-sm font-black text-slate-200 flex items-center gap-2 whitespace-nowrap">
            <Keyboard className="w-4 h-4 text-emerald-400" />
            <span>Input Emoji</span>
          </label>
          <span className="sm:hidden text-[10px] font-bold text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50">
            {selectedEmojis.length} / {MAX_EMOJIS} Maks
          </span>
        </div>
        
        <div className="flex items-center justify-start sm:justify-end gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomize}
              disabled={disabled}
              className="flex items-center gap-1.5 text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-md hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              title="Acak Emoji"
            >
              <Shuffle className="w-3.5 h-3.5" /> Acak
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled || selectedEmojis.length === 0}
              className="flex items-center gap-1.5 text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-md hover:bg-rose-500/30 transition-colors disabled:opacity-50"
              title="Hapus Semua"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus
            </button>
          </div>
          <span className="hidden sm:inline-flex text-[10px] font-bold text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50">
            {selectedEmojis.length} / {MAX_EMOJIS} Maks
          </span>
        </div>
      </div>
      
      {/* 4 Square Inputs Box */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 w-full">
        {slots.map((emoji, index) => {
          const isFocused = focusedIndex === index;
          return (
            <div 
              key={index} 
              className={`relative flex-1 aspect-[4/5] max-w-[4.5rem] rounded-2xl sm:rounded-3xl transition-all overflow-hidden ${
                isFocused 
                  ? 'border-[3px] border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-slate-900/80 scale-105'
                  : 'border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60'
              }`}
              onClick={() => inputRefs.current[index]?.focus()}
            >
              <input
                ref={el => inputRefs.current[index] = el}
                type="text"
                value={emoji}
                onChange={(e) => handleInput(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                disabled={disabled}
                className="absolute inset-0 w-full h-full opacity-0 cursor-text select-none z-10"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <AnimatePresence mode="popLayout">
                  {emoji && (
                    <motion.span 
                      key={emoji}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="text-3xl sm:text-4xl"
                    >
                      {emoji}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 px-1 pt-2">
        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Ketik emoji di kotak. Sistem otomatis menggabungkannya.
        </p>
        {selectedEmojis.length > 0 && (
          <div className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/30 inline-block">
            Format yang akan dikirim: <strong className="text-white tracking-widest">{displayValue}</strong>
          </div>
        )}
      </div>
    </div>
  );
};
