import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Dev-mode middleware that mimics the Vercel Edge Function at /api/claude.
 * In production, /api/claude is served by Vercel Functions; in dev, vite
 * doesn't run functions so we replicate the proxy here.
 *
 * Both rely on the same env var name: ANTHROPIC_API_KEY (no VITE_ prefix).
 */
function devApiProxy(apiKey: string): Plugin {
  return {
    name: 'dev-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/claude', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'Server not configured: ANTHROPIC_API_KEY missing. Add it to .env',
          }));
          return;
        }

        // Read request body
        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(c));
        await new Promise<void>((resolve) => req.on('end', resolve));
        const bodyStr = Buffer.concat(chunks).toString('utf-8');

        let body: any;
        try {
          body = JSON.parse(bodyStr);
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
          return;
        }

        try {
          const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: body.model,
              max_tokens: body.max_tokens,
              ...(body.temperature !== undefined && { temperature: body.temperature }),
              ...(body.system && { system: body.system }),
              messages: body.messages,
              stream: body.stream ?? false,
            }),
          });

          res.statusCode = anthropicResp.status;

          if (body.stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');

            if (!anthropicResp.body) {
              res.end();
              return;
            }
            const reader = anthropicResp.body.getReader();
            try {
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) res.write(Buffer.from(value));
              }
            } finally {
              try { reader.releaseLock(); } catch { /* ignore */ }
            }
            res.end();
            return;
          }

          const text = await anthropicResp.text();
          res.setHeader('Content-Type', 'application/json');
          res.end(text);
        } catch (err) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'Network error reaching Anthropic',
            detail: (err as Error)?.message,
          }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.ANTHROPIC_API_KEY ?? '';

  return {
    plugins: [react(), devApiProxy(apiKey)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      port: 5173,
      open: true,
    },
  };
});
