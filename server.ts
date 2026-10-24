import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import { executeRadarSearch } from "./src/server/radarEngine";

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

  // Radar Data API powered by Gemini with Google Search Grounding & Quota Fallback
  app.post("/api/radar", async (req, res) => {
    const { days = 30, query } = req.body;
    try {
      const result = await executeRadarSearch(Number(days) || 30, query);
      return res.json(result);
    } catch (err: any) {
      console.error("[Radar API Route Error]:", err);
      return res.status(500).json({ error: "Errore interno durante il recupero dei dati" });
    }
  });

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
        model: "llama-3-8b-8192",
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
