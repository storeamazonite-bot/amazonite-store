import { createProduct, deleteProduct, getProductCatalog, updateProduct } from '../../lib/product-store.mjs';
import { isOwnerRequest } from '../../lib/owner-auth.mjs';
import { isSameOriginRequest } from '../../lib/request-security.mjs';

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.end(JSON.stringify(body));
}

function requestBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') {
    if (request.body.length > 64 * 1024) return null;
    try { return JSON.parse(request.body); } catch { return null; }
  }
  return null;
}

function validHttpUrl(value, allowedHosts = []) {
  if (typeof value !== 'string' || value.length > 4096) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    return allowedHosts.length === 0 || allowedHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch { return false; }
}

export function validateProductInput(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Invalid product payload';
  const required = ['name', 'category', 'status', 'affiliateUrl', 'price', 'currency', 'rating', 'orders', 'market', 'imageUrl'];
  if (!partial) for (const field of required) if (!(field in body)) return `Missing field: ${field}`;
  if ('name' in body && (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.length > 180)) return 'Invalid product name';
  if ('category' in body && (typeof body.category !== 'string' || body.category.trim().length < 1 || body.category.length > 80)) return 'Invalid product category';
  if ('status' in body && (typeof body.status !== 'string' || !['Draft','Testing','Active','draft','testing','active'].includes(body.status))) return 'Invalid product status';
  if ('affiliateUrl' in body && !validHttpUrl(body.affiliateUrl, ['aliexpress.com'])) return 'Invalid AliExpress affiliate URL';
  if ('sourceProductUrl' in body && body.sourceProductUrl !== null && body.sourceProductUrl !== undefined && !validHttpUrl(body.sourceProductUrl, ['aliexpress.com'])) return 'Invalid AliExpress source URL';
  if ('imageUrl' in body && body.imageUrl !== null && body.imageUrl !== undefined && body.imageUrl !== '' && !validHttpUrl(body.imageUrl)) return 'Invalid image URL';
  for (const [field, min, max] of [['price', 0, Number.MAX_SAFE_INTEGER], ['commissionRate', 0, 100], ['rating', 0, 5], ['orders', 0, Number.MAX_SAFE_INTEGER], ['intelligenceScore', 0, 100]]) {
    if (!(field in body) || body[field] === null || body[field] === '') continue;
    const n = Number(body[field]);
    if (!Number.isFinite(n) || n < min || n > max) return `Invalid ${field}`;
    if (field === 'orders' && !Number.isInteger(n)) return 'Invalid orders';
  }
  if ('currency' in body && body.currency !== null && !['USD','GBP','CAD','EUR'].includes(String(body.currency))) return 'Invalid currency';
  if ('market' in body && body.market !== null && !['US','UK','Canada','EU'].includes(String(body.market))) return 'Invalid market';
  if ('notes' in body && body.notes !== null && (typeof body.notes !== 'string' || body.notes.length > 4000)) return 'Invalid notes';
  return null;
}

function storageError(response, error) {
  if (error?.code === 'PRODUCT_STORAGE_NOT_CONFIGURED') return json(response, 503, { ok: false, error: error.message, code: error.code });
  if (error?.code === 'PRODUCT_NOT_FOUND') return json(response, 404, { ok: false, error: error.message, code: error.code });
  if (error?.code === 'PRODUCT_DELETE_NOT_CONFIGURED') return json(response, 503, { ok: false, error: error.message, code: error.code });
  console.error('[admin/products]', error);
  return json(response, 500, { ok: false, error: 'Product storage operation failed' });
}

export default async function handler(request, response) {
  if (!isOwnerRequest(request)) return json(response, 401, { ok: false, error: 'Unauthorized' });

  try {
    if (request.method === 'GET') {
      const catalog = await getProductCatalog();
      return json(response, 200, { ok: true, ...catalog });
    }

    if (!isSameOriginRequest(request)) return json(response, 403, { ok: false, error: 'cross_origin_request' });

    if (request.method === 'POST') {
      const body = requestBody(request);
      const validation = validateProductInput(body);
      if (validation) return json(response, 400, { ok: false, error: validation });
      const product = await createProduct(body);
      return json(response, 201, { ok: true, product });
    }

    if (request.method === 'PATCH' || request.method === 'PUT') {
      const body = requestBody(request);
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json(response, 400, { ok: false, error: 'Invalid JSON body' });
      const id = String(body.id || request.query?.id || '').trim();
      if (!id || id.length > 120) return json(response, 400, { ok: false, error: 'Product id is required' });
      const validation = validateProductInput(body, { partial: true });
      if (validation) return json(response, 400, { ok: false, error: validation });
      const product = await updateProduct(id, body);
      return json(response, 200, { ok: true, product });
    }

    if (request.method === 'DELETE') {
      const id = String(request.query?.id || '').trim();
      if (!id || id.length > 120) return json(response, 400, { ok: false, error: 'Product id is required' });
      const product = await deleteProduct(id);
      return json(response, 200, { ok: true, product });
    }

    response.setHeader('Allow', 'GET, POST, PATCH, PUT, DELETE');
    return json(response, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    return storageError(response, error);
  }
}
