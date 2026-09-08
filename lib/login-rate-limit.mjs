const failures = new Map();

export const LOGIN_RATE_LIMIT_MAX_FAILURES = 5;
export const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
export const LOGIN_RATE_LIMIT_MAX_KEYS = 10_000;

function prune(now) {
  for (const [key, timestamps] of failures) {
    const recent = timestamps.filter((timestamp) => timestamp + LOGIN_RATE_LIMIT_WINDOW_SECONDS > now);
    if (recent.length) failures.set(key, recent);
    else failures.delete(key);
  }
}

function normalizeKey(key) {
  return typeof key === 'string' && key.length > 0 && key.length <= 200 ? key : 'unknown';
}

export function isLoginRateLimited(key, now = Math.floor(Date.now() / 1000)) {
  prune(now);
  const timestamps = failures.get(normalizeKey(key)) || [];
  return timestamps.length >= LOGIN_RATE_LIMIT_MAX_FAILURES;
}

export function registerLoginFailure(key, now = Math.floor(Date.now() / 1000)) {
  prune(now);
  const normalizedKey = normalizeKey(key);
  const timestamps = failures.get(normalizedKey) || [];
  if (timestamps.length >= LOGIN_RATE_LIMIT_MAX_FAILURES) return true;

  timestamps.push(now);
  if (failures.size >= LOGIN_RATE_LIMIT_MAX_KEYS && !failures.has(normalizedKey)) {
    const oldestKey = failures.keys().next().value;
    if (oldestKey !== undefined) failures.delete(oldestKey);
  }
  failures.set(normalizedKey, timestamps);
  return false;
}

export function clearLoginFailures(key) {
  failures.delete(normalizeKey(key));
}

export function resetLoginRateLimitForTests() {
  failures.clear();
}
