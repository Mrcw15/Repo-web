export type UserRole = 'free' | 'premium' | 'admin' | 'blocked';

export interface UserProfile {
  username?: string;
  nickname: string;
  role: UserRole;
  avatarColor: string;
  premiumExpiresAt?: number;
  loginTime?: number;
  isBlocked?: boolean;
  blockedReason?: string;
  customDailyLimit?: number;
}

export interface LocalAccount {
  username: string;
  passwordHash: string;
  role: UserRole;
  avatarColor: string;
  createdAt: number;
  premiumExpiresAt?: number;
  isBlocked?: boolean;
  blockedReason?: string;
  customDailyLimit?: number;
}

export interface ReachHistoryItem {
  id: string;
  channel: string;
  timestamp: number;
  status: 'success' | 'failed';
  message: string;
  emojis?: string[];
}

export interface DailyLimitState {
  countUsedToday: number;
  maxLimit: number;
  dateKey: string;
}

const DEFAULT_FREE_LIMIT = 10;
const AVATAR_COLORS = ['#10B981', '#06B6D4', '#F43F5E', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// Local accounts storage for client fallback & persistence
export function getLocalAccounts(): LocalAccount[] {
  try {
    const raw = localStorage.getItem('wa_reach_local_accounts');
    if (raw) {
      return JSON.parse(raw) as LocalAccount[];
    }
  } catch {}
  return [
    {
      username: 'admin',
      passwordHash: 'admin123',
      role: 'admin',
      avatarColor: '#FF2E93',
      createdAt: Date.now() - 86400000 * 7,
    },
    {
      username: 'user',
      passwordHash: '123456',
      role: 'free',
      avatarColor: '#10B981',
      createdAt: Date.now() - 86400000,
    },
  ];
}

export function saveLocalAccount(account: LocalAccount): void {
  try {
    const accounts = getLocalAccounts();
    const index = accounts.findIndex(a => a.username.toLowerCase() === account.username.toLowerCase());
    if (index !== -1) {
      accounts[index] = account;
    } else {
      accounts.push(account);
    }
    localStorage.setItem('wa_reach_local_accounts', JSON.stringify(accounts));
  } catch {}
}

// Authentication Session Management
export function getAuthSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem('wa_reach_auth_session');
    if (raw) {
      const session = JSON.parse(raw) as UserProfile;
      // If blocked, enforce role and 0 limit strictly
      if (session.role === 'blocked' || session.isBlocked || session.customDailyLimit === 0) {
        session.role = 'blocked';
        session.isBlocked = true;
        session.customDailyLimit = 0;
      } else if (session.role === 'premium' && session.premiumExpiresAt) {
        // Check if premium has expired
        if (Date.now() > session.premiumExpiresAt) {
          session.role = 'free';
          delete session.premiumExpiresAt;
          saveAuthSession(session);
        }
      }
      return session;
    }
  } catch {}
  return null;
}

export function saveAuthSession(profile: UserProfile): void {
  try {
    const isUserBlocked = profile.role === 'blocked' || !!profile.isBlocked || profile.customDailyLimit === 0;
    const sanitized: UserProfile = {
      ...profile,
      role: isUserBlocked ? 'blocked' : profile.role,
      isBlocked: isUserBlocked,
      customDailyLimit: isUserBlocked ? 0 : profile.customDailyLimit,
    };
    localStorage.setItem('wa_reach_auth_session', JSON.stringify(sanitized));
    localStorage.setItem('wa_reach_user_profile', JSON.stringify(sanitized));
  } catch {}
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem('wa_reach_auth_session');
    localStorage.removeItem('wa_reach_user_profile');
  } catch {}
}

// User Profile Storage Helper
export function getUserProfile(): UserProfile {
  const session = getAuthSession();
  if (session) return session;

  return {
    username: 'guest',
    nickname: 'Guest User',
    role: 'free',
    avatarColor: '#10B981',
  };
}

export function saveUserProfile(profile: UserProfile): void {
  saveAuthSession(profile);
}

