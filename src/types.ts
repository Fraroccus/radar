/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Scope = 'Didattica' | 'Ufficio' | 'PMI' | 'Tutti';
export type ItemType = 'Nuovo tool' | 'Nuova funzione' | 'Esercizio pratico' | 'Utilizzo LLM' | 'Tutti';
export type Price = 'Gratuito' | 'Freemium' | 'A pagamento' | 'Tutti' | 'N.D.';
export type LLM = 'ChatGPT' | 'Gemini' | 'Claude' | 'Copilot' | 'Altri' | 'Tutti';
export type Difficulty = 'Facile' | 'Medio' | 'Avanzato';

export interface RadarItem {
  id: string;
  title: string;
  scope: Scope;
  type: ItemType;
  description: string;
  price: Price;
  exercise?: string;
  source: string;
  date: string;
  llm?: LLM;
}

export interface PracticalUse {
  id: string;
  llm: LLM;
  scope: Scope;
  useCase: string;
  prompt: string;
  difficulty: Difficulty;
}

export const SCOPES: Scope[] = ['Tutti', 'Didattica', 'Ufficio', 'PMI'];
export const TYPES: ItemType[] = ['Tutti', 'Nuovo tool', 'Nuova funzione', 'Esercizio pratico', 'Utilizzo LLM'];
export const PRICES: Price[] = ['Tutti', 'Gratuito', 'Freemium', 'A pagamento'];
export const LLMS: LLM[] = ['Tutti', 'ChatGPT', 'Gemini', 'Claude', 'Copilot', 'Altri'];
