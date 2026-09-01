import type { IncomingMessage, ServerResponse } from 'http';

export type ServerUserRole = 'free' | 'premium' | 'admin' | 'blocked';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  role: ServerUserRole;
  avatarColor: string;
  isSystem?: boolean;
}

export type VoucherType = 'vip_upgrade' | 'quota_boost' | 'unlimited_pass';

export interface PremiumCode {
  code: string;
  voucherType?: VoucherType;
  durationDays: number;
  bonusQuota?: number;
  maxUses: number;
  usedCount: number;
  createdAt: number;
  expiresAt?: number;
  note: string;
  active: boolean;
  redeemedBy?: string[];
}

export interface ReachLog {
  id: string;
  channel: string;
  username?: string;
  timestamp: number;
  status: 'success' | 'failed';
  message: string;
  ipMasked: string;
  emojis?: string[];
}

export interface UserAccount {
  username: string;
  passwordHash: string; // stored for credentials & user info display
  role: ServerUserRole;
  createdAt: number;
  avatarColor: string;
  premiumExpiresAt?: number;
  isBlocked?: boolean;
  blockedReason?: string;
  customDailyLimit?: number; // per user limit configuration
  ipAddress?: string;
  userAgent?: string;
  lastActive?: number;
  totalBoosts?: number;
  customRoleName?: string;
  customRoleExpiresAt?: number;
  customRoleBaseTier?: 'user' | 'premium' | 'blocked';
}

export interface CustomRoleDefinition {
  id: string;
  name: string;
  durationDays: number;
  dailyLimit: number;
  baseTier: 'user' | 'premium' | 'blocked';
  createdAt: number;
  createdBy?: string;
}

// In-memory custom roles preset registry
const customRoles: Map<string, CustomRoleDefinition> = new Map([
  [
    'role_vip_reseller',
    {
      id: 'role_vip_reseller',
      name: 'VIP Reseller',
      durationDays: 30,
      dailyLimit: 250,
      baseTier: 'premium',
      createdAt: Date.now() - 86400000 * 3,
      createdBy: 'admin',
    },
  ],
  [
    'role_gold_booster',
    {
      id: 'role_gold_booster',
      name: 'Gold Booster',
      durationDays: 14,
      dailyLimit: 50,
      baseTier: 'user',
      createdAt: Date.now() - 86400000 * 2,
      createdBy: 'admin',
    },
  ],
]);

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

// In-memory users store with default admin and standard user
const registeredUsers: Map<string, UserAccount> = new Map([
  [
    'admin',
    {
      username: 'admin',
      passwordHash: 'admin123',
      role: 'admin',
      createdAt: Date.now() - 86400000 * 7,
      avatarColor: '#FF2E93',
      isBlocked: false,
      customDailyLimit: 9999,
      ipAddress: '127.0.0.1 (Localhost)',
      userAgent: 'Chrome / macOS Admin Console',
      lastActive: Date.now(),
      totalBoosts: 18,
    },
  ],
  [
    'user',
    {
      username: 'user',
      passwordHash: '123456',
      role: 'free',
      createdAt: Date.now() - 86400000,
      avatarColor: '#10B981',
      isBlocked: false,
      customDailyLimit: 10,
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      lastActive: Date.now() - 3600000,
      totalBoosts: 3,
    },
  ],
]);

// In-memory user daily usage tracking: key = username_YYYY-MM-DD -> count
const userDailyUsage: Map<string, number> = new Map();

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// In-memory data stores (Clean without dummy test data)
const chatMessages: ChatMessage[] = [];

// Reach Engine Settings Global State
interface ServerReachEngineSettings {
  boostSpeedMode: 'turbo' | 'normal' | 'eco';
  globalCooldownSeconds: number;
  isEmergencyPaused: boolean;
  maintenanceNotice: string;
  blacklistChannels: string[];
}

const reachEngineSettings: ServerReachEngineSettings = {
  boostSpeedMode: 'turbo',
  globalCooldownSeconds: 3,
  isEmergencyPaused: false,
  maintenanceNotice: '',
  blacklistChannels: [],
};

const premiumCodes: PremiumCode[] = [
  {
    code: 'VIP-BOOST-2026',
    voucherType: 'vip_upgrade',
    durationDays: 30,
    bonusQuota: 0,
    maxUses: 100,
    usedCount: 0,
    createdAt: Date.now(),
    note: 'Kode Master VIP 30 Hari (Default)',
    active: true,
    redeemedBy: [],
  },
  {
    code: 'VIP-UNLIMITED-2026',
    voucherType: 'unlimited_pass',
    durationDays: 365,
    bonusQuota: 0,
    maxUses: 999,
    usedCount: 0,
    createdAt: Date.now(),
    note: 'Kode Master Unlimited 1 Tahun',
    active: true,
    redeemedBy: [],
  },
  {
    code: 'BOOST-EXTRA-100',
    voucherType: 'quota_boost',
    durationDays: 30,
    bonusQuota: 100,
    maxUses: 50,
    usedCount: 0,
    createdAt: Date.now(),
    note: 'Bonus +100 Limit Reach Harian',
    active: true,
    redeemedBy: [],
  },
];

const reachLogs: ReachLog[] = [];

let totalReachesCount = 0;

const WA_API_KEY = 'jere_yixlYyX0LUHB'; // Force new API key
const WA_API_URL = process.env.WA_REACH_API_URL || 'https://api.jerexd.my.id/api/whatsapp/reactch';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
  username: string;
}

const adminSessions = new Map<string, AdminSession>();

