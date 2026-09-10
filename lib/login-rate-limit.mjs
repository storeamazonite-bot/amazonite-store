const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const attempts = new Map();

function keyFor(ip, email) {
  const safeIp = String(ip || 'unknown').slice(0, 128);
  const safeEmail = String(email || '').trim().toLowerCase().slice(0, 320);
  return `${safeIp}:${safeEmail}`;
}

function now() { return Date.now(); }

export function getClientIp(request) {
  const forwarded = request?.headers?.['x-forwarded-for'] || request?.headers?.get?.('x-forwarded-for');
  return String(forwarded || '').split(',')[0].trim().slice(0, 128) || 'unknown';
}

export function isLoginRateLimited(request, email, at = now()) {
  const key = keyFor(getClientIp(request), email);
  const entry = attempts.get(key);
  if (!entry) return false;
  if (at - entry.firstFailure >= WINDOW_MS || (entry.lockedUntil && entry.lockedUntil <= at)) {
    attempts.delete(key);
    return false;
  }
  return Boolean(entry.lockedUntil && entry.lockedUntil > at) || entry.failures >= MAX_FAILURES;
}

export function recordLoginFailure(request, email, at = now()) {
  const key = keyFor(getClientIp(request), email);
  const entry = attempts.get(key);
  if (!entry || at - entry.firstFailure >= WINDOW_MS) {
    attempts.set(key, { failures: 1, firstFailure: at, lockedUntil: 0 });
    return;
  }
  entry.failures += 1;
  if (entry.failures >= MAX_FAILURES) entry.lockedUntil = at + LOCKOUT_MS;
}

export function clearLoginFailures(request, email) {
  attempts.delete(keyFor(getClientIp(request), email));
}

export const LOGIN_RATE_LIMIT = Object.freeze({ WINDOW_MS, MAX_FAILURES, LOCKOUT_MS });