export interface ReachEngineConfig {
  boostSpeedMode: 'turbo' | 'normal' | 'eco';
  globalCooldownSeconds: number;
  isEmergencyPaused: boolean;
  maintenanceNotice?: string;
  blacklistChannels: string[];
}

export function getLocalReachEngineConfig(): ReachEngineConfig {
  try {
    const raw = localStorage.getItem('wa_reach_engine_config');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    boostSpeedMode: 'turbo',
    globalCooldownSeconds: 3,
    isEmergencyPaused: false,
    blacklistChannels: [],
  };
}

export function saveLocalReachEngineConfig(config: ReachEngineConfig): void {
  try {
    localStorage.setItem('wa_reach_engine_config', JSON.stringify(config));
  } catch {}
}

// Daily Reach Limit Tracking (Synced with server & local state)
export function getDailyLimitState(role: UserRole, customLimit?: number, isBlocked?: boolean): { used: number; max: number; remaining: number; isUnlimited: boolean; isBlocked: boolean } {
  const isUserBlocked = role === 'blocked' || !!isBlocked || customLimit === 0;
  if (isUserBlocked) {
    return {
      used: 0,
      max: 0,
      remaining: 0,
      isUnlimited: false,
      isBlocked: true,
    };
  }

  const todayKey = getTodayKey();
  let used = 0;

  try {
    const raw = localStorage.getItem('wa_reach_daily_limit');
    if (raw) {
      const parsed = JSON.parse(raw) as DailyLimitState;
      if (parsed.dateKey === todayKey) {
        used = parsed.countUsedToday || 0;
      }
    }
  } catch {}

  const isUnlimited = role === 'premium' || role === 'admin';
  const effectiveMax = typeof customLimit === 'number' ? customLimit : DEFAULT_FREE_LIMIT;
  const max = isUnlimited ? 9999 : effectiveMax;
  const remaining = isUnlimited ? 9999 : Math.max(0, max - used);

  return {
    used,
    max,
    remaining,
    isUnlimited,
    isBlocked: false,
  };
}

export function incrementDailyLimitUsage(count: number = 1, customLimit?: number): number {
  if (customLimit === 0) return 0;
  const todayKey = getTodayKey();
  let used = 0;

  try {
    const raw = localStorage.getItem('wa_reach_daily_limit');
    if (raw) {
      const parsed = JSON.parse(raw) as DailyLimitState;
      if (parsed.dateKey === todayKey) {
        used = parsed.countUsedToday || 0;
      }
    }
  } catch {}

  used += count;

  const effectiveMax = typeof customLimit === 'number' ? customLimit : DEFAULT_FREE_LIMIT;

  const newState: DailyLimitState = {
    countUsedToday: used,
    maxLimit: effectiveMax,
    dateKey: todayKey,
  };

  try {
    localStorage.setItem('wa_reach_daily_limit', JSON.stringify(newState));
  } catch {}

  return used;
}

export function resetDailyLimitUsage(): void {
  const todayKey = getTodayKey();
  const newState: DailyLimitState = {
    countUsedToday: 0,
    maxLimit: DEFAULT_FREE_LIMIT,
    dateKey: todayKey,
  };
  localStorage.setItem('wa_reach_daily_limit', JSON.stringify(newState));
}

// Reach History
export function getReachHistory(): ReachHistoryItem[] {
  try {
    const raw = localStorage.getItem('wa_reach_history');
    if (raw) {
      return JSON.parse(raw) as ReachHistoryItem[];
    }
  } catch {}
  return [];
}

export function addReachHistoryItem(item: Omit<ReachHistoryItem, 'id' | 'timestamp'>): ReachHistoryItem {
  const history = getReachHistory();
  const newItem: ReachHistoryItem = {
    ...item,
    id: `reach-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: Date.now(),
  };
  history.unshift(newItem);
  const trimmed = history.slice(0, 50);
  try {
    localStorage.setItem('wa_reach_history', JSON.stringify(trimmed));
  } catch {}
  return newItem;
}

export function clearReachHistory(): void {
  try {
    localStorage.removeItem('wa_reach_history');
  } catch {}
}
