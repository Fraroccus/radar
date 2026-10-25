/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { FALLBACK_ITEMS, FALLBACK_PRACTICAL_USES } from "../data/fallbackData";
import { filterRadarItems, filterPracticalUses } from "../services/searchUtils";

// Helper to parse Italian date strings (e.g. "23 Ottobre 2026") into Date objects
export function parseItalianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const months: Record<string, number> = {
    'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3,
    'maggio': 4, 'giugno': 5, 'luglio': 6, 'agosto': 7,
    'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
  };
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const month = months[parts[1].toLowerCase()];
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day);
    }
  } else if (parts.length === 2) {
    const month = months[parts[0].toLowerCase()];
    const year = parseInt(parts[1], 10);
    if (month !== undefined && !isNaN(year)) {
      return new Date(year, month, 15);
    }
  }
  return null;
}

// Clean and sanitize source URLs to prevent generic root landing pages (like github.com or openai.com)
export function sanitizeItemSource(item: any): any {
  let source = (item.source || '').trim();
  const title = item.title || '';
  const llm = item.llm || '';

  if (!source || source === 'N.D.' || source === '#') {
    source = `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + (llm && llm !== 'Altri' ? llm : '') + ' AI news')}`;
  } else {
    try {
      const parsed = new URL(source);
      const path = parsed.pathname.trim();
      const isBareRoot = path === '' || path === '/' || path === '/index.html';

      if (isBareRoot) {
        if (parsed.hostname.includes('github.com')) {
          source = `https://github.com/search?q=${encodeURIComponent(title)}&type=repositories`;
        } else if (parsed.hostname.includes('huggingface.co')) {
          source = `https://huggingface.co/models?search=${encodeURIComponent(title)}`;
        } else if (parsed.hostname.includes('ai.google.dev')) {
          source = `https://ai.google.dev/gemini-api/docs/models/gemini`;
        } else if (parsed.hostname.includes('notebooklm.google.com')) {
          source = `https://blog.google/technology/ai/notebooklm-audio-overviews/`;
        } else if (parsed.hostname.includes('openai.com') || parsed.hostname.includes('chatgpt.com')) {
          source = `https://www.google.com/search?q=${encodeURIComponent('OpenAI ' + title + ' announcement')}`;
        } else if (parsed.hostname.includes('claude.ai') || parsed.hostname.includes('anthropic.com')) {
          source = `https://www.google.com/search?q=${encodeURIComponent('Anthropic Claude ' + title + ' announcement')}`;
        } else if (parsed.hostname.includes('copilot.microsoft.com') || parsed.hostname.includes('microsoft.com')) {
          source = `https://www.google.com/search?q=${encodeURIComponent('Microsoft Copilot ' + title)}`;
        } else {
          source = `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + (llm && llm !== 'Altri' ? llm : '') + ' AI news')}`;
        }
      }
    } catch {
      source = `https://www.google.com/search?q=${encodeURIComponent(title + ' AI')}`;
    }
  }

  return {
    ...item,
    source
  };
}

// In-memory cache and rate limit cooldown for resilience against Gemini quota limits
interface CacheEntry {
  items: any[];
  practicalUses: any[];
  timestamp: number;
}
const serverCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes server cache
let quotaCooldownUntil = 0; // Timestamp until cooldown ends after a 429/503 error

