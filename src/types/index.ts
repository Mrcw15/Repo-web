export type NavTab = 'reach' | 'chat' | 'premium' | 'owner';
export type { UserRole } from '../utils/storage';

export interface ReachHistoryItem {
  id: string;
  channelUrl: string;
  channelName?: string;
  count: number;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
  responseMessage?: string;
  reachId?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isPremium?: boolean;
  role?: 'user' | 'premium' | 'owner' | 'system';
  avatarColor?: string;
  tag?: string;
}

export interface UserState {
  deviceId: string;
  nickname: string;
  isPremium: boolean;
  premiumExpiry: number | null; // timestamp
  premiumPlan?: string;
  dailyUsageCount: number;
  lastUsageDate: string; // YYYY-MM-DD
  soundEnabled: boolean;
  theme: 'light' | 'dark';
}

export interface PremiumCode {
  code: string;
  plan: 'daily' | 'weekly' | 'monthly' | 'lifetime';
  name: string;
  durationDays: number;
  maxUses: number;
  currentUses: number;
  createdAt: number;
}

export interface ReachApiResponse {
  success: boolean;
  message: string;
  data?: {
    channel?: string;
    count?: number;
    reachId?: string;
    remainingLimit?: number;
    isFallback?: boolean;
  };
  raw?: any;
}
