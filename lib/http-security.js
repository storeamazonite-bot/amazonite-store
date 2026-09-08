const buckets = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 5000;

export function setSecurityHeaders(res, { noStore = false } = {}) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  if (noStore) res.setHeader('Cache-Control', 'no-store');
}

function expectedOrigin(req) {
  const configured = process.env.APP_ORIGIN;
  if (configured) return configured.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return host ? `${String(proto).split(',')[0].trim()}://${String(host).split(',')[0].trim()}` : null;
}

export function enforceSameOrigin(req, res) {
  const origin = req.headers.origin;
  if (!origin) {
    res.status(403).json({ error: 'Origin header required.' });
    return false;
  }
  const expected = expectedOrigin(req);
  if (!expected || origin.replace(/\/$/, '') !== expected) {
    res.status(403).json({ error: 'Cross-origin request rejected.' });
    return false;
  }
  return true;
}

function clientKey(req) {
  return String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim().slice(0, 100);
}

export function rateLimit(req, res, { limit = 10, windowMs = WINDOW_MS, prefix = 'default' } = {}) {
  const now = Date.now();
  const key = `${prefix}:${clientKey(req)}`;
  const existing = buckets.get(key);
  if (!existing || now - existing.start >= windowMs) {
    if (buckets.size >= MAX_ENTRIES) {
      for (const [k, v] of buckets) if (now - v.start >= windowMs) buckets.delete(k);
    }
    buckets.set(key, { start: now, count: 1 });
    return true;
  }
  existing.count += 1;
  if (existing.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.start + windowMs - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return false;
  }
  return true;
}
