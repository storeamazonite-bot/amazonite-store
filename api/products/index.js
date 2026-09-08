import { requireOwner } from '../../lib/auth.js';
import { supabaseAdmin } from '../../lib/supabase.js';
import { enforceSameOrigin, rateLimit, setSecurityHeaders } from '../../lib/http-security.js';

const FIELDS = 'id,name,category,price,rating,badge,image,affiliate_url,status,created_at,updated_at';

function bodyOf(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
}

function productPayload(input, partial = false) {
  const out = {};
  const allowed = ['name', 'category', 'price', 'rating', 'badge', 'image', 'affiliate_url', 'status'];
  for (const key of allowed) {
    if (partial && !(key in input)) continue;
    if (key in input) out[key] = input[key];
  }
  if (!partial) {
    if (!out.name || !out.affiliate_url) return null;
    out.category ||= 'Electronics';
    out.status ||= 'active';
  }
  if (out.price !== undefined) out.price = Number(out.price);
  if (out.rating !== undefined && out.rating !== null && out.rating !== '') out.rating = Number(out.rating);
  if (out.price !== undefined && (!Number.isFinite(out.price) || out.price < 0)) return null;
  if (out.rating !== undefined && out.rating !== null && (!Number.isFinite(out.rating) || out.rating < 0 || out.rating > 5)) return null;
  if (out.status !== undefined && !['active', 'draft', 'archived'].includes(out.status)) return null;
  return out;
}

export default async function handler(req, res) {
  setSecurityHeaders(res, { noStore: true });
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database service is not configured.' });

  if (req.method === 'GET') {
    const status = String(req.query?.status || 'active');

    // Only the public active catalog is readable without an authenticated OWNER session.
    // Administrative statuses (draft, archived, all) never become public data.
    if (status !== 'active') {
      const owner = await requireOwner(req, res);
      if (!owner) return;
    }

    let query = supabaseAdmin.from('products').select(FIELDS).order('created_at', { ascending: false });
    if (status === 'all') {
      // OWNER-only administrative listing; intentionally no status filter.
    } else if (['active', 'draft', 'archived'].includes(status)) {
      query = query.eq('status', status);
    } else {
      return res.status(400).json({ error: 'Invalid product status.' });
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: 'Unable to load products.' });
    return res.status(200).json({ products: data || [] });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!enforceSameOrigin(req, res)) return;
  if (!rateLimit(req, res, { limit: 60, windowMs: 60 * 1000, prefix: 'products-write' })) return;

  const owner = await requireOwner(req, res);
  if (!owner) return;

  try {
    const payload = productPayload(bodyOf(req));
    if (!payload) return res.status(400).json({ error: 'Invalid product data.' });
    const { data, error } = await supabaseAdmin.from('products').insert(payload).select(FIELDS).single();
    if (error) return res.status(400).json({ error: 'Unable to create product.' });
    return res.status(201).json({ product: data });
  } catch {
    return res.status(400).json({ error: 'Invalid request.' });
  }
}
