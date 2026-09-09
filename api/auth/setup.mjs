import { buildTotpUri, generateTotpSecret, verifyOwnerEmail, verifyOwnerPassword } from '../../lib/owner-auth.mjs';
import { clearLoginFailures, isLoginRateLimited, recordLoginFailure } from '../../lib/login-rate-limit.mjs';

function json(response, status, body) {
  response.status(status);
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return json(response, 405, { ok: false, error: 'method_not_allowed' });
  }

  try {
    if (process.env.AMAZONITE_TOTP_SECRET) return json(response, 409, { ok: false, error: 'two_factor_already_configured' });
    const contentType = request.headers['content-type'] || '';
    if (!contentType.toLowerCase().includes('application/json')) return json(response, 415, { ok: false, error: 'json_required' });
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || email.length > 320 || !password || password.length > 1024) return json(response, 401, { ok: false, error: 'invalid_credentials' });

    if (isLoginRateLimited(request, email)) {
      response.setHeader('Retry-After', '900');
      return json(response, 429, { ok: false, error: 'too_many_attempts' });
    }

    if (!verifyOwnerEmail(email) || !verifyOwnerPassword(password)) {
      recordLoginFailure(request, email);
      return json(response, 401, { ok: false, error: 'invalid_credentials' });
    }

    clearLoginFailures(request, email);
    const secret = generateTotpSecret();
    return json(response, 200, {
      ok: true,
      configured: false,
      secret,
      provisioningUri: buildTotpUri(secret, email.trim().toLowerCase()),
      warning: 'Store the secret only in the deployment environment as AMAZONITE_TOTP_SECRET. This response is not persisted by the server.'
    });
  } catch (error) {
    console.error('owner 2FA setup failed:', error?.message || error);
    return json(response, 503, { ok: false, error: 'owner_auth_not_configured' });
  }
}
