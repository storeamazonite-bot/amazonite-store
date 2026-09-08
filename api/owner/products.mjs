import { isOwnerRequest } from '../../lib/owner-auth.mjs';
import { listProducts, replaceProducts } from '../../lib/google-sheets-store.mjs';

const METHODS = new Set(['GET', 'POST', 'PATCH', 'DELETE']);
const STATUS = new Set(['draft', 'testing', 'active', 'hidden', 'needs_review', 'out_of_stock', 'link_invalid', 'retired']);
const MARKETS = new Set(['US', 'UK', 'Canada', 'EU']);
const ALLOWED_AFFILIATE_HOSTS = new Set(['aliexpress.com', 'aliexpress.us', 's.click.aliexpress.com']);
const MAX_BODY = 32_000;

function json(response, status, body) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  return response.status(status).json(body);
}

function originAllowed(request) {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (!host) return false;
  if (request.method === 'GET') return !origin || sameOrigin(origin, host);
  if (!origin) return false;
  return sameOrigin(origin, host);
}

function sameOrigin(origin, host) {
  try { return new URL(origin).host === host; } catch { return false; }
}

function readBody(request) {
  const raw = typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {});
  if (raw.length > MAX_BODY) throw new Error('body_too_large');
  return JSON.parse(raw);
}

function allowedAffiliateUrl(value) {
  try {
    const url = new URL(String(value || ''));
    const host = url.hostname.toLowerCase();
    const approved = ALLOWED_AFFILIATE_HOSTS.has(host) || [...ALLOWED_AFFILIATE_HOSTS].some(base => host.endsWith(`.${base}`));
    return url.protocol === 'https:' && approved;
  } catch { return false; }
}

function cleanProduct(input, existing = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_product');
  const allowed = ['name', 'category', 'status', 'affiliate_url', 'original_url', 'price', 'currency', 'commission_rate', 'rating', 'orders', 'market', 'image_url', 'notes', 'score', 'link_status', 'link_validation_reason'];
  const out = { ...existing };
  for (const key of allowed) if (input[key] !== undefined) out[key] = input[key];
  out.name = String(out.name || '').trim();
  out.category = String(out.category || '').trim();
  out.status = String(out.status || 'draft').trim().toLowerCase();
  out.affiliate_url = String(out.affiliate_url || '').trim();
  out.original_url = String(out.original_url || '').trim();
  out.currency = String(out.currency || 'USD').trim().toUpperCase();
  out.market = String(out.market || 'US').trim();
  out.image_url = String(out.image_url || '').trim();
  out.notes = String(out.notes || '').trim();
  out.link_status = String(out.link_status || 'REVIEW').trim();
  out.link_validation_reason = String(out.link_validation_reason || '').trim();
  if (!out.name || out.name.length > 180) throw new Error('invalid_name');
  if (!STATUS.has(out.status)) throw new Error('invalid_status');
  if (!MARKETS.has(out.market)) throw new Error('invalid_market');
  if (!/^[A-Z]{3}$/.test(out.currency)) throw new Error('invalid_currency');
  if (!allowedAffiliateUrl(out.affiliate_url)) throw new Error('invalid_affiliate_url');
  if (out.original_url && !/^https?:\/\//i.test(out.original_url)) throw new Error('invalid_original_url');
  if (out.image_url && !/^https?:\/\//i.test(out.image_url)) throw new Error('invalid_image_url');
  for (const key of ['price', 'commission_rate', 'rating', 'orders', 'score']) {
    if (out[key] === '' || out[key] === null || out[key] === undefined) { delete out[key]; continue; }
    const n = Number(out[key]);
    if (!Number.isFinite(n) || n < 0) throw new Error(`invalid_${key}`);
    out[key] = n;
  }
  if (out.rating !== undefined && out.rating > 5) throw new Error('invalid_rating');
  if (out.commission_rate !== undefined && out.commission_rate > 100) throw new Error('invalid_commission_rate');
  if (out.score !== undefined && out.score > 100) throw new Error('invalid_score');
  return out;
}

export default async function handler(request, response) {
  if (!METHODS.has(request.method)) return json(response, 405, { ok: false, error: 'method_not_allowed' });
  if (!originAllowed(request)) return json(response, 403, { ok: false, error: 'origin_not_allowed' });
  if (!isOwnerRequest(request)) return json(response, 401, { ok: false, error: 'unauthorized' });

  try {
    if (request.method === 'GET') {
      const products = await listProducts();
      return json(response, 200, { ok: true, products });
    }

    const body = readBody(request);
    const id = String(body?.id || '').trim();
    if (request.method === 'POST') {
      if (id) return json(response, 400, { ok: false, error: 'id_not_allowed_on_create' });
      const now = new Date().toISOString();
      const product = cleanProduct(body, { id: `AMZ-${Date.now().toString(36).toUpperCase()}`, status: 'draft', created_at: now });
      product.updated_at = now;
      const products = await listProducts();
      await replaceProducts([product, ...products]);
      return json(response, 201, { ok: true, product });
    }

    if (!id) return json(response, 400, { ok: false, error: 'id_required' });
    const products = await listProducts();
    const index = products.findIndex(product => product.id === id);
    if (index === -1) return json(response, 404, { ok: false, error: 'product_not_found' });

    if (request.method === 'DELETE') {
      const retired = { ...products[index], status: 'retired', updated_at: new Date().toISOString() };
      products[index] = retired;
      await replaceProducts(products);
      return json(response, 200, { ok: true, product: retired });
    }

    const updated = cleanProduct(body, products[index]);
    updated.id = id;
    updated.created_at = products[index].created_at || new Date().toISOString();
    updated.updated_at = new Date().toISOString();
    products[index] = updated;
    await replaceProducts(products);
    return json(response, 200, { ok: true, product: updated });
  } catch (error) {
    if (error?.message === 'body_too_large') return json(response, 413, { ok: false, error: 'body_too_large' });
    if (error?.message?.startsWith('invalid_') || error?.message === 'id_not_allowed_on_create') return json(response, 400, { ok: false, error: error.message });
    return json(response, 503, { ok: false, error: 'storage_unavailable' });
  }
}
