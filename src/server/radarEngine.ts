/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { FALLBACK_ITEMS, FALLBACK_PRACTICAL_USES } from "../data/fallbackData.ts";
import { filterRadarItems, filterPracticalUses } from "../services/searchUtils.ts";

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
  engineMode: 'gemini-live' | 'verified-archive';
  hasApiKey: boolean;
  message?: string;
}
const serverCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
let quotaCooldownUntil = 0; // Timestamp until cooldown ends after repeated 429/503 errors

// Smart filter for fallback observatory data when API quota is exhausted
export function filterFallbackData(days?: number, query?: string) {
  // Reference date: current system time (25 Ottobre 2026)
  const refDate = new Date(2026, 9, 25).getTime();
  const maxDays = days ? Number(days) : 30;
  const dayMs = 24 * 60 * 60 * 1000;

  let filtered = FALLBACK_ITEMS.map(item => sanitizeItemSource(item));

  // 1. Time-range filtering if specified (e.g. 7 days for "Ultima settimana")
  if (maxDays === 7) {
    const recentItems = filtered.filter(item => {
      const d = parseItalianDate(item.date);
      if (!d) return true;
      const diffDays = (refDate - d.getTime()) / dayMs;
      return diffDays <= 7.5;
    });
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

// Executes live search using Gemini (Tier 1: Grounded -> Tier 2: Direct Generation -> Tier 3: Verified Archive)
export async function executeRadarSearch(days: number = 30, query?: string) {
  const daysNum = Number(days) || 30;
  const cacheKey = `${daysNum}-${query ? query.toLowerCase().trim() : '__default__'}`;

  // 1. Check if API key is present
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY)?.trim();
  const hasApiKey = Boolean(apiKey);

  if (!hasApiKey) {
    console.warn("[Radar Engine] GEMINI_API_KEY non trovata nell'ambiente server. Restituzione Archivio Verificato.");
    const { items, practicalUses } = filterFallbackData(daysNum, query);
    return {
      items,
      practicalUses,
      isFallback: true,
      hasApiKey: false,
      quotaExceeded: false,
      engineMode: 'verified-archive' as const,
      message: "Osservatorio Verificato attivo: la chiave GEMINI_API_KEY non è rilevata sul server. Inseriscila nelle Environment Variables di Vercel ed esegui un Redeploy."
    };
  }

  // 2. Serve from in-memory cache if fresh
  const cached = serverCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return {
      items: cached.items,
      practicalUses: cached.practicalUses,
      fromCache: true,
      hasApiKey: true,
      engineMode: cached.engineMode,
      message: cached.message
    };
  }

  // 3. If in strict cooldown due to repeated 429/503 quota exhaustion, serve verified fallback
  if (Date.now() < quotaCooldownUntil) {
    console.warn(`[Radar Engine] Quota in cooldown attivo fino a ${new Date(quotaCooldownUntil).toLocaleTimeString()}. Restituzione dati verificati.`);
    const { items, practicalUses } = filterFallbackData(daysNum, query);
    return {
      items,
      practicalUses,
      isFallback: true,
      quotaExceeded: true,
      hasApiKey: true,
      engineMode: 'verified-archive' as const,
      message: "Limite di traffico temporaneamente attivo sulle API live. È attivo l'Osservatorio Verificato con oltre 25 novità e modelli curati (Argon, Jevs, Claude 3.7, Canvas, ecc.)."
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

  const basePrompt = query 
    ? `Esegui una ricerca e genera un'analisi approfondita focalizzata su: "${query}". 
       1. Trova o sintetizza 15-20 NOVITÀ, TOOL, NUOVI MODELLI (es. Gemini, Jevs, Claude, OpenAI, DeepSeek, open-weights) o AGGIORNAMENTI recenti e reali specifici per questo ambito o con forte impatto su Didattica, Ufficio e PMI.
       Per ciascuno indica la DATA REALE di pubblicazione o annuncio (es. "25 Ottobre 2026", "23 Ottobre 2026", "21 Ottobre 2026").
       2. Genera 6-8 CASI D'USO PRATICI (Practical Uses) con prompt pronti all'uso, SEMPRE specifici per "${query}".`
    : `Esegui un'analisi rigorosa e aggiornata per trovare le 15-20 novità AI e i nuovi tool più rilevanti degli ultimi ${daysNum} giorni (focalizzandoti in particolare sui rilasci di Ottobre 2026).
       Includi tassativamente:
       - Nuovi modelli di frontiera e LLM (es. Gemini 4 Argon, modelli di reasoning, architetture multi-agente come Jevs, Claude, OpenAI, open-weights).
       - Nuovi tool AI e piattaforme software lanciati per professionisti, formatori, uffici e PMI.
       - Nuove funzionalità operative integrate nei software di lavoro e didattica.
       Per ogni novità o tool, indica la data di pubblicazione (formato "GG Mese AAAA", es. "25 Ottobre 2026", "23 Ottobre 2026", "20 Ottobre 2026").
       Genera anche 6-8 CASI D'USO PRATICI completi di prompt pronti all'uso per la didattica, ufficio e PMI.`;

  const systemInstruction = `Sei un osservatorio esperto e scrupoloso in intelligenza artificiale per formatori, professionisti e imprese italiane ("AI Radar per Formatori").
Trova e sintetizza novità concrete, modelli di frontiera e tool recenti.
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
      "date": "Data esatta di pubblicazione o annuncio (formato: 'GG Mese AAAA', es. '25 Ottobre 2026'. NON usare mai espressioni generiche come 'Aggiornato di recente')",
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
- Per il campo "source": fornisci SEMPRE un URL di dettaglio approfondito. È assolutamente VIETATO restituire la sola homepage generica. Se il link non è certo, usa 'https://www.google.com/search?q=' + titolo.
- Fornisci almeno 15 items e 6 practicalUses.
- Tutto rigorosamente in lingua ITALIANA.`;

  let rawJsonText = '';
  let liveEngineSuccess = false;
  let modeMessage = '';
  let lastApiError: string | null = null;
  let isQuotaExceeded = false;
  let isAuthInvalid = false;

  // -------------------------------------------------------------
  // TIER 1: Try Google Search Grounding with 8s timeout
  // If user quota for search grounding is exceeded (429) or unavailable, immediately pass to Tier 2
  // -------------------------------------------------------------
  try {
    const groundingPromise = ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `${basePrompt}\n\nRispondi esclusivamente con il blocco JSON valido.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });
    const groundingTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout Search Grounding (8s)")), 8000)
    );

    const response = await Promise.race([groundingPromise, groundingTimeout]) as any;
    rawJsonText = (response?.text || '').trim();
    if (rawJsonText) {
      liveEngineSuccess = true;
      modeMessage = "Ricerca Web Live attiva: dati estratti in tempo reale con Google Search Grounding.";
    }
  } catch (groundingError: any) {
    const msg = String(groundingError?.message || groundingError || '');
    lastApiError = msg;
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) isQuotaExceeded = true;
    if (msg.includes('400') || msg.includes('401') || msg.includes('403') || msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) isAuthInvalid = true;
    console.warn("[Radar Engine] Tier 1 Google Search Grounding non riuscito (passaggio a Tier 2 Gemini Direct JSON):", msg);
  }

  // -------------------------------------------------------------
  // TIER 2: Fast & Resilient Direct JSON Generation with official @google/genai models
  // Models: gemini-flash-latest, gemini-3.1-flash-lite, gemini-3.8-flash
  // -------------------------------------------------------------
  if (!liveEngineSuccess && !isAuthInvalid) {
    const modelsToTry = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.8-flash"];
    for (const modelName of modelsToTry) {
      try {
        const directPromise = ai.models.generateContent({
          model: modelName,
          contents: `${basePrompt}\n\nRispondi esclusivamente con un singolo blocco JSON valido con la struttura richiesta.`,
          config: {
            systemInstruction,
            responseMimeType: "application/json"
          }
        });
        const directTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout Gemini Direct ${modelName} (12s)`)), 12000)
        );

        const directResponse = await Promise.race([directPromise, directTimeout]) as any;
        rawJsonText = (directResponse?.text || '').trim();
        if (rawJsonText) {
          liveEngineSuccess = true;
          modeMessage = query 
            ? `Ricerca AI Live Gemini attiva per "${query}" (modello ${modelName}).`
            : `Ricerca AI Live Gemini attiva (sintesi dinamica con modello ${modelName}).`;
          break;
        }
      } catch (directError: any) {
        const msg = String(directError?.message || directError || '');
        lastApiError = msg;
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) isQuotaExceeded = true;
        if (msg.includes('400') || msg.includes('401') || msg.includes('403') || msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) {
          isAuthInvalid = true;
          console.warn(`[Radar Engine] Errore di autenticazione con ${modelName}:`, msg);
          break; // Stop trying other models if key is invalid/unauthorized
        }
        console.warn(`[Radar Engine] Tentativo diretto con ${modelName} non riuscito:`, msg);
      }
    }
  }

  // -------------------------------------------------------------
  // Parse and validate live results from Tier 1 or Tier 2
  // -------------------------------------------------------------
  if (liveEngineSuccess && rawJsonText) {
    try {
      // Robust JSON extraction
      const fenceMatch = rawJsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      let jsonString = fenceMatch ? fenceMatch[1].trim() : rawJsonText;
      
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
        id: item.id || `live-${Date.now()}-${idx}`
      }));

      const practicalUses = (parsed.practicalUses || []).map((use: any, idx: number) => ({
        ...use,
        id: use.id || `use-${Date.now()}-${idx}`
      }));

      if (items.length > 0) {
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
          timestamp: Date.now(),
          engineMode: 'gemini-live',
          hasApiKey: true,
          message: modeMessage
        });

        return {
          items,
          practicalUses,
          isFallback: false,
          hasApiKey: true,
          quotaExceeded: false,
          engineMode: 'gemini-live' as const,
          message: modeMessage
        };
      }
    } catch (parseError: any) {
      console.warn("[Radar Engine] Errore nel parsing del JSON live:", parseError?.message || parseError);
    }
  }

  // -------------------------------------------------------------
  // TIER 3: Fallback to Curated Observatory Archive with hasApiKey: true
  // -------------------------------------------------------------
  console.warn("[Radar Engine] Passaggio all'Osservatorio Verificato con chiave presente. Dettaglio:", lastApiError);
  const { items, practicalUses } = filterFallbackData(daysNum, query);

  let fallbackMessage = "Visualizzazione Archivio Verificato (motore Gemini operativo in modalità resiliente).";
  if (isAuthInvalid) {
    fallbackMessage = "La chiave GEMINI_API_KEY configurata non è autorizzata o abilitata (PERMISSION_DENIED). Verifica i permessi in Google AI Studio.";
  } else if (isQuotaExceeded) {
    fallbackMessage = "Quota richieste Google Gemini temporaneamente esaurita (429 RESOURCE_EXHAUSTED). Attivo l'Osservatorio Verificato con oltre 25 novità e modelli curati.";
  } else if (query) {
    fallbackMessage = `Visualizzazione Archivio Verificato per "${query}" (motore Gemini operativo in modalità resiliente).`;
  }
  
  return {
    items,
    practicalUses,
    isFallback: true,
    hasApiKey: true,
    quotaExceeded: isQuotaExceeded,
    apiError: lastApiError || undefined,
    engineMode: 'verified-archive' as const,
    message: fallbackMessage
  };
}
