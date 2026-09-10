import fs from 'node:fs/promises';
import path from 'node:path';

const ALLOWED_METHOD = 'GET';

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function isPublishable(item) {
  if (!item || typeof item !== 'object') return false;
  if (item.publicationStatus !== 'publishable') return false;
  if (item.affiliateVerification?.verified !== true) return false;
  const checks = item.intelligence?.checks || {};
  return checks.orders === true && checks.rating === true && checks.commission === true && checks.available === true;
}

function normalize(item) {
  return {
    id: String(item.id || ''),
    name: String(item.name || ''),
    category: String(item.category || ''),
    image: typeof item.image === 'string' ? item.image : null,
    price: item.price ?? null,
    currency: typeof item.currency === 'string' ? item.currency : 'USD',
    affiliateUrl: item.affiliateUrl || item.affiliateVerification?.record?.affiliateUrl || null,
    score: Number.isFinite(item.intelligence?.score) ? item.intelligence.score : 0
  };
}

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== ALLOWED_METHOD) {
    res.statusCode = 405;
    res.setHeader('Allow', ALLOWED_METHOD);
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    const file = path.join(process.cwd(), 'data', 'intelligence-view.json');
    const raw = await fs.readFile(file, 'utf8');
    const data = JSON.parse(raw);
    const items = Array.isArray(data.items) ? data.items.filter(isPublishable).map(normalize) : [];
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ schemaVersion: '1.0.0', count: items.length, items }));
  } catch (_) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'Storefront product data unavailable' }));
  }
}
