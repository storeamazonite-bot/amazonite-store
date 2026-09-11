import { verifyOwnerPassword, createOwnerSession, buildOwnerCookie } from '../lib/owner-auth.mjs';
import { verifyTotp } from '../lib/totp.mjs';

const buckets = globalThis.__amazoniteOwnerLoginBuckets || new Map();
globalThis.__amazoniteOwnerLoginBuckets = buckets;

function json(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const bucket = buckets.get(ip) || { started: now, count: 0 };
  if (now - bucket.started >= 10 * 60_000) { bucket.started = now; bucket.count = 0; }
  bucket.count += 1;
  buckets.set(ip, bucket);
  if (buckets.size > 2000) {
    for (const [key, value] of buckets) if (now - value.started >= 10 * 60_000) buckets.delete(key);
  }
  if (bucket.count > 10) return json(res, 429, { error: 'Too many login attempts' });

  try {
    const body = req.body || {};
    const password = typeof body.password === 'string' ? body.password : '';
    const totp = typeof body.totp === 'string' ? body.totp : '';
    if (!password || !totp) return json(res, 400, { error: 'Password and authenticator code are required' });

    const passwordOk = verifyOwnerPassword(password);
    const totpOk = verifyTotp(process.env.AMAZONITE_OWNER_TOTP_SECRET, totp, undefined, {
      digits: Number(process.env.AMAZONITE_OWNER_TOTP_DIGITS || 6),
      period: Number(process.env.AMAZONITE_OWNER_TOTP_PERIOD || 30),
      algorithm: String(process.env.AMAZONITE_OWNER_TOTP_ALGORITHM || 'sha1').toLowerCase(),
      window: 1,
    });

    if (!passwordOk || !totpOk) return json(res, 401, { error: 'Invalid owner credentials' });

    const token = createOwnerSession();
    res.setHeader('Set-Cookie', buildOwnerCookie(token));
    return json(res, 200, { ok: true });
  } catch {
    return json(res, 503, { error: 'Owner authentication is not configured' });
  }
}