// Smart filter for fallback observatory data when API quota is exhausted
export function filterFallbackData(days?: number, query?: string) {
  // Reference date: current system time (24 Ottobre 2026)
  const refDate = new Date(2026, 9, 24).getTime();
  const maxDays = days ? Number(days) : 30;
  const dayMs = 24 * 60 * 60 * 1000;

  let filtered = FALLBACK_ITEMS.map(item => sanitizeItemSource(item));

  // 1. Time-range filtering if specified (e.g. 7 days for "Ultima settimana")
  if (maxDays === 7) {
    const recentItems = filtered.filter(item => {
      const d = parseItalianDate(item.date);
      if (!d) return true;
      const diffDays = (refDate - d.getTime()) / dayMs;
      return diffDays <= 7.5; // Within the last 7 days
    });
    // Ensure we always provide a healthy selection even if strict filter is small
    filtered = recentItems.length >= 5 ? recentItems : filtered;
  }

  // 2. Query filtering if search input is provided (using semantic synonym matching)
  if (query && query.trim()) {
    const matched = filterRadarItems(filtered, query.trim());
    if (matched.length > 0) {
      filtered = matched;
    }
  }

  // Sort descending by date (newest first)
  filtered.sort((a, b) => {
    const da = parseItalianDate(a.date)?.getTime() || 0;
    const db = parseItalianDate(b.date)?.getTime() || 0;
    return db - da;
  });

  // Filter practical uses with semantic scoring
  let uses = [...FALLBACK_PRACTICAL_USES];
  if (query && query.trim()) {
    const matchedUses = filterPracticalUses(uses, query.trim());
    if (matchedUses.length > 0) {
      uses = matchedUses;
    }
  }

  return {
    items: filtered,
    practicalUses: uses
  };
}

