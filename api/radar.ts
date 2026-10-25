/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Vercel Serverless Function Handler for /api/radar
 */

import { executeRadarSearch, filterFallbackData } from '../src/server/radarEngine';

export default async function handler(req: any, res: any) {
  // Set CORS headers so it can be called from radar.roccoformazione.it or any client
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.removeHeader?.('X-Frame-Options');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Quick health check parameter support
  if (req.query?.health === '1' || req.query?.status === '1') {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY)?.trim();
    const hasApiKey = Boolean(apiKey);
    return res.status(200).json({
      status: 'ok',
      hasApiKey,
      keyPreview: apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-6)}` : null,
      serverTime: new Date().toISOString()
    });
  }

  try {
    let body: any = {};
    if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body);
      } catch {
        body = {};
      }
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    }

    const days = body.days || req.query?.days || 30;
    const query = body.query || req.query?.query;

    const result = await executeRadarSearch(Number(days) || 30, query ? String(query) : undefined);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[Vercel API /api/radar error]:', err);
    
    // Resilient fallback: even if an unexpected serverless error occurs,
    // return valid JSON with fallback data and status 200 so the frontend never crashes!
    const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY)?.trim();
    const fallback = filterFallbackData(30, undefined);
    
    return res.status(200).json({
      items: fallback.items,
      practicalUses: fallback.practicalUses,
      isFallback: true,
      hasApiKey: Boolean(apiKey),
      quotaExceeded: false,
      engineMode: 'verified-archive',
      message: "Visualizzazione Archivio Verificato (recupero resiliente del serverless endpoint)."
    });
  }
}
