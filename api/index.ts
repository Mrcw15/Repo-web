import type { IncomingMessage, ServerResponse } from 'http';
import { handleApiRequest } from '../server/api';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Set CORS headers for Vercel serverless execution
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Normalize rewritten url on Vercel
  const matchedPath = (req.headers['x-matched-path'] || req.headers['x-invoke-path']) as string | undefined;
  if (matchedPath && matchedPath.startsWith('/api/') && (!req.url || req.url === '/api/index' || req.url === '/api')) {
    req.url = matchedPath;
  }

  try {
    const handled = await handleApiRequest(req, res);
    if (!handled && !res.writableEnded) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'API endpoint not found', url: req.url }));
    }
  } catch (err: any) {
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err?.message || 'Serverless Execution Error' }));
    }
  }
}
