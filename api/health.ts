/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Vercel Serverless Function Handler for /api/health
 */

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY)?.trim();
  const hasApiKey = Boolean(apiKey);
  const keyPreview = apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-6)}` : null;

  return res.status(200).json({
    status: 'ok',
    hasApiKey,
    keyConfigured: hasApiKey,
    keyPreview,
    nodeVersion: process.version,
    serverTime: new Date().toISOString()
  });
}
