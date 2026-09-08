import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const OWNER_SESSION_COOKIE = 'amazonite_owner_session';
export const OWNER_SESSION_TTL_SECONDS = 60 * 60 * 8;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function sign(value) {
  return createHmac('sha256', requiredEnv('AMAZONITE_AUTH_SECRET')).update(value).digest('base64url');
}

export function verifyOwnerPassword(password) {
  const parts = requiredEnv('AMAZONITE_OWNER_PASSWORD_HASH').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nText, rText, pText, saltText, hashText] = parts;
  const N = Number(nText), r = Number(rText), p = Number(pText);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || N < 16384 || (N & (N - 1)) !== 0 || r < 1 || p < 1) return false;
  try {
    const expected = Buffer.from(hashText, 'base64url');
    const actual = scryptSync(password, Buffer.from(saltText, 'base64url'), expected.length, { N, r, p, maxmem: 128 * N * r + 1024 });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch { return false; }
}

export function createOwnerSession(now = Math.floor(Date.now() / 1000)) {
  const payload = Buffer.from(JSON.stringify({ sub: 'owner', iat: now, exp: now + OWNER_SESSION_TTL_SECONDS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyOwnerSession(token, now = Math.floor(Date.now() / 1000)) {
  if (!token || typeof token !== 'string') return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = sign(payload);
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data?.sub === 'owner' && Number.isInteger(data.exp) && data.exp > now;
  } catch { return false; }
}

export function getOwnerSessionFromRequest(request) {
  const cookieHeader = request?.headers?.get?.('cookie') ?? request?.headers?.cookie ?? '';
  const match = String(cookieHeader).match(new RegExp(`(?:^|;\\s*)${OWNER_SESSION_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

export function isOwnerRequest(request) {
  try {
    return verifyOwnerSession(getOwnerSessionFromRequest(request));
  } catch {
    return false;
  }
}

export function buildOwnerCookie(token) {
  return `${OWNER_SESSION_COOKIE}=${token}; Max-Age=${OWNER_SESSION_TTL_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

export function clearOwnerCookie() {
  return `${OWNER_SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

export function generatePasswordHash(password, { N = 16384, r = 8, p = 1, keyLength = 64 } = {}) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, keyLength, { N, r, p, maxmem: 128 * N * r + 1024 });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}
