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
  engineMode?: 'gemini-live' | 'verified-archive';
  message?: string;
  fromCache?: boolean;
}

export async function fetchRadarData(days: number = 30, query?: string): Promise<RadarDataResponse> {
  // Support custom backend URL (e.g. Render, Railway, Vercel) when frontend is hosted separately on GitHub Pages
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const url = `${apiBase}/api/radar`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ days, query })
    });

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
  } catch (error) {
    console.warn("Avviso nel recupero dati radar dal server:", error);

    // Resilient standalone fallback: if backend is unreachable or in static hosting,
    // supply curated observatory data directly in the browser with smart semantic matching!
    let filteredItems = [...FALLBACK_ITEMS];
    let filteredUses = [...FALLBACK_PRACTICAL_USES];

    if (query && query.trim()) {
      filteredItems = filterRadarItems(filteredItems, query.trim());
      filteredUses = filterPracticalUses(filteredUses, query.trim());
    }

    return {
      items: filteredItems,
      practicalUses: filteredUses,
      isFallback: true,
      hasApiKey: false,
      engineMode: 'verified-archive',
      message: query && filteredItems.length === 0
        ? `Nessuna corrispondenza nell'Archivio Verificato per "${query}". Prova con termini affini (es. didattica, video, calcolo, prompt) o chiedi all'assistente AI.`
        : "Modalità Standalone: Visualizzazione dell'Archivio Verificato dell'Osservatorio (oltre 25 tool e modelli di frontiera catalogati)."
    };
  }
}
