/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RadarItem, PracticalUse } from '../types.ts';

/**
 * Normalizes string: lowercase, trims, removes Italian diacritics / accents
 * e.g., "attività" -> "attivita", "perché" -> "perche"
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Rich semantic & thematic synonym dictionary for trainer/educator AI topics
 */
export const TOPIC_SYNONYMS: Record<string, string[]> = {
  matematica: ['calcolo', 'calcolatore', 'probabilita', 'python', 'dati', 'grafici', 'break-even', 'bilancio', 'numeri', 'formule', 'statistica', 'excel', 'simulatore'],
  math: ['calcolo', 'calcolatore', 'probabilita', 'python', 'dati', 'grafici', 'numeri'],
  copywriting: ['testi', 'stesura', 'canvas', 'bozze', 'scrittura', 'articoli', 'verbale', 'verbali', 'prompt', 'chatgpt', 'claude', 'dispensa'],
  scrittura: ['copywriting', 'testi', 'stesura', 'canvas', 'bozze', 'verbali', 'articoli', 'claude', 'chatgpt'],
  marketing: ['canva', 'promo', 'locandina', 'grafica', 'brand', 'comunicazione', 'vendite', 'clienti', 'social', 'make', 'post', 'commerciale'],
  social: ['canva', 'marketing', 'post', 'reel', 'grafica', 'brand', 'comunicazione'],
  video: ['pika', 'kling', 'videocorsi', 'videolezioni', 'clip', 'animazione', 'elevenlabs', 'doppiaggio', 'simulazioni'],
  audio: ['notebooklm', 'elevenlabs', 'voce', 'doppiaggio', 'audio overview', 'podcasting', 'microfono', 'riverberi'],
  voce: ['elevenlabs', 'notebooklm', 'doppiaggio', 'audio overview', 'parlato'],
  scuola: ['didattica', 'docente', 'docenti', 'studenti', 'corsisti', 'lezione', 'lezioni', 'insegnanti', 'curipod', 'notebooklm', 'valutazione', 'rubrica', 'classe'],
  docente: ['didattica', 'scuola', 'insegnanti', 'formatore', 'lezioni', 'corsisti', 'studenti', 'rubrica'],
  docenti: ['didattica', 'scuola', 'insegnanti', 'formatore', 'lezioni', 'corsisti', 'studenti', 'rubrica'],
  insegnanti: ['didattica', 'scuola', 'docente', 'formatore', 'lezioni', 'studenti'],
  didattica: ['scuola', 'docente', 'formatore', 'formatori', 'aula', 'e-learning', 'corsisti', 'dispensa', 'competenze', 'notebooklm', 'curipod', 'rubrica'],
  formazione: ['didattica', 'formatore', 'formatori', 'aula', 'e-learning', 'corsisti', 'dispensa', 'competenze', 'docente'],
  ufficio: ['segreteria', 'verbali', 'riunione', 'excel', 'pdf', 'manuali', 'scribe', 'cursor', 'make', 'automazione', 'amministrazione', 'fatture'],
  pmi: ['aziende', 'impresa', 'imprese', 'bilancio', 'costi', 'commerciale', 'bandi', 'gestionale', 'fatture', 'business', 'piccole imprese'],
  azienda: ['pmi', 'imprese', 'bilancio', 'costi', 'commerciale', 'gestionale', 'ufficio'],
  agenti: ['agent', 'orchestrator', 'jevs', 'windsurf', 'multi-agente', 'autonomi', 'automazione'],
  agente: ['agent', 'orchestrator', 'jevs', 'windsurf', 'multi-agente', 'autonomi', 'automazione'],
  automazione: ['agente', 'agenti', 'make', 'scribe', 'cursor', 'workflow', 'script', 'procedure'],
  gratis: ['gratuito', 'free', 'freemium', 'open-source', 'open-weights', 'zero costi'],
  free: ['gratuito', 'freemium', 'open-source', 'open-weights', 'gratis'],
  presentazioni: ['canva', 'napkin', 'grafici', 'schemi', 'mappe', 'curipod', 'slide', 'locandina'],
  slide: ['canva', 'napkin', 'grafici', 'schemi', 'curipod', 'presentazioni'],
  grafica: ['canva', 'napkin', 'diagrammi', 'vettoriali', 'visuale', 'immagini', 'schemi'],
  schemi: ['napkin', 'diagrammi', 'mappe mentali', 'grafica', 'flusso'],
  programmazione: ['python', 'script', 'cursor', 'windsurf', 'v0', 'lovable', 'react', 'github', 'coding'],
  coding: ['python', 'script', 'cursor', 'windsurf', 'v0', 'lovable', 'react', 'github', 'programmazione'],
  quiz: ['curipod', 'didattica', 'valutazione', 'rubrica', 'studenti', 'interattivo'],
  valutazione: ['curipod', 'rubrica', 'claude', 'feedback', 'competenze', 'voto', 'didattica']
};

