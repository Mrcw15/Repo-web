import { ReachApiResponse, ChatMessage, PremiumCode } from '../types';

export async function requestReachBoost(channelUrl: string, count: number, deviceId: string): Promise<ReachApiResponse> {
  const response = await fetch('/api/reach', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channelUrl,
      count,
      deviceId,
    }),
  });

  const data = await response.json();
  if (!response.ok && !data.success) {
    throw new Error(data.message || 'Gagal memproses reach booster');
  }

  return data;
}

export async function fetchChatMessages(): Promise<ChatMessage[]> {
  const response = await fetch('/api/chat');
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Gagal memuat pesan chat');
  }
  return data.messages || [];
}

export async function sendChatMessage(sender: string, text: string, isPremium: boolean, role: string): Promise<ChatMessage> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender,
      text,
      isPremium,
      role,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Gagal mengirim pesan chat');
  }
  return data.newMessage;
}

export async function redeemPromoCode(code: string, deviceId: string): Promise<{
  success: boolean;
  message: string;
  plan: string;
  name: string;
  durationDays: number;
  expiresAt: number;
}> {
  const response = await fetch('/api/redeem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, deviceId }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Gagal meredeem kode');
  }
  return data;
}

export async function fetchAdminCodes(pass: string): Promise<PremiumCode[]> {
  const response = await fetch(`/api/admin/codes?pass=${encodeURIComponent(pass)}`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Password salah atau gagal memuat kode');
  }
  return data.codes || [];
}

export async function createAdminCode(
  pass: string,
  code: string,
  plan: string,
  durationDays: number,
  maxUses: number,
  name?: string
): Promise<{ success: boolean; message: string; code: PremiumCode }> {
  const response = await fetch('/api/admin/codes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pass,
      code,
      plan,
      durationDays,
      maxUses,
      name,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Gagal membuat kode admin');
  }
  return data;
}

export async function fetchServerStats() {
  try {
    const response = await fetch('/api/stats');
    const data = await response.json();
    return data.stats;
  } catch {
    return {
      serverStatus: 'ONLINE',
      activeUsers: 342,
      totalReachToday: 14890,
      apiLatency: '42ms',
    };
  }
}
