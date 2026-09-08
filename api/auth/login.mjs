import { createOwnerSession, ownerCookie, verifyOwnerPassword } from '../../lib/owner-auth.mjs';

const json = (response, status, body, headers = {}) => response.status(status).set(headers).json(body);

export default function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { ok: false, error: 'method_not_allowed' }, { Allow: 'POST' });

  const origin = request.headers.origin;
  const host = request.headers.host;
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return json(response, 403, { ok: false, error: 'origin_not_allowed' });
    } catch {
      return json(response, 403, { ok: false, error: 'origin_not_allowed' });
    }
  }

  let password;
  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    password = body?.password;
  } catch {
    return json(response, 400, { ok: false, error: 'invalid_json' });
  }

  if (typeof password !== 'string' || password.length < 1 || password.length > 256) {
    return json(response, 400, { ok: false, error: 'invalid_credentials' });
  }

  try {
    if (!verifyOwnerPassword(password)) return json(response, 401, { ok: false, error: 'invalid_credentials' }, { 'Cache-Control': 'no-store' });
    const token = createOwnerSession();
    return json(response, 200, { ok: true }, {
      'Set-Cookie': ownerCookie(token),
      'Cache-Control': 'no-store'
    });
  } catch {
    return json(response, 503, { ok: false, error: 'auth_unavailable' }, { 'Cache-Control': 'no-store' });
  }
}
