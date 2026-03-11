import type { Plugin, ViteDevServer } from "vite";
import fs from "node:fs";
import path from "node:path";

export function viteApiPlugin(): Plugin {
  return {
    name: "api-routes",
    configureServer(server: ViteDevServer) {
      // Parse JSON body
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try { (req as any).body = JSON.parse(body); } catch { (req as any).body = {}; }
            next();
          });
        } else {
          next();
        }
      });

      // GET /api/products
      server.middlewares.use('/api/products', (req, res, next) => {
        if (req.method !== 'GET') return next();
        const filePath = path.resolve(__dirname, 'client/src/data/products.json');
        try {
          const data = fs.readFileSync(filePath, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        } catch {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('[]');
        }
      });

      // POST /api/products
      server.middlewares.use('/api/products', (req, res, next) => {
        if (req.method !== 'POST') return next();
        const filePath = path.resolve(__dirname, 'client/src/data/products.json');
        try {
          fs.writeFileSync(filePath, JSON.stringify((req as any).body, null, 2), 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: String(e) }));
        }
      });

      // GET /api/settings
      server.middlewares.use('/api/settings', (req, res, next) => {
        if (req.method !== 'GET') return next();
        const filePath = path.resolve(__dirname, 'client/src/data/settings.json');
        try {
          const data = fs.readFileSync(filePath, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        } catch {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{}');
        }
      });

      // POST /api/settings
      server.middlewares.use('/api/settings', (req, res, next) => {
        if (req.method !== 'POST') return next();
        const filePath = path.resolve(__dirname, 'client/src/data/settings.json');
        try {
          fs.writeFileSync(filePath, JSON.stringify((req as any).body, null, 2), 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: String(e) }));
        }
      });
    },
  };
}
