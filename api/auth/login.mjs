import { buildOwnerCookie, createOwnerSession, verifyOwnerPassword } from '../../lib/owner-auth.mjs';

function json(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return json(response, 405, { ok: false, error: 'method_not_allowed' });
  }

  try {
    const contentType = request.headers['content-type'] || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return json(response, 415, { ok: false, error: 'json_required' });
    }

    const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password || password.length > 1024) {
      return json(response, 400, { ok: false, error: 'invalid_credentials' });
    }

    if (!verifyOwnerPassword(password)) {
      return json(response, 401, { ok: false, error: 'invalid_credentials' });
    }

    const token = createOwnerSession();
    response.setHeader('Set-Cookie', buildOwnerCookie(token));
    return json(response, 200, { ok: true });
  } catch (error) {
    console.error('owner login failed:', error?.message || error);
    return json(response, 503, { ok: false, error: 'owner_auth_not_configured' });
  }
}
