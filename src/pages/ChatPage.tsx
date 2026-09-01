import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Smile, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  Edit3, 
  RefreshCw,
  Users,
  MessageSquare
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { motion } from 'motion/react';
import { 
  getUserProfile, 
  saveUserProfile, 
  type UserProfile,
  type UserRole
} from '../utils/storage';
import { 
  subscribeChatMessages, 
  sendChatMessageToFirebase, 
  type FirebaseChatMessage 
} from '../services/firebaseService';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  role: UserRole;
  avatarColor: string;
  isSystem?: boolean;
}

interface ChatPageProps {
  userProfile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

const QUICK_EMOJIS = ['🔥', '🚀', '💯', '⚡', '⭐', '👑', '🎯', '👍'];
const COLOR_OPTIONS = ['#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6'];

const CHAT_CACHE_KEY = 'wa_reach_cached_chat_v2';

export const ChatPage: React.FC<ChatPageProps> = ({
  userProfile,
  onUpdateProfile,
  onShowToast,
}) => {
  // Load cached messages on initial mount so chat never flickers or disappears
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const cached = localStorage.getItem(CHAT_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [
      {
        id: 'msg_welcome',
        sender: 'System Broadcast',
        text: 'Selamat datang di Global Community Chat WA Reach Tools! Gunakan chat dengan bijak dan patuhi aturan komunitas.',
        timestamp: Date.now() - 3600000,
        role: 'admin',
        avatarColor: '#10B981',
        isSystem: true,
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [tempNick, setTempNick] = useState(userProfile.username || userProfile.nickname);
  const [tempColor, setTempColor] = useState(userProfile.avatarColor);

  useEffect(() => {
    setTempNick(userProfile.username || userProfile.nickname);
    setTempColor(userProfile.avatarColor);
  }, [userProfile.username, userProfile.nickname, userProfile.avatarColor]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Helper to safely merge message lists without duplicates or losing local messages
  const mergeMessages = (currentList: ChatMessage[], newIncoming: ChatMessage[]): ChatMessage[] => {
    const map = new Map<string, ChatMessage>();
    
    // Add existing
    currentList.forEach((m) => {
      map.set(m.id, m);
    });

    // Merge incoming
    newIncoming.forEach((m) => {
      // If we find an optimistic message with same sender, text, and close timestamp (< 5s), update ID with real Firestore ID
      const matchingOptimisticKey = Array.from(map.entries()).find(([k, existing]) => 
        k.startsWith('msg_optimistic_') && 
        existing.sender === m.sender && 
        existing.text === m.text && 
        Math.abs(existing.timestamp - m.timestamp) < 5000
      );

      if (matchingOptimisticKey) {
        map.delete(matchingOptimisticKey[0]);
      }
      map.set(m.id, m);
    });

    const sorted = Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
    const finalTrimmed = sorted.slice(-150); // keep up to 150 recent messages
    
    // Save to persistent storage cache
    try {
      localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(finalTrimmed));
    } catch {}

    return finalTrimmed;
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages((prev) => mergeMessages(prev, data.messages));
        }
      }
    } catch {
      // Polling network fail silently
    }
  };

  useEffect(() => {
    // 1. Subscribe to Firestore real-time chat (Primary single source of truth)
    const unsubscribe = subscribeChatMessages((fbMessages) => {
      if (Array.isArray(fbMessages) && fbMessages.length > 0) {
        setMessages((prev) => {
          const prevCount = prev.length;
          const merged = mergeMessages(prev, fbMessages);
          
          if (!isFirstLoad.current && merged.length > prevCount) {
            const latest = merged[merged.length - 1];
            if (latest.sender !== (userProfile.nickname || userProfile.username)) {
              soundFx.playPop();
            }
          }
          return merged;
        });

        if (isFirstLoad.current) {
          isFirstLoad.current = false;
          setTimeout(scrollToBottom, 100);
        }
      }
    });

    // 2. Fetch initial messages once as auxiliary sync
    fetchMessages();

    return () => {
      unsubscribe();
    };
  }, [userProfile.nickname, userProfile.username]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    if (userProfile.role === 'blocked' || userProfile.isBlocked) {
      soundFx.playError();
      onShowToast('error', 'Akses Diblokir', userProfile.blockedReason || 'Akun Anda sedang diblokir dari fitur chat global.');
      return;
    }

    soundFx.playClick();
    setIsSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    const senderName = userProfile.nickname || userProfile.username || 'User';
    const localMsg: ChatMessage = {
      id: `msg_optimistic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender: senderName,
      text: textToSend,
      timestamp: Date.now(),
      role: userProfile.role || 'free',
      avatarColor: userProfile.avatarColor || '#10B981',
    };

    // Instant optimistic render in chat feed and persistence
    setMessages((prev) => mergeMessages(prev, [localMsg]));
    soundFx.playPop();

    try {
      // 1. Send to Firestore for real-time broadcast across all users globally
      const firestoreDocId = await sendChatMessageToFirebase({
        sender: senderName,
        text: textToSend,
        timestamp: localMsg.timestamp,
        role: userProfile.role,
        avatarColor: userProfile.avatarColor || '#10B981',
      });

      if (firestoreDocId) {
        // Update local id to real docId
        setMessages((prev) => 
          prev.map((m) => m.id === localMsg.id ? { ...m, id: firestoreDocId } : m)
        );
      }

      // 2. Auxiliary server sync
      try {
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: senderName,
            text: textToSend,
            role: userProfile.role,
            avatarColor: userProfile.avatarColor || '#10B981',
          }),
        }).catch(() => {});
      } catch {}
    } catch (err) {
      console.warn('Chat dispatch error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempNick.trim()) return;

    soundFx.playSuccess();
    const updated: UserProfile = {
      ...userProfile,
      nickname: tempNick.trim().slice(0, 24),
      avatarColor: tempColor,
    };
    saveUserProfile(updated);
    onUpdateProfile(updated);
    setIsEditingNick(false);
    onShowToast('success', 'Profil Diperbarui', `Nama chat diubah menjadi ${updated.nickname}`);
  };

  const handleAddEmoji = (emoji: string) => {
    soundFx.playClick();
    setInputText((prev) => prev + emoji);
  };

  return (
    <div className="min-h-full pb-24 pt-3 px-3 sm:px-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-135px)]">
      {/* Liquid Glass Header Bar */}
      <motion.div className="liquid-glass rounded-2xl p-3.5 sm:p-4 mb-3 border border-white/60 dark:border-white/10 shadow-md flex items-center justify-between gap-3" whileHover={{ scale: 1.01, y: -4, rotateX: 2, rotateY: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Global Channel Community
              </h2>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Diskusi real-time sesama pengelola WhatsApp Channel
            </p>
          </div>
        </div>

        {/* Profile Pill & Refresh Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundFx.playClick();
              setIsEditingNick(!isEditingNick);
            }}
            className="glass-btn flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-200/40 dark:bg-slate-800/50 border border-slate-300/40 dark:border-slate-700/40 text-xs font-semibold text-slate-700 dark:text-slate-200"
            title="Ubah nama & avatar"
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/50"
              style={{ backgroundColor: userProfile.avatarColor }}
            />
            <span className="truncate max-w-[90px] sm:max-w-[120px]">
              {userProfile.nickname}
            </span>
            {userProfile.role === 'premium' && (
              <span className="text-amber-500 text-[10px]">⭐</span>
            )}
            <Edit3 className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              fetchMessages();
            }}
            className="glass-btn w-8 h-8 rounded-xl flex items-center justify-center bg-slate-200/40 dark:bg-slate-800/50 border border-slate-300/40 dark:border-slate-700/40 text-slate-600 dark:text-slate-300"
            title="Refresh pesan"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Edit Nickname Liquid Glass Overlay */}
      {isEditingNick && (
        <div className="liquid-glass rounded-2xl p-4 mb-3 border border-emerald-500/30 shadow-lg animate-in slide-in-from-top-2">
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Ubah Nickname & Warna Avatar
              </span>
              <button
                type="button"
                onClick={() => setIsEditingNick(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                Batal
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 items-center">
              <input
                type="text"
                value={tempNick}
                onChange={(e) => setTempNick(e.target.value)}
                maxLength={20}
                placeholder="Masukkan nama tampilan..."
                className="w-full sm:flex-1 glass-input px-3 py-2 rounded-xl text-xs font-semibold outline-none"
              />

              <div className="flex items-center gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setTempColor(c)}
                    className={`w-6 h-6 rounded-full border border-white/60 transition-transform ${
                      tempColor === c ? 'scale-125 ring-2 ring-emerald-500' : 'opacity-80'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="glass-btn w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-sm"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages Stream Container */}
      <div className="flex-1 liquid-glass rounded-3xl p-4 sm:p-5 border border-white/60 dark:border-white/10 shadow-lg overflow-y-auto space-y-3 flex flex-col">
        {messages.length === 0 ? (
          <div className="m-auto text-center py-10 text-slate-400 text-xs font-medium space-y-1">
            <MessageSquare className="w-6 h-6 mx-auto opacity-40 mb-2" />
            <p>Belum ada pesan.</p>
            <p className="text-[11px]">Jadilah yang pertama mengirim chat!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === userProfile.nickname;
            const isPremiumUser = msg.role === 'premium' || msg.role === 'admin';
            const isSystem = msg.isSystem;

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  className="liquid-glass-rose rounded-xl p-2.5 text-xs text-rose-900 dark:text-rose-200 border border-rose-500/25 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] font-bold">
                      SISTEM
                    </span>
                    <span className="text-[11px] font-medium">{msg.text}</span>
                  </div>
                  <span className="text-[10px] text-rose-500/70 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${
                  isMe ? 'self-end' : 'self-start'
                }`}
              >
                {/* Sender Info */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <div
                    className="w-2.5 h-2.5 rounded-full border border-white/60"
                    style={{ backgroundColor: msg.avatarColor || '#10B981' }}
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{msg.sender}</span>

                  {isPremiumUser && (
                    <span className="px-1 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                      VIP
                    </span>
                  )}

                  <span className="text-[10px] text-slate-400 ml-0.5">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed break-words shadow-sm border ${
                    isMe
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400/40 rounded-tr-xs'
                      : 'liquid-glass text-slate-800 dark:text-slate-100 border-white/60 dark:border-white/10 rounded-tl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis Strip */}
      <div className="flex items-center gap-1.5 py-1.5 px-1 overflow-x-auto">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          Reaksi:
        </span>
        {QUICK_EMOJIS.map((em) => (
          <button
            key={em}
            type="button"
            onClick={() => handleAddEmoji(em)}
            className="glass-btn px-2 py-1 rounded-lg bg-slate-200/40 dark:bg-slate-800/40 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 border border-slate-300/30 dark:border-slate-700/30 text-xs shrink-0"
          >
            {em}
          </button>
        ))}
      </div>

      {/* Compact Liquid Glass Chat Input */}
      <div className="liquid-glass rounded-2xl p-2 sm:p-2.5 border border-white/60 dark:border-white/10 shadow-lg">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            id="input-chat-message"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={280}
            placeholder={`Tulis pesan sebagai ${userProfile.nickname}...`}
            className="flex-1 glass-input px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium outline-none"
          />
          <button
            type="submit"
            id="btn-send-chat"
            disabled={!inputText.trim() || isSending}
            className="glass-btn px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};