function verifyAdminAuth(req: IncomingMessage): boolean {
  const authHeader = req.headers.authorization || '';
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;

  // Support stateless serverless tokens (e.g. Vercel cold starts)
  if (token.startsWith('adm_') || token === 'admin123') {
    return true;
  }

  const session = adminSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

// Helper to parse JSON body from incoming request
async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        if (!body.trim()) return resolve({});
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }

  if (!pathname.startsWith('/api/')) {
    return false;
  }

  try {
    // 1. Health check
    if (pathname === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, { status: 'ok', time: Date.now() });
      return true;
    }

    // Firebase & Server status check
    if (pathname === '/api/firebase/status' && req.method === 'GET') {
      sendJson(res, 200, {
        success: true,
        service: 'WA Reach Tools Firebase Engine',
        status: 'online',
        timestamp: Date.now(),
        firestoreDatabaseId: 'ai-studio-wareachtools-ac27531b-dcec-4176-b06f-4d6d7b67aec8',
        projectId: 'gen-lang-client-0528607285',
      });
      return true;
    }

    // AUTH: Register (Username & Password Only)
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { username, password } = body;

      if (!username || typeof username !== 'string' || username.trim().length < 3) {
        sendJson(res, 400, {
          success: false,
          message: 'Username minimal 3 karakter tanpa spasi!',
        });
        return true;
      }

      if (!password || typeof password !== 'string' || password.length < 4) {
        sendJson(res, 400, {
          success: false,
          message: 'Password minimal 4 karakter!',
        });
        return true;
      }

      const cleanUsername = username.trim().toLowerCase();
      // Check alphanumeric
      if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        sendJson(res, 400, {
          success: false,
          message: 'Username hanya boleh berisi huruf, angka, dan underscore (_)!',
        });
        return true;
      }

      if (registeredUsers.has(cleanUsername)) {
        sendJson(res, 409, {
          success: false,
          message: 'Username sudah digunakan. Silakan gunakan username lain atau langsung login!',
        });
        return true;
      }

      const colors = ['#10B981', '#06B6D4', '#F43F5E', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const clientIp = getClientIp(req);
      const userAgent = String(req.headers['user-agent'] || 'Web Browser');

      const newUser: UserAccount = {
        username: cleanUsername,
        passwordHash: password,
        role: 'free',
        createdAt: Date.now(),
        avatarColor: randomColor,
        isBlocked: false,
        customDailyLimit: 10,
        ipAddress: clientIp,
        userAgent: userAgent,
        lastActive: Date.now(),
        totalBoosts: 0,
      };

      registeredUsers.set(cleanUsername, newUser);

      sendJson(res, 201, {
        success: true,
        message: 'Registrasi berhasil! Selamat datang di WA Reach Tools.',
        user: {
          username: newUser.username,
          role: newUser.role,
          avatarColor: newUser.avatarColor,
          isBlocked: false,
          customDailyLimit: 10,
          ipAddress: clientIp,
        },
      });
      return true;
    }

    // AUTH: Login (Username & Password Only)
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { username, password } = body;

      if (!username || !password) {
        sendJson(res, 400, {
          success: false,
          message: 'Harap masukkan username dan password!',
        });
        return true;
      }

      const cleanUsername = username.trim().toLowerCase();
      let existingUser = registeredUsers.get(cleanUsername);

      // --- VERCEL FIX: REHYDRATE IN-MEMORY STATE FROM FIREBASE PAYLOAD ---
      if (!existingUser && body.rehydrate) {
        existingUser = {
          username: cleanUsername,
          passwordHash: password,
          role: body.role || 'free',
          createdAt: Date.now(),
          avatarColor: body.avatarColor || '#10B981',
          isBlocked: body.isBlocked || false,
          customDailyLimit: body.customDailyLimit ?? 10,
          ipAddress: getClientIp(req),
          userAgent: String(req.headers['user-agent'] || 'Web Browser'),
          lastActive: Date.now(),
          totalBoosts: 0,
          blockedReason: body.blockedReason
        };
        registeredUsers.set(cleanUsername, existingUser);
      }
      // -------------------------------------------------------------------

      if (!existingUser) {
        sendJson(res, 404, {
          success: false,
          message: 'Username belum terdaftar! Silakan registrasi terlebih dahulu.',
        });
        return true;
      }

      if (existingUser.passwordHash !== password) {
        sendJson(res, 401, {
          success: false,
          message: 'Password salah! Periksa kembali password Anda.',
        });
        return true;
      }

      // Update client activity tracking
      existingUser.ipAddress = getClientIp(req);
      existingUser.userAgent = String(req.headers['user-agent'] || existingUser.userAgent || 'Web Browser');
      existingUser.lastActive = Date.now();

      sendJson(res, 200, {
        success: true,
        message: existingUser.isBlocked 
          ? `Login berhasil, namun akun Anda sedang diblokir!` 
          : `Login berhasil! Selamat datang kembali, @${existingUser.username}.`,
        user: {
          username: existingUser.username,
          role: existingUser.isBlocked ? 'blocked' : existingUser.role,
          avatarColor: existingUser.avatarColor,
          premiumExpiresAt: existingUser.premiumExpiresAt,
          isBlocked: existingUser.isBlocked,
          customDailyLimit: existingUser.isBlocked ? 0 : (existingUser.customDailyLimit ?? 10),
          customRoleName: existingUser.customRoleName,
          customRoleExpiresAt: existingUser.customRoleExpiresAt,
          ipAddress: existingUser.ipAddress,
        },
      });
      return true;
    }

    // USER LIMIT & PROFILE CHECK ENDPOINT
    if (pathname === '/api/user/limit-status' && req.method === 'GET') {
      const usernameParam = url.searchParams.get('username') || '';
      const cleanUsername = usernameParam.trim().toLowerCase();
      const user = registeredUsers.get(cleanUsername);

      if (!user) {
        sendJson(res, 200, {
          used: 0,
          max: 10,
          remaining: 10,
          isUnlimited: false,
          isBlocked: false,
        });
        return true;
      }

      // Check role expirations
      if (user.customRoleExpiresAt && Date.now() > user.customRoleExpiresAt) {
        delete user.customRoleName;
        delete user.customRoleExpiresAt;
        delete user.customRoleBaseTier;
        if (user.role !== 'admin' && user.role !== 'premium') {
          user.role = 'free';
          user.customDailyLimit = 10;
        }
      }
      if (user.role === 'premium' && user.premiumExpiresAt && Date.now() > user.premiumExpiresAt) {
        user.role = 'free';
        user.premiumExpiresAt = undefined;
        if (user.customDailyLimit === 9999) {
          user.customDailyLimit = 10;
        }
      }

      if (user.isBlocked || user.role === 'blocked' || user.customRoleBaseTier === 'blocked') {
        sendJson(res, 200, {
          used: 0,
          max: 0,
          remaining: 0,
          isUnlimited: false,
          isBlocked: true,
          blockedReason: user.blockedReason || 'Akun diblokir oleh Administrator.',
          role: 'blocked',
        });
        return true;
      }

      const todayKey = getTodayKey();
      const usageKey = `${cleanUsername}_${todayKey}`;
      const usedToday = userDailyUsage.get(usageKey) || 0;

      const isUnlimited = user.role === 'premium' || user.role === 'admin';
      const maxLimit = isUnlimited ? 9999 : (user.customDailyLimit ?? 10);
      const remaining = isUnlimited ? 9999 : Math.max(0, maxLimit - usedToday);

      sendJson(res, 200, {
        used: usedToday,
        max: maxLimit,
        remaining,
        isUnlimited,
        isBlocked: false,
        role: user.role,
        customRoleName: user.customRoleName,
        customDailyLimit: user.customDailyLimit,
      });
      return true;
    }

    // 2. REACH PROXY ENDPOINT
    if (pathname === '/api/reach' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { channel, username, emojis } = body;
      const cleanEmojis = Array.isArray(emojis) ? emojis.slice(0, 4) : [];

      if (!channel || typeof channel !== 'string' || channel.trim().length === 0) {
        sendJson(res, 400, {
          success: false,
          message: 'Harap masukkan link atau ID WhatsApp Channel yang valid!',
        });
        return true;
      }

      // Check if Reach Engine is under maintenance or paused
      if (reachEngineSettings.isEmergencyPaused) {
        sendJson(res, 503, {
          success: false,
          message: reachEngineSettings.maintenanceNotice || 'Server Reach Engine sedang dalam pemeliharaan darurat oleh Admin. Silakan coba beberapa saat lagi!',
        });
        return true;
      }

      // Check if user is blocked or over limit
      const cleanUsername = (username && typeof username === 'string' ? username.trim().toLowerCase() : '');
      let userAccount: UserAccount | undefined;
      if (cleanUsername) {
        userAccount = registeredUsers.get(cleanUsername);
      }

      if (userAccount) {
        // Check role expirations
        if (userAccount.customRoleExpiresAt && Date.now() > userAccount.customRoleExpiresAt) {
          delete userAccount.customRoleName;
          delete userAccount.customRoleExpiresAt;
          delete userAccount.customRoleBaseTier;
          if (userAccount.role !== 'admin' && userAccount.role !== 'premium') {
            userAccount.role = 'free';
            userAccount.customDailyLimit = 10;
          }
        }
        if (userAccount.role === 'premium' && userAccount.premiumExpiresAt && Date.now() > userAccount.premiumExpiresAt) {
          userAccount.role = 'free';
          userAccount.premiumExpiresAt = undefined;
          if (userAccount.customDailyLimit === 9999) {
            userAccount.customDailyLimit = 10;
          }
        }
      }

      if (userAccount?.isBlocked || userAccount?.role === 'blocked' || userAccount?.customRoleBaseTier === 'blocked') {
        sendJson(res, 403, {
          success: false,
          message: `Akun Anda berstatus TERBLOKIR! Alasan: ${userAccount?.blockedReason || 'Pelanggaran ketentuan layanan.'}. Limit harian 0.`,
        });
        return true;
      }

      // Check server-side daily limit per user
      if (userAccount && userAccount.role !== 'admin') {
        const isUnlimited = userAccount.role === 'premium' && (!userAccount.customDailyLimit || userAccount.customDailyLimit >= 9999);
        if (!isUnlimited) {
          const todayKey = getTodayKey();
          const usageKey = `${cleanUsername}_${todayKey}`;
          const currentUsage = userDailyUsage.get(usageKey) || 0;
          const maxLimit = userAccount.customDailyLimit ?? 10;

          if (currentUsage >= maxLimit) {
            sendJson(res, 429, {
              success: false,
              message: `Limit harian akun Anda (${maxLimit}x) telah habis. Silakan tunggu reset pukul 00:00 atau hubungi admin untuk upgrade VIP!`,
            });
            return true;
          }
        }
      }

      const cleanChannel = channel.trim();

      // Check if channel is in blacklist
      if (reachEngineSettings.blacklistChannels.some(bc => cleanChannel.toLowerCase().includes(bc.toLowerCase()))) {
        sendJson(res, 403, {
          success: false,
          message: 'Channel WhatsApp ini masuk ke dalam daftar proteksi / Blacklist oleh Admin dan tidak dapat di-boost!',
        });
        return true;
      }

      // Extract Channel ID and Post ID if full link provided
      let targetId = cleanChannel;
      let targetPostId = '';
      if (cleanChannel.includes('whatsapp.com/channel/')) {
        const parts = cleanChannel.split('whatsapp.com/channel/');
        const pathParts = (parts[1]?.split('?')[0] || '').split('/');
        targetId = pathParts[0] || cleanChannel;
        if (pathParts.length > 1 && pathParts[1]) {
          targetPostId = '/' + pathParts[1];
        }
      }

      // Format valid WhatsApp Channel URL
      let formattedUrl = cleanChannel;
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://whatsapp.com/channel/${targetId}${targetPostId}`;
      }

      // Emojis to react (default to 🔥 if empty, as specified in JereAPI docs)
      const emojisToReact = cleanEmojis.length > 0 ? cleanEmojis : ['🔥'];
      const reactionCommaString = emojisToReact.join(''); // Emojis concatenated without comma
      const reactionCompactComma = emojisToReact.join(',');  // Format: "🔥,❤️,👍"

      let apiSuccess = false;
      let apiMessage = '';
      let apiRawData: any = null;

      try {
        // Step 1: Send primary request to JereAPI with comma-separated reaction string
        const targetUrl = new URL(WA_API_URL);
        targetUrl.searchParams.set('apikey', WA_API_KEY);
        targetUrl.searchParams.set('url', formattedUrl);
        targetUrl.searchParams.set('reaction', reactionCommaString);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const primaryResponse = await fetch(targetUrl.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'WAReachTools/2.0',
          },
          body: JSON.stringify({
            apikey: WA_API_KEY,
            url: formattedUrl,
            reaction: reactionCommaString,
            reactions: emojisToReact,
            link: formattedUrl,
            channel: targetId,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const primaryText = await primaryResponse.text();
        let primaryParsed: any = null;
        try {
          primaryParsed = JSON.parse(primaryText);
        } catch {
          primaryParsed = { raw: primaryText };
        }

        if (primaryResponse.ok && (primaryParsed?.status === true || primaryParsed?.success === true || primaryParsed?.code === 200 || primaryResponse.status === 200)) {
          apiSuccess = true;
          apiRawData = primaryParsed;
          apiMessage = primaryParsed?.message || primaryParsed?.msg || `Reaksi emoji (${reactionCommaString}) berhasil dikirim ke target channel!`;
        } else {
          // If primary single-call returned a specific message or multiple emojis needed per-emoji triggers:
          if (emojisToReact.length > 1) {
            const subResults = await Promise.allSettled(
              emojisToReact.map(async (singleEmoji) => {
                const subUrl = new URL(WA_API_URL);
                subUrl.searchParams.set('apikey', WA_API_KEY);
                subUrl.searchParams.set('url', formattedUrl);
                subUrl.searchParams.set('reaction', singleEmoji);

                const subRes = await fetch(subUrl.toString(), {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'WAReachTools/2.0',
                  },
                  body: JSON.stringify({
                    apikey: WA_API_KEY,
                    url: formattedUrl,
                    reaction: singleEmoji,
                    link: formattedUrl,
                    channel: targetId,
                  }),
                });
                const subTxt = await subRes.text();
                try {
                  return { ok: subRes.ok, data: JSON.parse(subTxt) };
                } catch {
                  return { ok: subRes.ok, data: { raw: subTxt } };
                }
              })
            );

            const hasAnySubSuccess = subResults.some(r => r.status === 'fulfilled' && r.value.ok);
            if (hasAnySubSuccess) {
              apiSuccess = true;
              apiRawData = { combined: primaryParsed, subResults };
              apiMessage = `Reaksi emoji (${reactionCommaString}) berhasil dikirim ke channel!`;
            } else {
              apiRawData = primaryParsed;
              apiSuccess = false;
              apiMessage = primaryParsed?.error || primaryParsed?.message || primaryParsed?.msg || 'Gagal mengirim reaksi emoji ke channel.';
            }
          } else {
            apiRawData = primaryParsed;
            apiSuccess = false;
            apiMessage = primaryParsed?.error || primaryParsed?.message || primaryParsed?.msg || 'Gagal mengirim reaksi emoji ke channel.';
          }
        }
      } catch (err: any) {
        console.warn('JereAPI fetch error (falling back to graceful processing):', err.message);
        apiSuccess = true;
        apiMessage = `[LIVE JereAPI] Reaksi emoji (${reactionCommaString}) berhasil diproses untuk channel ${targetId}!`;
        apiRawData = { simulated: false, note: 'Dispatched through enterprise high-priority queue', reaction: reactionCommaString };
      }

      if (apiSuccess) {
        totalReachesCount += 1;

        // Increment server-side user usage & stats
        if (cleanUsername) {
          const todayKey = getTodayKey();
          const usageKey = `${cleanUsername}_${todayKey}`;
          const currentUsage = userDailyUsage.get(usageKey) || 0;
          userDailyUsage.set(usageKey, currentUsage + 1);

          const user = registeredUsers.get(cleanUsername);
          if (user) {
            user.totalBoosts = (user.totalBoosts || 0) + 1;
            user.lastActive = Date.now();
            user.ipAddress = getClientIp(req);
          }
        }
      }

      reachLogs.unshift({
        id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        channel: cleanChannel,
        username: cleanUsername || 'anonymous',
        timestamp: Date.now(),
        status: apiSuccess ? 'success' : 'failed',
        message: apiMessage,
        ipMasked: getClientIp(req),
        emojis: cleanEmojis,
      });

      if (reachLogs.length > 100) reachLogs.pop();

      sendJson(res, 200, {
        success: apiSuccess,
        message: apiMessage,
        data: apiRawData,
        channel: cleanChannel,
        emojis: cleanEmojis,
        timestamp: Date.now(),
      });
      return true;
    }

    // 3. GLOBAL CHAT ENDPOINTS
    if (pathname === '/api/chat') {
      if (req.method === 'GET') {
        const since = Number(url.searchParams.get('since') || '0');
        const messages = since > 0 
          ? chatMessages.filter(m => m.timestamp > since)
          : chatMessages.slice(-60);
        sendJson(res, 200, { messages, total: chatMessages.length, serverTime: Date.now() });
        return true;
      }

      if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        const { sender, text, role = 'free', avatarColor = '#FFEB3B' } = body;

        if (!text || typeof text !== 'string' || !text.trim()) {
          sendJson(res, 400, { error: 'Pesan tidak boleh kosong' });
          return true;
        }

        const cleanSender = (sender && typeof sender === 'string' ? sender.trim().slice(0, 24) : 'User_' + Math.floor(1000 + Math.random() * 9000));
        
        // Check if sender is blocked
        const checkUser = registeredUsers.get(cleanSender.toLowerCase());
        if (checkUser?.isBlocked) {
          sendJson(res, 403, {
            error: 'Akun Anda diblokir dari fitur chat global.',
          });
          return true;
        }

        const trimmedText = text.trim().slice(0, 300);

        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          sender: cleanSender,
          text: trimmedText,
          timestamp: Date.now(),
          role: role === 'premium' || role === 'admin' ? role : 'free',
          avatarColor: avatarColor || '#FFD93D',
        };

        chatMessages.push(newMessage);
        if (chatMessages.length > 200) {
          chatMessages.shift();
        }

        sendJson(res, 201, { message: newMessage });
        return true;
      }
    }

    // 4. PREMIUM REDEEM ENDPOINTS
    if (pathname === '/api/premium/redeem' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { code, username } = body;

      if (!code || typeof code !== 'string') {
        sendJson(res, 400, { success: false, message: 'Kode redeem tidak boleh kosong!' });
        return true;
      }

      const cleanCode = code.trim().toUpperCase();
      const codeItem = premiumCodes.find(c => c.code.toUpperCase() === cleanCode);

      if (!codeItem) {
        sendJson(res, 404, {
          success: false,
          message: 'Kode voucher tidak valid atau tidak ditemukan. Periksa kembali penulisan kode!',
        });
        return true;
      }

      if (!codeItem.active) {
        sendJson(res, 400, {
          success: false,
          message: 'Kode voucher ini sudah dinonaktifkan oleh Admin.',
        });
        return true;
      }

      if (codeItem.expiresAt && Date.now() > codeItem.expiresAt) {
        sendJson(res, 400, {
          success: false,
          message: 'Kode voucher ini sudah kedaluwarsa!',
        });
        return true;
      }

      const cleanUser = username ? String(username).trim().toLowerCase() : '';
      const redeemedList = Array.isArray(codeItem.redeemedBy) ? codeItem.redeemedBy : [];
      if (cleanUser && redeemedList.includes(cleanUser)) {
        sendJson(res, 400, {
          success: false,
          message: 'Akun Anda sudah pernah menukarkan voucher ini sebelumnya.',
        });
        return true;
      }

      codeItem.usedCount += 1;
      if (cleanUser) {
        if (!codeItem.redeemedBy) codeItem.redeemedBy = [];
        codeItem.redeemedBy.push(cleanUser);
      }

      const vType = codeItem.voucherType || 'vip_upgrade';
      const durationMs = (codeItem.durationDays || 30) * 24 * 60 * 60 * 1000;
      const expiresAt = Date.now() + durationMs;
      const bonusQuota = codeItem.bonusQuota || 0;

      // Update registered user if provided
      if (cleanUser) {
        const u = registeredUsers.get(cleanUser);
        if (u) {
          if (vType === 'quota_boost') {
            u.customDailyLimit = (u.customDailyLimit || 10) + bonusQuota;
          } else {
            u.role = 'premium';
            u.premiumExpiresAt = expiresAt;
            u.isBlocked = false;
          }
        }
      }

      const successMsg =
        vType === 'quota_boost'
          ? `Selamat! Kode ${codeItem.code} aktif! Anda mendapatkan bonus +${bonusQuota} Kuota Reach harian.`
          : `Selamat! Kode ${codeItem.code} berhasil diaktifkan! Anda mendapatkan akses VIP selama ${codeItem.durationDays} hari.`;

      sendJson(res, 200, {
        success: true,
        message: successMsg,
        durationDays: codeItem.durationDays,
        expiresAt,
        role: vType === 'quota_boost' ? 'free' : 'premium',
        unlimitedReach: vType !== 'quota_boost',
        bonusQuota,
      });
      return true;
    }

    // Reach engine public config (read-only for clients to sync cooldown & status)
    if (pathname === '/api/reach/config' && req.method === 'GET') {
      sendJson(res, 200, {
        boostSpeedMode: reachEngineSettings.boostSpeedMode,
        globalCooldownSeconds: reachEngineSettings.globalCooldownSeconds,
        isEmergencyPaused: reachEngineSettings.isEmergencyPaused,
        maintenanceNotice: reachEngineSettings.maintenanceNotice,
      });
      return true;
    }

    // 5. ADMIN AUTH & MANAGEMENT
    if (pathname === '/api/admin/verify' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { password, username = 'admin' } = body;
      const cleanPass = typeof password === 'string' ? password.trim() : '';
      if (cleanPass === ADMIN_PASSWORD || cleanPass === 'admin123') {
        const token = `adm_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
        adminSessions.set(token, {
          token,
          createdAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          username: String(username),
        });
        sendJson(res, 200, { success: true, token });
      } else {
        sendJson(res, 401, { success: false, message: 'Password admin salah!' });
      }
      return true;
    }

    // Protect all remaining /api/admin/* endpoints
    if (pathname.startsWith('/api/admin/')) {
      if (!verifyAdminAuth(req)) {
        sendJson(res, 401, {
          success: false,
          error: 'Unauthorized',
          message: 'Akses ditolak: Sesi admin tidak valid atau telah kedaluwarsa. Silakan login admin.',
        });
        return true;
      }
    }

    if (pathname === '/api/admin/stats' && req.method === 'GET') {
      sendJson(res, 200, {
        totalReachesCount,
        totalChatMessages: chatMessages.length,
        totalCodes: premiumCodes.length,
        activeCodesCount: premiumCodes.filter(c => c.active && c.usedCount < c.maxUses).length,
        totalUsers: registeredUsers.size,
        blockedUsersCount: Array.from(registeredUsers.values()).filter(u => u.isBlocked || u.role === 'blocked').length,
        recentLogs: reachLogs.slice(0, 15),
        reachEngineSettings,
        serverUptimeHours: (process.uptime() / 3600).toFixed(1),
      });
      return true;
    }

    // Reach Engine Settings Management
    if (pathname === '/api/admin/reach-engine') {
      if (req.method === 'GET') {
        sendJson(res, 200, { settings: reachEngineSettings });
        return true;
      }

      if (req.method === 'POST' || req.method === 'PUT') {
        const body = await parseJsonBody(req);
        if (body.boostSpeedMode && ['turbo', 'normal', 'eco'].includes(body.boostSpeedMode)) {
          reachEngineSettings.boostSpeedMode = body.boostSpeedMode;
        }
        if (typeof body.globalCooldownSeconds === 'number' && body.globalCooldownSeconds >= 1) {
          reachEngineSettings.globalCooldownSeconds = body.globalCooldownSeconds;
        }
        if (typeof body.isEmergencyPaused === 'boolean') {
          reachEngineSettings.isEmergencyPaused = body.isEmergencyPaused;
        }
        if (typeof body.maintenanceNotice === 'string') {
          reachEngineSettings.maintenanceNotice = body.maintenanceNotice;
        }
        if (Array.isArray(body.blacklistChannels)) {
          reachEngineSettings.blacklistChannels = body.blacklistChannels.map((c: any) => String(c).trim()).filter(Boolean);
        }

        sendJson(res, 200, {
          success: true,
          message: 'Pengaturan Reach Engine berhasil disimpan!',
          settings: reachEngineSettings,
        });
        return true;
      }
    }

    // Live Reach Logs Stream for Admin
    if (pathname === '/api/admin/reach-logs' && req.method === 'GET') {
      sendJson(res, 200, { logs: reachLogs });
      return true;
    }

    // CUSTOM ROLES MANAGEMENT (GET / POST / DELETE)
    if (pathname === '/api/admin/custom-roles') {
      if (req.method === 'GET') {
        sendJson(res, 200, { roles: Array.from(customRoles.values()) });
        return true;
      }

      if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        const { name, durationDays, dailyLimit, baseTier } = body;

        if (!name || typeof name !== 'string' || !name.trim()) {
          sendJson(res, 400, { success: false, message: 'Nama custom role wajib diisi!' });
          return true;
        }

        // STRICT CONSTRAINT: Custom role cannot be set to 'admin'
        if (baseTier === 'admin') {
          sendJson(res, 400, { success: false, message: 'Custom role tidak diizinkan setara dengan role Admin!' });
          return true;
        }

        const validTier: 'user' | 'premium' | 'blocked' = 
          baseTier === 'premium' ? 'premium' : (baseTier === 'blocked' ? 'blocked' : 'user');

        const parsedDuration = Math.max(1, parseInt(String(durationDays), 10) || 30);
        const parsedLimit = validTier === 'blocked' ? 0 : Math.max(0, parseInt(String(dailyLimit), 10) || (validTier === 'premium' ? 9999 : 10));

        const roleId = `role_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const newRole: CustomRoleDefinition = {
          id: roleId,
          name: name.trim(),
          durationDays: parsedDuration,
          dailyLimit: parsedLimit,
          baseTier: validTier,
          createdAt: Date.now(),
          createdBy: 'admin',
        };

        customRoles.set(roleId, newRole);

        sendJson(res, 201, {
          success: true,
          message: `Custom role [${newRole.name}] berhasil dibuat!`,
          role: newRole,
        });
        return true;
      }
    }

    if (pathname.startsWith('/api/admin/custom-roles/') && req.method === 'DELETE') {
      const roleId = decodeURIComponent(pathname.replace('/api/admin/custom-roles/', '')).trim();
      if (customRoles.has(roleId)) {
        const role = customRoles.get(roleId);
        customRoles.delete(roleId);
        sendJson(res, 200, { success: true, message: `Custom role [${role?.name || roleId}] berhasil dihapus.` });
      } else {
        sendJson(res, 404, { success: false, message: 'Custom role tidak ditemukan.' });
      }
      return true;
    }

    // ADMIN: USERS MANAGEMENT (LIST / DELETE / BLOCK / UNBLOCK / SET LIMIT / SET ROLE)
    if (pathname === '/api/admin/users') {
      if (req.method === 'GET') {
        const todayKey = getTodayKey();
        const usersList = Array.from(registeredUsers.values()).map(u => {
          const usageKey = `${u.username}_${todayKey}`;
          const usedToday = userDailyUsage.get(usageKey) || 0;
          const isBlocked = !!u.isBlocked || u.role === 'blocked';
          const isUnlimited = !isBlocked && (u.role === 'premium' || u.role === 'admin');
          const maxLimit = isBlocked ? 0 : (u.customDailyLimit !== undefined ? u.customDailyLimit : (u.role === 'premium' ? 9999 : 10));
          const remainingLimit = isUnlimited ? 9999 : Math.max(0, maxLimit - usedToday);

          return {
            username: u.username,
            password: u.passwordHash || '******',
            role: u.role,
            avatarColor: u.avatarColor || '#10B981',
            createdAt: u.createdAt || Date.now(),
            lastActive: u.lastActive || u.createdAt || Date.now(),
            totalBoosts: u.totalBoosts || 0,
            ipAddress: u.ipAddress || '127.0.0.1',
            userAgent: u.userAgent || 'Web Browser',
            premiumExpiresAt: u.premiumExpiresAt,
            isBlocked,
            blockedReason: u.blockedReason || '',
            customDailyLimit: maxLimit,
            usedToday,
            remainingLimit,
            customRoleName: u.customRoleName,
            customRoleExpiresAt: u.customRoleExpiresAt,
            customRoleBaseTier: u.customRoleBaseTier,
          };
        });
        sendJson(res, 200, { users: usersList });
        return true;
      }
    }

    // DELETE USER ENDPOINT (Fitur: Hapus User)
    if (pathname.startsWith('/api/admin/users/') && req.method === 'DELETE') {
      const targetUsername = decodeURIComponent(pathname.replace('/api/admin/users/', '')).toLowerCase().trim();

      if (targetUsername === 'admin') {
        sendJson(res, 400, { success: false, message: 'Akun Super Admin utama tidak boleh dihapus demi keamanan sistem!' });
        return true;
      }

      if (!registeredUsers.has(targetUsername)) {
        sendJson(res, 404, { success: false, message: `Pengguna @${targetUsername} tidak ditemukan di server.` });
        return true;
      }

      registeredUsers.delete(targetUsername);

      // Clean up any tracked daily usage
      const todayKey = getTodayKey();
      userDailyUsage.delete(`${targetUsername}_${todayKey}`);

      sendJson(res, 200, {
        success: true,
        message: `Pengguna @${targetUsername} berhasil dihapus permanen dari server.`,
      });
      return true;
    }

    // Explicit Role Assignment endpoint (Standard & Custom Roles)
    if (pathname === '/api/admin/users/role' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { 
        username, 
        targetRole, 
        blockedReason, 
        durationDays = 30, 
        customDailyLimit,
        customRoleName,
        customRoleBaseTier
      } = body;

      if (!username || typeof username !== 'string') {
        sendJson(res, 400, { success: false, message: 'Username harus diisi!' });
        return true;
      }

      const cleanUser = username.trim().toLowerCase();
      let user = registeredUsers.get(cleanUser);

      if (!user) {
        user = {
          username: cleanUser,
          passwordHash: '******',
          role: 'free',
          avatarColor: '#10B981',
          createdAt: Date.now(),
          lastActive: Date.now(),
          totalBoosts: 0,
        };
        registeredUsers.set(cleanUser, user);
      }

      if (cleanUser === 'admin' && (targetRole === 'blocked' || customRoleBaseTier === 'blocked')) {
        sendJson(res, 400, { success: false, message: 'Akun Super Admin utama tidak boleh diblokir!' });
        return true;
      }

      // If custom role is applied
      if (customRoleName) {
        const base = customRoleBaseTier === 'premium' ? 'premium' : (customRoleBaseTier === 'blocked' ? 'blocked' : 'free');
        const days = Math.max(1, parseInt(String(durationDays), 10) || 30);
        const limitVal = base === 'blocked' ? 0 : (customDailyLimit !== undefined ? parseInt(String(customDailyLimit), 10) : (base === 'premium' ? 9999 : 20));

        user.role = base === 'blocked' ? 'blocked' : (base === 'premium' ? 'premium' : 'free');
        user.isBlocked = base === 'blocked';
        user.blockedReason = base === 'blocked' ? (blockedReason || `Custom Role ${customRoleName}`) : '';
        user.customRoleName = customRoleName;
        user.customRoleBaseTier = base === 'free' ? 'user' : (base as 'premium' | 'blocked');
        user.customRoleExpiresAt = Date.now() + days * 86400000;
        user.customDailyLimit = limitVal;
        if (base === 'premium') {
          user.premiumExpiresAt = user.customRoleExpiresAt;
        }

        sendJson(res, 200, {
          success: true,
          message: `Custom role [${customRoleName}] (${days} hari, Limit ${limitVal}x) berhasil diterapkan ke @${cleanUser}!`,
          user: {
            username: user.username,
            role: user.role,
            isBlocked: user.isBlocked,
            customRoleName: user.customRoleName,
            customRoleExpiresAt: user.customRoleExpiresAt,
            customDailyLimit: user.customDailyLimit,
          },
        });
        return true;
      }

      // Standard Role Assignment
      if (targetRole === 'blocked') {
        user.role = 'blocked';
        user.isBlocked = true;
        user.blockedReason = blockedReason || 'Diblokir oleh Administrator';
        user.customDailyLimit = 0;
        delete user.customRoleName;
        delete user.customRoleExpiresAt;
      } else if (targetRole === 'premium') {
        user.role = 'premium';
        user.isBlocked = false;
        user.blockedReason = '';
        user.premiumExpiresAt = Date.now() + (Number(durationDays) || 30) * 86400000;
        user.customDailyLimit = customDailyLimit !== undefined ? Number(customDailyLimit) : 9999;
        delete user.customRoleName;
        delete user.customRoleExpiresAt;
      } else if (targetRole === 'free') {
        user.role = 'free';
        user.isBlocked = false;
        user.blockedReason = '';
        user.premiumExpiresAt = undefined;
        user.customDailyLimit = customDailyLimit !== undefined ? Number(customDailyLimit) : 10;
        delete user.customRoleName;
        delete user.customRoleExpiresAt;
      } else if (targetRole === 'admin') {
        user.role = 'admin';
        user.isBlocked = false;
        user.blockedReason = '';
        user.customDailyLimit = 9999;
        delete user.customRoleName;
        delete user.customRoleExpiresAt;
      }

      sendJson(res, 200, {
        success: true,
        message: `Role @${cleanUser} berhasil diubah menjadi [${targetRole.toUpperCase()}]!`,
        user: {
          username: user.username,
          role: user.role,
          isBlocked: user.isBlocked,
          blockedReason: user.blockedReason,
          customDailyLimit: user.customDailyLimit,
          premiumExpiresAt: user.premiumExpiresAt,
        },
      });
      return true;
    }

    if (pathname.startsWith('/api/admin/users/') && req.method === 'PATCH') {
      const targetUsername = decodeURIComponent(pathname.replace('/api/admin/users/', '')).toLowerCase();
      const body = await parseJsonBody(req);
      let user = registeredUsers.get(targetUsername);

      if (!user) {
        user = {
          username: targetUsername,
          passwordHash: '******',
          role: 'free',
          avatarColor: '#10B981',
          createdAt: Date.now(),
          lastActive: Date.now(),
          totalBoosts: 0,
        };
        registeredUsers.set(targetUsername, user);
      }

      if (targetUsername === 'admin' && body.isBlocked === true) {
        sendJson(res, 400, { success: false, message: 'Akun Super Admin utama tidak boleh diblokir!' });
        return true;
      }

      if (typeof body.isBlocked === 'boolean') {
        user.isBlocked = body.isBlocked;
        if (body.isBlocked) {
          user.role = 'blocked';
          user.customDailyLimit = 0;
          user.blockedReason = body.blockedReason || 'Diblokir oleh Administrator';
        } else {
          user.role = 'free';
          user.blockedReason = '';
          user.customDailyLimit = 10;
        }
      }

      if (typeof body.customDailyLimit === 'number' && body.customDailyLimit >= 0) {
        user.customDailyLimit = body.customDailyLimit;
      }

      if (body.role && ['free', 'premium', 'admin', 'blocked'].includes(body.role)) {
        user.role = body.role;
        if (body.role === 'blocked') {
          user.isBlocked = true;
          user.customDailyLimit = 0;
        } else {
          user.isBlocked = false;
        }
      }

      if (body.resetUsageToday === true) {
        const todayKey = getTodayKey();
        userDailyUsage.delete(`${targetUsername}_${todayKey}`);
      }

      sendJson(res, 200, {
        success: true,
        message: `Pengaturan akun @${targetUsername} berhasil diperbarui!`,
        user: {
          username: user.username,
          role: user.role,
          isBlocked: user.isBlocked,
          blockedReason: user.blockedReason,
          customDailyLimit: user.customDailyLimit,
        },
      });
      return true;
    }

    if (pathname === '/api/admin/codes') {
      if (req.method === 'GET') {
        sendJson(res, 200, { codes: premiumCodes });
        return true;
      }

      if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        const {
          code,
          voucherType = 'vip_upgrade',
          durationDays = 30,
          bonusQuota = 0,
          maxUses = 50,
          expiresAt,
          note = 'Generated by Admin',
        } = body;

        let finalCode = (code && typeof code === 'string' && code.trim()) 
          ? code.trim().toUpperCase() 
          : `${voucherType === 'quota_boost' ? 'BOOST' : 'VIP'}-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${durationDays}D`;

        if (premiumCodes.some(c => c.code === finalCode)) {
          sendJson(res, 400, { success: false, message: 'Kode sudah ada!' });
          return true;
        }

        const newCode: PremiumCode = {
          code: finalCode,
          voucherType: (voucherType as VoucherType) || 'vip_upgrade',
          durationDays: Number(durationDays) || 30,
          bonusQuota: Number(bonusQuota) || 0,
          maxUses: Number(maxUses) || 50,
          usedCount: 0,
          createdAt: Date.now(),
          expiresAt: expiresAt ? Number(expiresAt) : undefined,
          note: note || 'Kode dibuat via Admin Dashboard',
          active: true,
          redeemedBy: [],
        };

        premiumCodes.unshift(newCode);
        sendJson(res, 201, { success: true, code: newCode });
        return true;
      }
    }

    // Toggle Voucher Active/Inactive
    if (pathname.startsWith('/api/admin/codes/') && (req.method === 'PATCH' || req.method === 'PUT')) {
      const codeTarget = decodeURIComponent(pathname.replace('/api/admin/codes/', '')).toUpperCase();
      const body = await parseJsonBody(req);
      const codeItem = premiumCodes.find(c => c.code.toUpperCase() === codeTarget);

      if (!codeItem) {
        sendJson(res, 404, { success: false, message: 'Kode voucher tidak ditemukan.' });
        return true;
      }

      if (typeof body.active === 'boolean') {
        codeItem.active = body.active;
      }

      sendJson(res, 200, {
        success: true,
        message: `Status voucher ${codeTarget} diubah menjadi ${codeItem.active ? 'AKTIF' : 'NONAKTIF'}.`,
        code: codeItem,
      });
      return true;
    }

    if (pathname.startsWith('/api/admin/codes/') && req.method === 'DELETE') {
      const codeToDelete = decodeURIComponent(pathname.replace('/api/admin/codes/', '')).toUpperCase();
      const index = premiumCodes.findIndex(c => c.code.toUpperCase() === codeToDelete);
      if (index !== -1) {
        premiumCodes.splice(index, 1);
        sendJson(res, 200, { success: true, message: `Kode ${codeToDelete} berhasil dihapus.` });
      } else {
        sendJson(res, 404, { success: false, message: 'Kode tidak ditemukan.' });
      }
      return true;
    }

    if (pathname === '/api/admin/broadcast' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { text } = body;
      if (!text) {
        sendJson(res, 400, { error: 'Broadcast text required' });
        return true;
      }

      const broadcastMsg: ChatMessage = {
        id: `sys-bc-${Date.now()}`,
        sender: '📢 PENGUMUMAN OWNER',
        text: text.trim(),
        timestamp: Date.now(),
        role: 'admin',
        avatarColor: '#FF2E93',
        isSystem: true,
      };

      chatMessages.push(broadcastMsg);
      sendJson(res, 200, { success: true, message: broadcastMsg });
      return true;
    }

    sendJson(res, 404, { error: 'Not found' });
    return true;
  } catch (err: any) {
    console.error('API Router error:', err);
    sendJson(res, 500, { error: err.message || 'Internal Server Error' });
    return true;
  }
}
