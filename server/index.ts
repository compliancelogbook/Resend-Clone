import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { handleContact } from "./contact";
import { handleConfirm, handleSubscribe } from "./subscribe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.set("trust proxy", true);
  app.post("/api/subscribe", express.json({ limit: "10kb" }), async (req, res) => {
    const result = await handleSubscribe(req.body, req.ip ?? "unknown", process.env);
    res.status(result.status).json(result.json);
  });
  app.get("/api/subscribe/confirm", async (req, res) => {
    res.redirect(303, await handleConfirm(typeof req.query.token === "string" ? req.query.token : null, process.env));
  });
  app.post("/api/contact", express.json({ limit: "20kb" }), async (req, res) => {
    const result = await handleContact(req.body, req.ip ?? "unknown", process.env);
    res.status(result.status).json(result.json);
  });

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
