import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { handleApiRequest } from './server/api.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. API routes FIRST
  app.use(async (req, res, next) => {
    if (req.url && req.url.startsWith('/api/')) {
      try {
        const handled = await handleApiRequest(req, res);
        if (handled) return;
      } catch (err) {
        console.error('API Error in Express:', err);
      }
    }
    next();
  });

  // 2. Vite middleware for development vs static dist for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WA Reach Tools server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
