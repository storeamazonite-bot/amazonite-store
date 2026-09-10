import { deleteProduct, updateProduct } from '../../lib/product-store.mjs';
import { isOwnerRequest } from '../../lib/owner-auth.mjs';
import { validateProductInput } from '../admin/products.mjs';
import { isSameOriginRequest } from '../../lib/request-security.mjs';

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
    affiliateUrl: body.affiliateUrl ?? body.affiliate_url,
    sourceProductUrl: body.sourceProductUrl ?? body.source_url,
    imageUrl: body.imageUrl ?? body.image,
    commissionRate: body.commissionRate ?? body.commission_rate
  };
}

export default async function handler(request, response) {
  if (!isOwnerRequest(request)) return json(response, 401, { ok: false, error: 'Unauthorized' });
  const id = String(request.query?.id || '').trim();
  if (!id || id.length > 120) return json(response, 400, { ok: false, error: 'Product id is required' });
  if (!isSameOriginRequest(request)) return json(response, 403, { ok: false, error: 'cross_origin_request' });

  try {
    if (request.method === 'PUT' || request.method === 'PATCH') {
      const body = requestBody(request);
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json(response, 400, { ok: false, error: 'Invalid JSON body' });
      const product = toStoreProduct(body);
      const validation = validateProductInput(product, { partial: true });
      if (validation) return json(response, 400, { ok: false, error: validation });
      const updated = await updateProduct(id, product);
      return json(response, 200, { ok: true, product: publicProduct(updated) });
    }

    if (request.method === 'DELETE') {
      const deleted = await deleteProduct(id);
      return json(response, 200, { ok: true, product: deleted });
    }

    response.setHeader('Allow', 'PUT, PATCH, DELETE');
    return json(response, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    if (error?.code === 'PRODUCT_NOT_FOUND') return json(response, 404, { ok: false, error: error.message, code: error.code });
    if (error?.code === 'PRODUCT_STORAGE_NOT_CONFIGURED' || error?.code === 'PRODUCT_DELETE_NOT_CONFIGURED') return json(response, 503, { ok: false, error: error.message, code: error.code });
    console.error('[products/:id]', error?.message || error);
    return json(response, 500, { ok: false, error: 'Product storage operation failed' });
  }
}
