import { readFile } from 'node:fs/promises';
import { isOwnerRequest } from '../../lib/owner-auth.mjs';

const CATALOG_PATH = new URL('../../data/products.json', import.meta.url);

async function readCatalog() {
  const text = await readFile(CATALOG_PATH, 'utf8');
  return JSON.parse(text);
}

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (!isOwnerRequest(request)) {
    return json(response, 401, { ok: false, error: 'Unauthorized' });
  }

  if (request.method === 'GET') {
    try {
      const catalog = await readCatalog();
      return json(response, 200, { ok: true, ...catalog });
    } catch (error) {
      return json(response, 500, { ok: false, error: 'Catalog unavailable', detail: error.message });
    }
  }

  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
    return json(response, 503, {
      ok: false,
      error: 'Persistent product storage is not configured yet',
      code: 'PRODUCT_STORAGE_NOT_CONFIGURED'
    });
  }

  response.setHeader('Allow', 'GET, POST, PATCH, PUT, DELETE');
  return json(response, 405, { ok: false, error: 'Method not allowed' });
}