/**
 * Returns expanded tokens for a query string including synonyms
 */
export function getExpandedTokens(query: string): string[] {
  const norm = normalizeText(query);
  if (!norm) return [];

  const rawWords = norm.split(/\s+/).filter(w => w.length >= 2);
  const tokenSet = new Set<string>(rawWords);

  // Check whole phrase or individual words for synonyms
  for (const word of rawWords) {
    if (TOPIC_SYNONYMS[word]) {
      for (const syn of TOPIC_SYNONYMS[word]) {
        tokenSet.add(normalizeText(syn));
      }
    }
  }

  // Also check if full phrase maps to synonyms
  if (TOPIC_SYNONYMS[norm]) {
    for (const syn of TOPIC_SYNONYMS[norm]) {
      tokenSet.add(normalizeText(syn));
    }
  }

  return Array.from(tokenSet);
}

/**
 * Scores a RadarItem against a search query
 */
export function scoreRadarItem(item: RadarItem, query: string): number {
  const normQuery = normalizeText(query);
  if (!normQuery) return 1;

  const title = normalizeText(item.title);
  const desc = normalizeText(item.description);
  const exercise = normalizeText(item.exercise || '');
  const scope = normalizeText(item.scope);
  const type = normalizeText(item.type);
  const price = normalizeText(item.price);
  const llm = normalizeText(item.llm || '');
  const source = normalizeText(item.source);

  let score = 0;

  // Direct exact query matching
  if (title.includes(normQuery)) score += 100;
  if (desc.includes(normQuery)) score += 50;
  if (exercise.includes(normQuery)) score += 40;
  if (scope.includes(normQuery)) score += 30;
  if (type.includes(normQuery)) score += 25;
  if (llm.includes(normQuery)) score += 25;
  if (price.includes(normQuery)) score += 20;

  // Token & Synonym matching
  const expandedTokens = getExpandedTokens(normQuery);
  const combinedText = `${title} ${desc} ${exercise} ${scope} ${type} ${price} ${llm} ${source}`;

  for (const token of expandedTokens) {
    if (token === normQuery) continue; // already counted above
    if (combinedText.includes(token)) {
      score += 15;
    }
  }

  return score;
}

/**
 * Scores a PracticalUse item against a search query
 */
export function scorePracticalUse(use: PracticalUse, query: string): number {
  const normQuery = normalizeText(query);
  if (!normQuery) return 1;

  const useCase = normalizeText(use.useCase);
  const prompt = normalizeText(use.prompt);
  const scope = normalizeText(use.scope);
  const llm = normalizeText(use.llm);
  const difficulty = normalizeText(use.difficulty);

  let score = 0;

  if (useCase.includes(normQuery)) score += 80;
  if (prompt.includes(normQuery)) score += 40;
  if (scope.includes(normQuery)) score += 25;
  if (llm.includes(normQuery)) score += 20;
  if (difficulty.includes(normQuery)) score += 10;

  const expandedTokens = getExpandedTokens(normQuery);
  const combinedText = `${useCase} ${prompt} ${scope} ${llm} ${difficulty}`;

  for (const token of expandedTokens) {
    if (token === normQuery) continue;
    if (combinedText.includes(token)) {
      score += 12;
    }
  }

  return score;
}

/**
 * Smart filter for RadarItems
 */
export function filterRadarItems(items: RadarItem[], query: string): RadarItem[] {
  if (!query || !query.trim()) return items;

  const scored = items
    .map(item => ({ item, score: scoreRadarItem(item, query) }))
    .filter(res => res.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.map(res => res.item);
}

/**
 * Smart filter for PracticalUses
 */
export function filterPracticalUses(uses: PracticalUse[], query: string): PracticalUse[] {
  if (!query || !query.trim()) return uses;

  const scored = uses
    .map(use => ({ use, score: scorePracticalUse(use, query) }))
    .filter(res => res.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.map(res => res.use);
}

/**
 * Suggested topic tags when search yields 0 items
 */
export const POPULAR_SUGGESTIONS = [
  'Didattica',
  'Simulatori',
  'NotebookLM',
  'Video & Audio',
  'Claude 3.7',
  'Canvas',
  'Automazioni',
  'Schemi & Mappe',
  'Gratuiti'
];
