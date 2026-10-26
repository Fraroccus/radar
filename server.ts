import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import { executeRadarSearch } from "./api/radar.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Enable CORS and allow embedding in iframes from other sites
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.removeHeader("X-Frame-Options");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Health Check Endpoint
  app.get("/api/health", (req, res) => {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY)?.trim();
    const hasApiKey = Boolean(apiKey);
    return res.json({
      status: "ok",
      hasApiKey,
      keyConfigured: hasApiKey,
      keyPreview: apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-6)}` : null,
      serverTime: new Date().toISOString()
    });
  });

  // Radar Data API powered by Gemini with Dual-Tier Fallback
  const handleRadar = async (req: express.Request, res: express.Response) => {
    const days = req.body?.days || req.query?.days || 30;
    const query = req.body?.query || req.query?.query;
    try {
      const result = await executeRadarSearch(Number(days) || 30, query ? String(query) : undefined);
      return res.json(result);
    } catch (err: any) {
      console.error("[Radar API Route Error]:", err);
      return res.status(500).json({ error: "Errore interno durante il recupero dei dati" });
    }
  };

  app.post("/api/radar", handleRadar);
  app.get("/api/radar", handleRadar);

  // Groq Assistant API
  app.post("/api/assistant", async (req, res) => {
    const { message, context } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY non configurata." });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Sei un assistente esperto in AI e didattica per l'app 'AI Radar per Formatori'. Aiuta gli utenti a capire come usare i tool AI o crea prompt per loro. Rispondi sempre in ITALIANO. Sii conciso e professionale."
          },
          {
            role: "user",
            content: `Contesto attuale dell'app: ${JSON.stringify(context)}\n\nDomanda dell'utente: ${message}`
          }
        ],
        model: "llama-3.3-70b-versatile",
      });

      res.json({ response: completion.choices[0]?.message?.content || "Nessuna risposta." });
    } catch (error: any) {
      console.warn("Groq Error:", error?.message || error);
      res.status(500).json({ error: "Errore durante la comunicazione con l'assistente." });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
