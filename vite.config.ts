import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: any) => {
          // Write logs directly to files
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

// =============================================================================
// API Routes Plugin - Enables /api/products and /api/settings for admin back-office
// =============================================================================
function viteApiPlugin(): Plugin {
  const dataDir = path.resolve(import.meta.dirname, "client", "src", "data");
  return {
    name: "api-routes",
    configureServer(server: ViteDevServer) {
      // JSON body parser for /api/ POST
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/api/") && (req.method === "POST" || req.method === "PUT")) {
          let body = "";
          req.on("data", (chunk) => { body += chunk.toString(); });
          req.on("end", () => {
            try { (req as any).body = JSON.parse(body); } catch { (req as any).body = {}; }
            next();
          });
        } else {
          next();
        }
      });

      server.middlewares.use("/api/products", (req, res, next) => {
        const filePath = path.join(dataDir, "products.json");
        const urlPath = req.url || "";
        const idMatch = urlPath.match(/^\/([^/?]+)/);
        const productId = idMatch ? idMatch[1] : null;

        if (productId) {
          // Individual product: GET /api/products/:id, PUT /api/products/:id
          if (req.method === "GET") {
            try {
              const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
              const product = data.find((p: any) => p.id === productId);
              if (product) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(product));
              } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Not found" }));
              }
            } catch {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Not found" }));
            }
          } else if (req.method === "PUT") {
            try {
              const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
              const index = data.findIndex((p: any) => p.id === productId);
              if (index >= 0) {
                data[index] = (req as any).body;
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true }));
              } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Not found" }));
              }
            } catch (e) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: String(e) }));
            }
          } else {
            next();
          }
        } else {
          // Collection: GET /api/products, POST /api/products
          if (req.method === "GET") {
            try {
              const data = fs.readFileSync(filePath, "utf-8");
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(data);
            } catch {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end("[]");
            }
          } else if (req.method === "POST") {
            try {
              if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
              fs.writeFileSync(filePath, JSON.stringify((req as any).body, null, 2), "utf-8");
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: String(e) }));
            }
          } else {
            next();
          }
        }
      });

      server.middlewares.use("/api/settings", (req, res, next) => {
        const filePath = path.join(dataDir, "settings.json");
        if (req.method === "GET") {
          try {
            const data = fs.readFileSync(filePath, "utf-8");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(data);
          } catch {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end("{}");
          }
        } else if (req.method === "POST") {
          try {
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify((req as any).body, null, 2), "utf-8");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        } else {
          next();
        }
      });

      // Site content API
      server.middlewares.use("/api/site-content", (req, res, next) => {
        const filePath = path.join(dataDir, "site-content.json");
        if (req.method === "GET") {
          try {
            const data = fs.readFileSync(filePath, "utf-8");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(data);
          } catch {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end("{}");
          }
        } else if (req.method === "POST") {
          try {
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify((req as any).body, null, 2), "utf-8");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        } else {
          next();
        }
      });

      // Publish API - git add, commit, push
      server.middlewares.use("/api/publish", (req, res, next) => {
        if (req.method === "POST") {
          try {
            const projectRoot = path.resolve(import.meta.dirname);
            const now = new Date();
            const dateStr = now.toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
            const commitMsg = `Mise à jour depuis le back-office [${dateStr}]`;
            execSync("git add -A", { cwd: projectRoot, stdio: "pipe" });
            execSync(`git commit -m "${commitMsg}"`, { cwd: projectRoot, stdio: "pipe" });
            execSync("git push origin main", { cwd: projectRoot, stdio: "pipe" });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, message: "Site mis à jour avec succès" }));
          } catch (e: any) {
            const stderr = e.stderr ? e.stderr.toString() : String(e);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: stderr }));
          }
        } else {
          next();
        }
      });

      // Publish status - check for uncommitted changes
      server.middlewares.use("/api/publish-status", (req, res, next) => {
        if (req.method === "GET") {
          try {
            const projectRoot = path.resolve(import.meta.dirname);
            const status = execSync("git status --porcelain", { cwd: projectRoot, stdio: "pipe" }).toString().trim();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ hasChanges: status.length > 0, details: status }));
          } catch {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ hasChanges: false }));
          }
        } else {
          next();
        }
      });
    },
  };
}

const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector(), viteApiPlugin()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
