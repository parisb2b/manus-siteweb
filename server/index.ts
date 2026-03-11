import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // JSON body parser
  app.use(express.json());

  // Data file paths
  const productsPath = path.resolve(__dirname, "..", "client", "src", "data", "products.json");
  const settingsPath = path.resolve(__dirname, "..", "client", "src", "data", "settings.json");

  // --- API Routes ---

  // GET /api/products
  app.get("/api/products", (_req, res) => {
    try {
      const data = fs.readFileSync(productsPath, "utf-8");
      res.json(JSON.parse(data));
    } catch {
      res.json([]);
    }
  });

  // POST /api/products
  app.post("/api/products", (req, res) => {
    try {
      fs.writeFileSync(productsPath, JSON.stringify(req.body, null, 2), "utf-8");
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: String(e) });
    }
  });

  // GET /api/settings
  app.get("/api/settings", (_req, res) => {
    try {
      const data = fs.readFileSync(settingsPath, "utf-8");
      res.json(JSON.parse(data));
    } catch {
      // Return default settings if file doesn't exist
      const defaults = {
        whatsapp: "33663284908",
        siteName: "Import 97",
        primaryColor: "#4A90D9",
        logoUrl: "/images/logo_import97_large.png",
        footerText: "Import 97 simplifie l'importation de produits de qualité depuis la Chine vers les Antilles.",
        shippingPrices: {
          martinique: { "20ft": 5500, "40ft": 9500 },
          guadeloupe: { "20ft": 5000, "40ft": 8500 },
          guyane: { "20ft": null, "40ft": null },
          reunion: { "20ft": null, "40ft": null },
          mayotte: { "20ft": null, "40ft": null },
        },
        pricePerM3: 250,
        housePricing: {
          standard: { "20ft": 5600, "30ft": 7400, "40ft": 9200 },
          premium: { "20ft": 9920, "30ft": 10700, "40ft": 13300 },
        },
      };
      // Create the file with defaults
      try {
        fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
        fs.writeFileSync(settingsPath, JSON.stringify(defaults, null, 2), "utf-8");
      } catch {}
      res.json(defaults);
    }
  });

  // POST /api/settings
  app.post("/api/settings", (req, res) => {
    try {
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      fs.writeFileSync(settingsPath, JSON.stringify(req.body, null, 2), "utf-8");
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: String(e) });
    }
  });

  // --- Static file serving ---
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
