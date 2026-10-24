/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Vercel Serverless Function Handler for /api/radar
 */

import { executeRadarSearch } from '../src/server/radarEngine';

export default async function handler(req: any, res: any) {
  // Set CORS headers so it can be called from roccoformazione.it or any client
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Frame-Options', 'ALLOWALL');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const days = body.days || req.query?.days || 30;
    const query = body.query || req.query?.query;

    const result = await executeRadarSearch(Number(days) || 30, query);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[Vercel API /api/radar error]:', err);
    return res.status(500).json({
      error: 'Errore interno durante il recupero dei dati del radar',
      message: err?.message || String(err)
    });
  }
}
