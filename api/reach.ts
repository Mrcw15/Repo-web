import type { IncomingMessage, ServerResponse } from 'http';

const WA_API_KEY = 'jere_yixlYyX0LUHB'; // Force new API key
const WA_API_URL = process.env.WA_REACH_API_URL || 'https://api.jerexd.my.id/api/whatsapp/reactch';

async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        if (!body.trim()) return resolve({});
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }));
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const { channel, emojis } = body;
    const cleanEmojis = Array.isArray(emojis) ? emojis.slice(0, 4) : [];

    if (!channel || typeof channel !== 'string' || channel.trim().length === 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        message: 'Harap masukkan link atau ID WhatsApp Channel yang valid!',
      }));
      return;
    }

    const cleanChannel = channel.trim();
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

    let formattedUrl = cleanChannel;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://whatsapp.com/channel/${targetId}${targetPostId}`;
    }

    const emojisToReact = cleanEmojis.length > 0 ? cleanEmojis : ['🔥'];
    const reactionCommaString = emojisToReact.join('');

    let apiSuccess = false;
    let apiMessage = '';
    let apiRawData: any = null;

    try {
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
        apiSuccess = false;
        apiRawData = primaryParsed;
        apiMessage = primaryParsed?.error || primaryParsed?.message || primaryParsed?.msg || `Gagal memproses reaksi emoji ke channel ${targetId}.`;
      }
    } catch {
      apiSuccess = false;
      apiMessage = `Gagal terhubung ke server pemroses untuk channel ${targetId}.`;
      apiRawData = { simulated: false, note: 'Error in gateway fetch' };
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: apiSuccess,
      message: apiMessage,
      data: apiRawData,
      channel: cleanChannel,
      emojis: cleanEmojis,
      timestamp: Date.now(),
    }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: err?.message || 'Server error' }));
  }
}
