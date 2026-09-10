export function getRequestIp(request) {
  const forwarded = request?.headers?.['x-forwarded-for'] || request?.headers?.get?.('x-forwarded-for');
  return String(forwarded || '').split(',')[0].trim().slice(0, 128) || 'unknown';
}

export function createPublicRateLimiter({ windowMs = 60_000, maxRequests = 60 } = {}) {
  const entries = new Map();
  function key(request) { return getRequestIp(request); }
  function isLimited(request, at = Date.now()) {
    const k = key(request); const entry = entries.get(k);
    if (!entry || at - entry.startedAt >= windowMs) { entries.delete(k); return false; }
    return entry.count >= maxRequests;
  }
  function record(request, at = Date.now()) {
    const k = key(request); const entry = entries.get(k);
    if (!entry || at - entry.startedAt >= windowMs) entries.set(k, { startedAt: at, count: 1 });
    else entry.count += 1;
  }
  return Object.freeze({ isLimited, record });
}
