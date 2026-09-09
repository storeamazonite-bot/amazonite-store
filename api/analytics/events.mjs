import { appendAnalyticsEvent, readAnalyticsEvents } from '../../lib/analytics-store.mjs';
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

function errorResponse(response, error) {
  if (error?.code === 'ANALYTICS_INVALID_EVENT') return json(response, 400, { ok: false, error: error.message, code: error.code });
  if (error?.code === 'ANALYTICS_STORAGE_NOT_CONFIGURED') return json(response, 503, { ok: false, error: error.message, code: error.code });
  console.error('[analytics/events]', error);
  return json(response, 500, { ok: false, error: 'Analytics storage operation failed' });
}

export default async function handler(request, response) {
  try {
    if (request.method === 'POST') {
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
