import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";

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
        if (req.url?.startsWith("/api/") && (req.method === "POST" || req.method === "PUT" || req.method === "DELETE")) {
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

      // Analytics API
      server.middlewares.use("/api/analytics", (req, res, next) => {
        const analyticsPath = path.join(dataDir, "analytics.json");
        const urlPath = req.url || "";

        // POST /api/analytics/event - track an event
        if (urlPath === "/event" && req.method === "POST") {
          try {
            let events: any[] = [];
            try { events = JSON.parse(fs.readFileSync(analyticsPath, "utf-8")); } catch {}
            events.push((req as any).body);
            // Keep max 10000 events
            if (events.length > 10000) events = events.slice(-10000);
            fs.writeFileSync(analyticsPath, JSON.stringify(events, null, 2), "utf-8");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        // GET /api/analytics/events?days=7 - get events for last N days
        if (urlPath.startsWith("/events") && req.method === "GET") {
          try {
            let events: any[] = [];
            try { events = JSON.parse(fs.readFileSync(analyticsPath, "utf-8")); } catch {}
            const urlParams = new URL(`http://localhost${req.url}`).searchParams;
            const days = parseInt(urlParams.get("days") || "7", 10);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            const filtered = events.filter((e: any) => new Date(e.timestamp) >= cutoff);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(filtered));
          } catch {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end("[]");
          }
          return;
        }

        // GET /api/analytics/summary - aggregate stats
        if (urlPath === "/summary" && req.method === "GET") {
          try {
            let events: any[] = [];
            try { events = JSON.parse(fs.readFileSync(analyticsPath, "utf-8")); } catch {}
            const now = new Date();
            const todayStr = now.toISOString().split("T")[0];
            const todayEvents = events.filter((e: any) => e.timestamp?.startsWith(todayStr));
            const last7 = events.filter((e: any) => {
              const d = new Date(e.timestamp);
              return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
            });

            // Daily breakdown for chart
            const dailyCounts: Record<string, number> = {};
            for (let i = 6; i >= 0; i--) {
              const d = new Date(now);
              d.setDate(d.getDate() - i);
              dailyCounts[d.toISOString().split("T")[0]] = 0;
            }
            last7.filter((e: any) => e.type === "page_view").forEach((e: any) => {
              const day = e.timestamp?.split("T")[0];
              if (day && dailyCounts[day] !== undefined) dailyCounts[day]++;
            });

            // Top products
            const productViews: Record<string, { name: string; views: number; carts: number }> = {};
            last7.forEach((e: any) => {
              if (e.type === "product_view" && e.data?.product_id) {
                const id = e.data.product_id;
                if (!productViews[id]) productViews[id] = { name: e.data.product_name || id, views: 0, carts: 0 };
                productViews[id].views++;
              }
              if (e.type === "add_to_cart" && e.data?.product_id) {
                const id = e.data.product_id;
                if (!productViews[id]) productViews[id] = { name: e.data.product_name || id, views: 0, carts: 0 };
                productViews[id].carts++;
              }
            });
            const topProducts = Object.entries(productViews)
              .map(([id, data]) => ({ id, ...data }))
              .sort((a, b) => (b.views + b.carts) - (a.views + a.carts))
              .slice(0, 10);

            // Top pages
            const pageCounts: Record<string, number> = {};
            last7.filter((e: any) => e.type === "page_view").forEach((e: any) => {
              const route = e.data?.route || "/";
              pageCounts[route] = (pageCounts[route] || 0) + 1;
            });
            const topPages = Object.entries(pageCounts)
              .map(([route, count]) => ({ route, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10);

            // Funnel
            const uniqueVisitors = new Set(last7.filter((e: any) => e.type === "page_view").map((e: any) => e.timestamp?.split("T")[0])).size || todayEvents.filter((e: any) => e.type === "page_view").length || 0;
            const cartAdds = last7.filter((e: any) => e.type === "add_to_cart").length;
            const quotes = last7.filter((e: any) => e.type === "quote_request").length;

            const summary = {
              today: {
                visitors: todayEvents.filter((e: any) => e.type === "page_view").length,
                pageViews: todayEvents.filter((e: any) => e.type === "page_view").length,
                cartAdds: todayEvents.filter((e: any) => e.type === "add_to_cart").length,
                quotes: todayEvents.filter((e: any) => e.type === "quote_request").length,
              },
              dailyChart: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
              topProducts,
              topPages,
              funnel: { visitors: uniqueVisitors, cartAdds, quotes },
              recentEvents: events.slice(-20).reverse(),
            };
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(summary));
          } catch {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end("{}");
          }
          return;
        }

        // DELETE /api/analytics/reset
        if (urlPath === "/reset" && req.method === "DELETE") {
          try {
            fs.writeFileSync(analyticsPath, "[]", "utf-8");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        next();
      });

      // Backup API - create backup of products.json before changes
      server.middlewares.use("/api/backup", (req, res, next) => {
        if (req.method === "POST") {
          try {
            const productsPath = path.join(dataDir, "products.json");
            const backupPath = path.join(dataDir, "products.backup.json");
            if (fs.existsSync(productsPath)) {
              fs.copyFileSync(productsPath, backupPath);
            }
            // Also backup site-content.json
            const siteContentPath = path.join(dataDir, "site-content.json");
            const siteContentBackup = path.join(dataDir, "site-content.backup.json");
            if (fs.existsSync(siteContentPath)) {
              fs.copyFileSync(siteContentPath, siteContentBackup);
            }
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

      // Backup status - check if backup exists
      server.middlewares.use("/api/backup/status", (req, res, next) => {
        if (req.method === "GET") {
          const backupPath = path.join(dataDir, "products.backup.json");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ hasBackup: fs.existsSync(backupPath) }));
        } else {
          next();
        }
      });

      // Restore API - restore from backup
      server.middlewares.use("/api/restore", (req, res, next) => {
        if (req.method === "POST") {
          try {
            const productsPath = path.join(dataDir, "products.json");
            const backupPath = path.join(dataDir, "products.backup.json");
            if (fs.existsSync(backupPath)) {
              fs.copyFileSync(backupPath, productsPath);
              fs.unlinkSync(backupPath);
            }
            // Also restore site-content.json
            const siteContentPath = path.join(dataDir, "site-content.json");
            const siteContentBackup = path.join(dataDir, "site-content.backup.json");
            if (fs.existsSync(siteContentBackup)) {
              fs.copyFileSync(siteContentBackup, siteContentPath);
              fs.unlinkSync(siteContentBackup);
            }
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

      // GET /api/images - list all images by folder
      server.middlewares.use("/api/images", (req, res, next) => {
        if (req.url === "/upload" && req.method === "POST") return next();
        if (req.url === "/delete" && req.method === "POST") return next();
        if (req.method !== "GET") return next();
        const imagesDir = path.resolve(import.meta.dirname, "client", "public", "images");
        const folders: Record<string, string[]> = {};
        const validExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
        function scan(dir: string, prefix: string) {
          if (!fs.existsSync(dir)) return;
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.isDirectory()) {
              scan(path.join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name);
            } else if (validExts.includes(path.extname(entry.name).toLowerCase())) {
              const folder = prefix || "(racine)";
              if (!folders[folder]) folders[folder] = [];
              folders[folder].push(`/images/${prefix ? prefix + "/" : ""}${entry.name}`);
            }
          }
        }
        try {
          scan(imagesDir, "");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ folders }));
        } catch (e) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(e) }));
        }
      });

      // POST /api/images/upload - upload image as base64
      server.middlewares.use("/api/images/upload", (req, res, next) => {
        if (req.method !== "POST") return next();
        const { folder, filename, data } = (req as any).body || {};
        if (!filename || !data) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "filename and data required" }));
          return;
        }
        const validExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
        const ext = path.extname(filename).toLowerCase();
        if (!validExts.includes(ext)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid file type. Allowed: " + validExts.join(", ") }));
          return;
        }
        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
        const safeFolder = (folder || "").replace(/[^a-zA-Z0-9_-]/g, "_").replace(/^\.+/, "");
        const imagesDir = path.resolve(import.meta.dirname, "client", "public", "images");
        const targetDir = safeFolder ? path.join(imagesDir, safeFolder) : imagesDir;
        try {
          if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
          const buffer = Buffer.from(data, "base64");
          fs.writeFileSync(path.join(targetDir, safeName), buffer);
          const publicPath = `/images/${safeFolder ? safeFolder + "/" : ""}${safeName}`;
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, path: publicPath }));
        } catch (e) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(e) }));
        }
      });

      // POST /api/images/delete - delete an image
      server.middlewares.use("/api/images/delete", (req, res, next) => {
        if (req.method !== "POST") return next();
        const { path: imgPath } = (req as any).body || {};
        if (!imgPath) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "path required" }));
          return;
        }
        const imagesDir = path.resolve(import.meta.dirname, "client", "public", "images");
        const relativePath = imgPath.replace(/^\/images\//, "");
        const fullPath = path.resolve(imagesDir, relativePath);
        // Security: ensure file is inside imagesDir
        if (!fullPath.startsWith(imagesDir)) {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Access denied" }));
          return;
        }
        try {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "File not found" }));
          }
        } catch (e) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(e) }));
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

const plugins = [react(), tailwindcss(), vitePluginManusDebugCollector(), viteApiPlugin()];

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
    outDir: "dist",
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
