import { appendAnalyticsEvent, readAnalyticsEvents } from '../../../lib/analytics-store.mjs';
import { isOwnerRequest } from '../../../lib/owner-auth.mjs';

const MAX_BODY_BYTES = 16 * 1024;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 120;
const buckets = new Map();

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

function header(request, name) {
  if (request.headers?.get) return request.headers.get(name);
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value || null;
}

function requestBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') {
    if (Buffer.byteLength(request.body, 'utf8') > MAX_BODY_BYTES) return null;
    try { return JSON.parse(request.body); } catch { return null; }
  }
  return null;
}

function requestOrigin(request) {
  const origin = header(request, 'origin');
  if (origin) return origin;
  const referer = header(request, 'referer');
  if (!referer) return null;
  try { return new URL(referer).origin; } catch { return null; }
}

function isSameOrigin(request) {
  const origin = requestOrigin(request);
  if (!origin) return true;
  const host = header(request, 'host');
  if (!host) return true;
  try {
    const expected = `${header(request, 'x-forwarded-proto') || 'https'}://${host}`;
    return new URL(origin).origin === new URL(expected).origin;
  } catch {
    return false;
  }
}

function clientKey(request) {
  return header(request, 'x-forwarded-for')?.split(',')[0]?.trim()
    || header(request, 'x-real-ip')
    || 'anonymous';
}

function rateLimited(request) {
  const now = Date.now();
  const key = clientKey(request);
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    if (buckets.size > 5000) buckets.clear();
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
}

function errorResponse(response, error) {
  if (error?.code === 'ANALYTICS_INVALID_EVENT') return json(response, 400, { ok: false, error: error.message, code: error.code });
  if (error?.code === 'ANALYTICS_STORAGE_NOT_CONFIGURED') return json(response, 503, { ok: false, error: error.message, code: error.code });
  console.error('[analytics/events]', error);
  return json(response, 500, { ok: false, error: 'Analytics storage operation failed' });
}

export default async function handler(request, response) {
  try {
    if (request.method === 'POST') {
      const contentType = header(request, 'content-type');
      if (contentType && !contentType.toLowerCase().startsWith('application/json')) {
        return json(response, 415, { ok: false, error: 'Content-Type must be application/json' });
      }
      if (!isSameOrigin(request)) return json(response, 403, { ok: false, error: 'Cross-origin analytics ingestion rejected' });
      if (rateLimited(request)) return json(response, 429, { ok: false, error: 'Too many analytics events' });

      const rawLength = header(request, 'content-length');
      if (rawLength && Number(rawLength) > MAX_BODY_BYTES) {
        return json(response, 413, { ok: false, error: 'Analytics event is too large' });
      }

      const body = requestBody(request);
      if (!body || typeof body !== 'object') return json(response, 400, { ok: false, error: 'Invalid JSON body' });
      await appendAnalyticsEvent(body);
      return json(response, 201, { ok: true });
    }

    if (request.method === 'GET') {
      if (!isOwnerRequest(request)) return json(response, 401, { ok: false, error: 'Unauthorized' });
      const events = await readAnalyticsEvents();
      return json(response, 200, { ok: true, events });
    }

    response.setHeader('Allow', 'GET, POST');
    return json(response, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    return errorResponse(response, error);
  }
}
