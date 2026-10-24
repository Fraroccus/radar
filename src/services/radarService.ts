/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RadarItem, PracticalUse } from "../types";
import { FALLBACK_ITEMS, FALLBACK_PRACTICAL_USES } from "../data/fallbackData";

export interface RadarDataResponse {
  items: RadarItem[];
  practicalUses: PracticalUse[];
  isFallback?: boolean;
  quotaExceeded?: boolean;
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
      message: data.message || data.note,
      fromCache: data.fromCache
    };
  } catch (error) {
    console.warn("Avviso nel recupero dati radar dal server:", error);

    // Resilient standalone fallback: if backend is unreachable (e.g. purely static GitHub Pages hosting),
    // supply curated observatory data directly in the browser so the app never shows a broken screen!
    let filteredItems = [...FALLBACK_ITEMS];
    let filteredUses = [...FALLBACK_PRACTICAL_USES];

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      const words = q.split(/\s+/).filter(w => w.length > 2);
      filteredItems = filteredItems.filter(item => {
        const text = `${item.title} ${item.description} ${item.scope} ${item.type} ${item.exercise} ${item.llm}`.toLowerCase();
        return text.includes(q) || words.some(w => text.includes(w));
      });
      filteredUses = filteredUses.filter(use => {
        const text = `${use.useCase} ${use.prompt} ${use.llm} ${use.scope}`.toLowerCase();
        return text.includes(q) || words.some(w => text.includes(w));
      });
    }

    return {
      items: filteredItems,
      practicalUses: filteredUses,
      isFallback: true,
      message: "Modalità Standalone: Visualizzazione dell'Archivio Verificato dell'Osservatorio (oltre 25 tool e modelli di frontiera). Il backend per le ricerche web in tempo reale non è raggiungibile o il sito è ospitato in modalità statica."
    };
  }
}
