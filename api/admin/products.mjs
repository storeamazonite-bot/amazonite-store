import { createProduct, deleteProduct, getProductCatalog, updateProduct } from '../../lib/product-store.mjs';
import { isOwnerRequest } from '../../lib/owner-auth.mjs';

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

function requestBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') {
    try { return JSON.parse(request.body); } catch { return null; }
  }
  return null;
}

function storageError(response, error) {
  if (error?.code === 'PRODUCT_STORAGE_NOT_CONFIGURED') {
    return json(response, 503, { ok: false, error: error.message, code: error.code });
  }
  if (error?.code === 'PRODUCT_NOT_FOUND') {
    return json(response, 404, { ok: false, error: error.message, code: error.code });
  }
  if (error?.code === 'PRODUCT_DELETE_NOT_CONFIGURED') {
    return json(response, 503, { ok: false, error: error.message, code: error.code });
  }
  console.error('[admin/products]', error);
  return json(response, 500, { ok: false, error: 'Product storage operation failed' });
}

export default async function handler(request, response) {
  if (!isOwnerRequest(request)) {
    return json(response, 401, { ok: false, error: 'Unauthorized' });
  }

  try {
    if (request.method === 'GET') {
      const catalog = await getProductCatalog();
      return json(response, 200, { ok: true, ...catalog });
    }

    if (request.method === 'POST') {
      const body = requestBody(request);
      if (!body || typeof body !== 'object') return json(response, 400, { ok: false, error: 'Invalid JSON body' });
      const product = await createProduct(body);
      return json(response, 201, { ok: true, product });
    }

    if (request.method === 'PATCH' || request.method === 'PUT') {
      const body = requestBody(request);
      const id = String(body?.id || request.query?.id || '').trim();
      if (!id) return json(response, 400, { ok: false, error: 'Product id is required' });
      if (!body || typeof body !== 'object') return json(response, 400, { ok: false, error: 'Invalid JSON body' });
      const product = await updateProduct(id, body);
      return json(response, 200, { ok: true, product });
    }

    if (request.method === 'DELETE') {
      const id = String(request.query?.id || '').trim();
      if (!id) return json(response, 400, { ok: false, error: 'Product id is required' });
      const product = await deleteProduct(id);
      return json(response, 200, { ok: true, product });
    }

    response.setHeader('Allow', 'GET, POST, PATCH, PUT, DELETE');
    return json(response, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    return storageError(response, error);
  }
}
