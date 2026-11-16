import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { createDeps } from './deps';
import { handle } from './handler';
import { memoryUsage } from './usage';

/**
 * Serves the same /api routes as the Netlify function from `npm run dev` and `npm run preview`,
 * so live AI can be tried locally (set ANTHROPIC_API_KEY, or MOCK_AI=1 for the fake model).
 */
export function apiDevPlugin(): Plugin {
  const usage = memoryUsage();

  async function middleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
    if (!req.url?.startsWith('/api/')) return next();

    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const abort = new AbortController();
    res.on('close', () => abort.abort());

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const request = new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, {
      method: req.method,
      headers: { 'content-type': String(req.headers['content-type'] ?? 'application/json') },
      body: hasBody ? Buffer.concat(chunks) : undefined,
      signal: abort.signal,
    });

    try {
      const response = await handle(request, createDeps(process.env, usage, req.socket.remoteAddress ?? 'local'));
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (response.body) {
        const reader = response.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      res.end();
    } catch {
      if (!res.headersSent) res.statusCode = 500;
      res.end();
    }
  }

  return {
    name: 'practice-api-dev',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
