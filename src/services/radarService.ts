/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RadarItem, PracticalUse } from "../types";
import { FALLBACK_ITEMS, FALLBACK_PRACTICAL_USES } from "../data/fallbackData";
import { filterRadarItems, filterPracticalUses } from "./searchUtils";

export interface RadarDataResponse {
  items: RadarItem[];
  practicalUses: PracticalUse[];
  isFallback?: boolean;
  quotaExceeded?: boolean;
  hasApiKey?: boolean;
  keyPreview?: string | null;
  engineMode?: 'gemini-live' | 'verified-archive';
  message?: string;
  fromCache?: boolean;
}

export interface ServerHealthResponse {
  status: string;
  hasApiKey: boolean;
  keyConfigured?: boolean;
  keyPreview?: string | null;
  serverTime?: string;
  error?: string;
}

export async function checkServerHealth(): Promise<ServerHealthResponse> {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  try {
    const res = await fetch(`${apiBase}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Try fallback on /api/radar?health=1
  }

  try {
    const res2 = await fetch(`${apiBase}/api/radar?health=1`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (res2.ok) {
      return await res2.json();
    }
  } catch {}

  return {
    status: 'offline',
    hasApiKey: false,
    keyConfigured: false,
    error: 'Server non raggiungibile'
  };
}

export async function fetchRadarData(days: number = 30, query?: string): Promise<RadarDataResponse> {
  // Support custom backend URL (e.g. Render, Railway, Vercel) when frontend is hosted separately on GitHub Pages
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const url = `${apiBase}/api/radar`;

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days, query })
      });
    } catch (postErr) {
      // If POST was blocked (e.g. CORS preflight or network glitch), retry with GET
      const getUrl = `${url}?days=${days}${query ? `&query=${encodeURIComponent(query)}` : ''}`;
      response = await fetch(getUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
    }

    // If POST gave 405 Method Not Allowed or 500, attempt GET
    if (!response.ok && (response.status === 405 || response.status === 500)) {
      try {
        const getUrl = `${url}?days=${days}${query ? `&query=${encodeURIComponent(query)}` : ''}`;
        const getRes = await fetch(getUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (getRes.ok) {
          response = getRes;
        }
      } catch {
        // Keep initial response error
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Errore del server: ${response.status}`);
    }

    const data = await response.json();
    return {
      items: data.items || [],
      practicalUses: data.practicalUses || [],
      isFallback: data.isFallback,
      quotaExceeded: data.quotaExceeded,
      hasApiKey: data.hasApiKey,
      engineMode: data.engineMode || (data.isFallback ? 'verified-archive' : 'gemini-live'),
      message: data.message || data.note,
      fromCache: data.fromCache
    };
  } catch (error: any) {
    console.warn("Avviso nel recupero dati radar dal server:", error);

    // Resilient standalone fallback: if backend is unreachable or in static hosting,
    // supply curated observatory data directly in the browser with smart semantic matching!
    let filteredItems = [...FALLBACK_ITEMS];
    let filteredUses = [...FALLBACK_PRACTICAL_USES];

    if (query && query.trim()) {
      filteredItems = filterRadarItems(filteredItems, query.trim());
      filteredUses = filterPracticalUses(filteredUses, query.trim());
    }

    const errDetail = error?.message ? ` (${error.message})` : '';

    return {
      items: filteredItems,
      practicalUses: filteredUses,
      isFallback: true,
      hasApiKey: false,
      engineMode: 'verified-archive',
      message: query && filteredItems.length === 0
        ? `Nessuna corrispondenza nell'Archivio Verificato per "${query}". Prova con termini affini (es. didattica, video, calcolo, prompt) o chiedi all'assistente AI.`
        : `Visualizzazione Archivio Verificato dell'Osservatorio (oltre 25 tool e modelli di frontiera catalogati)${errDetail}.`
    };
  }
}
