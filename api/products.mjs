import { getProductCatalog, createProduct } from '../lib/product-store.mjs';
import { isOwnerRequest } from '../lib/owner-auth.mjs';
import { validateProductInput } from './admin/products.mjs';

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.end(JSON.stringify(body));
}

function publicProduct(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    status: product.status,
    affiliate_url: product.affiliateUrl || '',
    price: product.price,
    currency: product.currency,
    rating: product.rating,
    orders: product.orders,
    market: product.market,
    image: product.imageUrl || null
  };
}

function requestBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string' && request.body.length <= 64 * 1024) {
    try { return JSON.parse(request.body); } catch { return null; }
  }
  return null;
}

function toStoreProduct(body) {
  return {
    ...body,
    id: body.id || `AMZ-${Date.now().toString(36).toUpperCase()}`,
    affiliateUrl: body.affiliateUrl ?? body.affiliate_url,
    sourceProductUrl: body.sourceProductUrl ?? body.source_url,
    imageUrl: body.imageUrl ?? body.image,
    commissionRate: body.commissionRate ?? body.commission_rate
  };
}

export default async function handler(request, response) {
  if (request.method === 'GET') {
    try {
      const status = String(request.query?.status || 'active').toLowerCase();
      if (status !== 'active' && !isOwnerRequest(request)) return json(response, 401, { ok: false, error: 'Unauthorized' });
      const catalog = await getProductCatalog();
      const products = (catalog.products || []).filter(product => status === 'all' || String(product.status).toLowerCase() === status);
      return json(response, 200, { ok: true, products: products.map(publicProduct) });
    } catch (error) {
      console.error('[products]', error?.message || error);
      return json(response, 503, { ok: false, error: 'Product catalog unavailable' });
    }
  }

  if (!isOwnerRequest(request)) return json(response, 401, { ok: false, error: 'Unauthorized' });
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return json(response, 405, { ok: false, error: 'Method not allowed' });
  }

  const body = requestBody(request);
  const product = toStoreProduct(body || {});
  const validation = validateProductInput(product);
  if (validation) return json(response, 400, { ok: false, error: validation });

  try {
    const created = await createProduct(product);
    return json(response, 201, { ok: true, product: publicProduct(created) });
  } catch (error) {
    console.error('[products]', error?.message || error);
    return json(response, 503, { ok: false, error: 'Product storage operation failed' });
  }
}
