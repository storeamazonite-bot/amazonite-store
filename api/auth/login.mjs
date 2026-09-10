import { buildOwnerCookie, createOwnerSession, verifyOwnerEmail, verifyOwnerPassword, verifyTotp } from '../../lib/owner-auth.mjs';
import { clearLoginFailures, getClientIp, isLoginRateLimited, recordLoginFailure } from '../../lib/login-rate-limit.mjs';
import { isSameOriginRequest } from '../../lib/request-security.mjs';

function json(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return json(response, 405, { ok: false, error: 'method_not_allowed' });
  }
  if (!isSameOriginRequest(request)) return json(response, 403, { ok: false, error: 'cross_origin_request' });

  try {
    const contentType = request.headers['content-type'] || '';
    if (!contentType.toLowerCase().includes('application/json')) return json(response, 415, { ok: false, error: 'json_required' });
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const totp = typeof body.totp === 'string' ? body.totp.replace(/\s+/g, '') : '';
    if (!email || email.length > 320 || !password || password.length > 1024 || !/^\d{6}$/.test(totp)) return json(response, 401, { ok: false, error: 'invalid_credentials' });

    if (isLoginRateLimited(request, email)) {
      response.setHeader('Retry-After', '900');
      return json(response, 429, { ok: false, error: 'too_many_attempts' });
    }

    if (!verifyOwnerEmail(email) || !verifyOwnerPassword(password)) {
      recordLoginFailure(request, email);
      return json(response, 401, { ok: false, error: 'invalid_credentials' });
    }
    const secret = process.env.AMAZONITE_TOTP_SECRET;
    if (!secret) return json(response, 503, { ok: false, error: 'two_factor_not_configured' });
    if (!verifyTotp(totp, secret)) {
      recordLoginFailure(request, email);
      return json(response, 401, { ok: false, error: 'invalid_two_factor_code' });
    }

    clearLoginFailures(request, email);
    const token = createOwnerSession();
    response.setHeader('Set-Cookie', buildOwnerCookie(token));
    return json(response, 200, { ok: true, amr: ['pwd', 'totp'] });
  } catch (error) {
    console.error('owner login failed:', error?.message || error);
    return json(response, 503, { ok: false, error: 'owner_auth_not_configured' });
  }
}