// Executes live search using Gemini with Google Search Grounding with robust quota fallback
export async function executeRadarSearch(days: number = 30, query?: string) {
  const daysNum = Number(days) || 30;
  const cacheKey = `${daysNum}-${query ? query.toLowerCase().trim() : '__default__'}`;

  // 1. Serve from in-memory cache if fresh
  const cached = serverCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return {
      items: cached.items,
      practicalUses: cached.practicalUses,
      fromCache: true
    };
  }

  // 2. If in cooldown due to previous 429/503 quota exhaustion, serve verified fallback immediately
  if (Date.now() < quotaCooldownUntil) {
    console.warn(`[Radar Service] Quota Gemini in cooldown attivo fino a ${new Date(quotaCooldownUntil).toLocaleTimeString()}. Restituzione dati verificati dell'osservatorio.`);
    const { items, practicalUses } = filterFallbackData(daysNum, query);
    return {
      items,
      practicalUses,
      isFallback: true,
      quotaExceeded: true,
      hasApiKey: true,
      engineMode: 'verified-archive',
      message: "Limite di quota o traffico temporaneamente elevato sulle API live. È attivo l'Osservatorio Verificato con oltre 25 novità e modelli di frontiera (Argon, Jevs, Claude 3.7, ecc.)."
    };
  }

  // 3. Check if API key is present
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY)?.trim();
  if (!apiKey) {
    console.warn("GEMINI_API_KEY non trovata nell'ambiente server. Utilizzo dati di fallback.");
    const { items, practicalUses } = filterFallbackData(daysNum, query);
    return {
      items,
      practicalUses,
      isFallback: true,
      hasApiKey: false,
      quotaExceeded: false,
      engineMode: 'verified-archive',
      message: "Osservatorio Verificato attivo: consultazione rapida tra oltre 25 novità e modelli curati (chiave API Gemini non rilevata sul server di produzione. Esegui il Redeploy su Vercel se l'hai appena aggiunta)."
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  try {
    const basePrompt = query 
      ? `Esegui una ricerca Google web approfondita in tempo reale focalizzata su: "${query}". 
         1. Trova 18-20 NOVITÀ, TOOL, NUOVI MODELLI (es. Gemini 4 Argon, architetture agentiche Jevs, Claude, OpenAI, DeepSeek, open-weights) o AGGIORNAMENTI recenti e reali specifici per questo ambito o con forte impatto su Didattica, Ufficio e PMI.
         Per ciascuno estrai la DATA REALE di pubblicazione o annuncio (es. "24 Ottobre 2026", "22 Ottobre 2026", "18 Ottobre 2026").
         2. Genera 8 CASI D'USO PRATICI (Practical Uses) con prompt pronti all'uso, SEMPRE specifici per "${query}".`
      : `Esegui una ricerca Google web in tempo reale rigorosa, estesa e aggiornata per trovare le 18-20 novità AI e i nuovi tool più rilevanti degli ultimi ${daysNum} giorni (focalizzandoti in particolare sui rilasci di Ottobre 2026).
         Includi tassativamente:
         - Nuovi modelli di frontiera e LLM (es. Gemini 4 Argon, modelli di reasoning, architetture multi-agente come Jevs, Claude, OpenAI, open-weights).
         - Nuovi tool AI e piattaforme software lanciati per professionisti, formatori, uffici e PMI.
         - Nuove funzionalità operative integrate nei software di lavoro e didattica.
         Per ogni novità o tool, estrai dalla fonte web la DATA ESATTA di annuncio o pubblicazione (formato "GG Mese AAAA", es. "24 Ottobre 2026", "21 Ottobre 2026", "17 Ottobre 2026").`;

    const systemInstruction = `Sei un osservatorio esperto e scrupoloso in intelligenza artificiale per formatori, professionisti e imprese italiane ("AI Radar per Formatori").
Trova novità concrete, modelli di frontiera e tool recenti effettuando ricerche sul web in tempo reale tramite Google Search.
Restituisci ESCLUSIVAMENTE un blocco JSON valido (senza testo descrittivo aggiuntivo, senza commenti, senza formule di cortesia).

Struttura JSON richiesta:
{
  "items": [
    {
      "title": "Nome del tool o titolo novità (es. 'Gemini 4 Argon con Hybrid Reasoning', 'Jevs Multi-Agent Orchestrator')",
      "scope": "Didattica" | "Ufficio" | "PMI",
      "type": "Nuovo tool" | "Nuova funzione" | "Esercizio pratico" | "Utilizzo LLM",
      "description": "Descrizione accurata in italiano di 2-4 frasi",
      "price": "Gratuito" | "Freemium" | "A pagamento" | "N.D.",
      "exercise": "Esercizio pratico consigliato per formatori o corsisti",
      "source": "URL specifico dell'articolo, documentazione o repo GitHub (es. 'https://github.com/owner/repo'). NON inserire MAI la sola home page generica come 'https://github.com' o 'https://openai.com'. Se l'URL specifico non è certo, usa 'https://www.google.com/search?q=' seguito dal titolo del tool.",
      "date": "Data esatta di pubblicazione o annuncio (formato: 'GG Mese AAAA', es. '23 Ottobre 2026'. NON usare mai espressioni generiche come 'Aggiornato di recente')",
      "llm": "ChatGPT" | "Gemini" | "Claude" | "Copilot" | "Altri"
    }
  ],
  "practicalUses": [
    {
      "llm": "ChatGPT" | "Gemini" | "Claude" | "Copilot" | "Altri",
      "scope": "Didattica" | "Ufficio" | "PMI",
      "useCase": "Titolo caso d'uso applicabile",
      "prompt": "Prompt completo ed esaustivo pronto all'uso",
      "difficulty": "Facile" | "Medio" | "Avanzato"
    }
  ]
}

Regole fondamentali:
- Includi sia grandi modelli di fondazione e architetture agentiche (es. Argon, Jevs, Claude, OpenAI) sia tool applicativi per ufficio e didattica.
- Per ogni elemento nel campo "date": estrai la data effettiva (giorno, mese per esteso in italiano, anno). È assolutamente VIETATO scrivere "Aggiornato di recente" o simili.
- Per il campo "source": fornisci SEMPRE un URL di dettaglio approfondito (pagina di documentazione, repository GitHub con percorso 'owner/repo', o articolo di lancio ufficiale). È assolutamente VIETATO restituire la sola homepage generica (es. vietato 'https://github.com', 'https://huggingface.co', 'https://openai.com'). Se il link esatto al comunicato non è certo, usa 'https://www.google.com/search?q=' + titolo.
- Fornisci almeno 15-20 items e 6-8 practicalUses.
- Distribuisci adeguatamente le tipologie ("Nuovo tool", "Nuova funzione", "Esercizio pratico", "Utilizzo LLM").
- Nessun link inventato: usa i domini o articoli ufficiali reali o 'N.D.'.
- Tutto rigorosamente in lingua ITALIANA.`;

    // Note: In Gemini API, tools like googleSearch cannot be combined with responseMimeType: "application/json"
    // (doing so produces '400 Tool use with a response mime type application/json is unsupported').
    // We enforce JSON through systemInstruction and clean parse the response.
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `${basePrompt}\n\nRispondi esclusivamente con il blocco JSON valido.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });

    let rawText = response.text || "";
    rawText = rawText.trim();
    
    // Robust JSON extraction from markdown code fences or raw text
    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let jsonString = fenceMatch ? fenceMatch[1].trim() : rawText;
    
    if (!jsonString.startsWith('{')) {
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      }
    }

    const parsed = JSON.parse(jsonString);

    const items = (parsed.items || []).map((item: any, idx: number) => sanitizeItemSource({
      ...item,
      id: item.id || `item-${Date.now()}-${idx}`
    }));

    const practicalUses = (parsed.practicalUses || []).map((use: any, idx: number) => ({
      ...use,
      id: use.id || `use-${Date.now()}-${idx}`
    }));

    if (items.length === 0) {
      const { items: fbItems, practicalUses: fbUses } = filterFallbackData(daysNum, query);
      return {
        items: fbItems,
        practicalUses: fbUses,
        isFallback: true
      };
    }

    // Sort items descending by parsed date
    items.sort((a: any, b: any) => {
      const da = parseItalianDate(a.date)?.getTime() || 0;
      const db = parseItalianDate(b.date)?.getTime() || 0;
      return db - da;
    });

    // Cache fresh successful result
    serverCache.set(cacheKey, {
      items,
      practicalUses,
      timestamp: Date.now()
    });

    return { 
      items, 
      practicalUses,
      isFallback: false,
      hasApiKey: true,
      quotaExceeded: false,
      engineMode: 'gemini-live' as const
    };
  } catch (error: any) {
    const errStr = (error?.message || String(error) || "").toLowerCase();
    const status = error?.status;
    const code = error?.code;
    const isQuotaOrDemandError = 
      status === "RESOURCE_EXHAUSTED" || 
      code === 429 || 
      status === 429 ||
      status === 503 ||
      code === 503 ||
      status === "UNAVAILABLE" ||
      errStr.includes("429") || 
      errStr.includes("503") ||
      errStr.includes("quota") || 
      errStr.includes("high demand") ||
      errStr.includes("unavailable") ||
      errStr.includes("resource_exhausted") ||
      errStr.includes("exceeded your current quota");

    if (isQuotaOrDemandError) {
      // Set cooldown for 60 seconds
      quotaCooldownUntil = Date.now() + 60 * 1000;
      console.warn("[Radar Service] Quota Gemini API o traffico elevato (429/503). Attivata modalità archivio verificato.");
    } else {
      console.warn("[Radar Service] Ricerca in tempo reale non completata, attivo archivio verificato:", error?.message || error);
    }

    // Serve curated fallback data matching the timeframe and search query
    const { items, practicalUses } = filterFallbackData(daysNum, query);
    return {
      items,
      practicalUses,
      isFallback: true,
      hasApiKey: Boolean(apiKey),
      quotaExceeded: isQuotaOrDemandError,
      engineMode: 'verified-archive' as const,
      message: isQuotaOrDemandError
        ? "Limite di quota o traffico elevato sulle API Gemini live. Vengono mostrati i dati verificati dell'osservatorio (con oltre 25 novità e modelli di frontiera tra cui Argon, Jevs e Claude 3.7)."
        : "Ricerca web live momentaneamente non disponibile. Vengono visualizzati i dati verificati dell'osservatorio."
    };
  }
}
