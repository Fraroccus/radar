/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Vercel Serverless Function Handler for /api/assistant
 */

import Groq from 'groq-sdk';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY non configurata su Vercel.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { message, context } = body;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Sei un assistente esperto in AI e didattica per l\'app \'AI Radar per Formatori\'. Aiuta gli utenti e i formatori a capire come usare i tool AI o crea prompt operativi per loro. Rispondi sempre in ITALIANO. Sii conciso, pratico e professionale.'
        },
        {
          role: 'user',
          content: `Contesto attuale dell'app: ${JSON.stringify(context || {})}\n\nDomanda dell'utente: ${message || ''}`
        }
      ],
      model: 'llama-3-8b-8192',
    });

    return res.status(200).json({
      response: completion.choices[0]?.message?.content || 'Nessuna risposta generata.'
    });
  } catch (error: any) {
    console.error('[Vercel API /api/assistant error]:', error);
    return res.status(500).json({
      error: 'Errore durante la comunicazione con l\'assistente Groq.',
      details: error?.message || String(error)
    });
  }
}
