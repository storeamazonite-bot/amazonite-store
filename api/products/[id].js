import { requireOwner } from '../../lib/auth.js';
import { supabaseAdmin } from '../../lib/supabase.js';
import { enforceSameOrigin, rateLimit, setSecurityHeaders } from '../../lib/http-security.js';

const FIELDS = 'id,name,category,price,rating,badge,image,affiliate_url,status,created_at,updated_at';
const ID_RE = /^[0-9a-fA-F-]{36}$/;

function bodyOf(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
}

function updatePayload(input) {
  const out = {};
  for (const key of ['name', 'category', 'price', 'rating', 'badge', 'image', 'affiliate_url', 'status']) {
    if (key in input) out[key] = input[key];
  }
  if ('price' in out) out.price = Number(out.price);
  if ('rating' in out && out.rating !== null && out.rating !== '') out.rating = Number(out.rating);
  if ('price' in out && (!Number.isFinite(out.price) || out.price < 0)) return null;
  if ('rating' in out && out.rating !== null && (!Number.isFinite(out.rating) || out.rating < 0 || out.rating > 5)) return null;
  if ('status' in out && !['active', 'draft', 'archived'].includes(out.status)) return null;
  return out;
}

export default async function handler(req, res) {
  setSecurityHeaders(res, { noStore: true });
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database service is not configured.' });
  const id = String(req.query?.id || '').trim();
  if (!ID_RE.test(id)) return res.status(400).json({ error: 'Invalid product id.' });

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('products').select(FIELDS).eq('id', id).eq('status', 'active').maybeSingle();
    if (error) return res.status(500).json({ error: 'Unable to load product.' });
    if (!data) return res.status(404).json({ error: 'Product not found.' });
    return res.status(200).json({ product: data });
  }

  if (!['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!enforceSameOrigin(req, res)) return;
  if (!rateLimit(req, res, { limit: 60, windowMs: 60 * 1000, prefix: 'products-write' })) return;

  const owner = await requireOwner(req, res);
  if (!owner) return;

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
    if (error) return res.status(400).json({ error: 'Unable to delete product.' });
    return res.status(200).json({ deleted: true, id });
  }

  try {
    const payload = updatePayload(bodyOf(req));
    if (!payload || Object.keys(payload).length === 0) return res.status(400).json({ error: 'No valid product changes supplied.' });
    const { data, error } = await supabaseAdmin.from('products').update(payload).eq('id', id).select(FIELDS).maybeSingle();
    if (error) return res.status(400).json({ error: 'Unable to update product.' });
    if (!data) return res.status(404).json({ error: 'Product not found.' });
    return res.status(200).json({ product: data });
  } catch {
    return res.status(400).json({ error: 'Invalid request.' });
  }
}
