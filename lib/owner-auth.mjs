import crypto from 'node:crypto';

export const OWNER_SESSION_COOKIE = 'amazonite_owner_session';
export const OWNER_SESSION_TTL_SECONDS = 8 * 60 * 60;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(a, b) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export function verifyOwnerPassword(password) {
  const encoded = requiredEnv('AMAZONITE_OWNER_PASSWORD_HASH');
  const parts = encoded.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, nText, rText, pText, salt, expectedHex] = parts;
  const N = Number(nText);
  const r = Number(rText);
  const p = Number(pText);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  if (N <= 1 || (N & (N - 1)) !== 0 || r <= 0 || p <= 0 || !/^[0-9a-f]+$/i.test(expectedHex)) return false;

  try {
    const actual = crypto.scryptSync(String(password), salt, expectedHex.length / 2, { N, r, p });
    return safeEqual(actual.toString('hex'), expectedHex.toLowerCase());
  } catch {
    return false;
  }
}

export function createOwnerSession(now = Math.floor(Date.now() / 1000)) {
  const payload = JSON.stringify({ sub: 'owner', iat: now, exp: now + OWNER_SESSION_TTL_SECONDS });
  const encoded = base64url(payload);
  const signature = sign(encoded, requiredEnv('AMAZONITE_AUTH_SECRET'));
  return `${encoded}.${signature}`;
}

export function verifyOwnerSession(token, now = Math.floor(Date.now() / 1000)) {
  if (typeof token !== 'string') return false;
  const dot = token.lastIndexOf('.');
  if (dot <= 0 || dot === token.length - 1) return false;
  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(encoded, requiredEnv('AMAZONITE_AUTH_SECRET'));
  if (!safeEqual(signature, expected)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return payload?.sub === 'owner' && Number.isInteger(payload.iat) && Number.isInteger(payload.exp) && payload.exp > now && payload.iat <= now;
  } catch {
    return false;
  }
}

export function parseCookies(cookieHeader = '') {
  const cookies = {};
  for (const part of String(cookieHeader).split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const name = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    try {
      cookies[name] = decodeURIComponent(rawValue);
    } catch {
      cookies[name] = '';
    }
  }
  return cookies;
}

export function isOwnerRequest(request) {
  const cookies = parseCookies(request?.headers?.cookie || '');
  return verifyOwnerSession(cookies[OWNER_SESSION_COOKIE]);
}

export function ownerCookie(token) {
  return `${OWNER_SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${OWNER_SESSION_TTL_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

export function clearOwnerCookie() {
  return `${OWNER_SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`;
}
