import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const OWNER_SESSION_COOKIE = 'amazonite_owner_session';
export const OWNER_SESSION_TTL_SECONDS = 60 * 60 * 8;
export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function sign(value) {
  return createHmac('sha256', requiredEnv('AMAZONITE_AUTH_SECRET')).update(value).digest('base64url');
}

function scryptOptions(N, r, p) {
  return { N, r, p, maxmem: Math.max(32 * 1024 * 1024, 128 * N * r + 1024) };
}

export function verifyOwnerEmail(email) {
  const configured = requiredEnv('AMAZONITE_OWNER_EMAIL').trim().toLowerCase();
  return typeof email === 'string' && email.trim().toLowerCase() === configured;
}

export function verifyOwnerPassword(password) {
  const parts = requiredEnv('AMAZONITE_OWNER_PASSWORD_HASH').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nText, rText, pText, saltText, hashText] = parts;
  const N = Number(nText), r = Number(rText), p = Number(pText);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || N < 16384 || (N & (N - 1)) !== 0 || r < 1 || p < 1) return false;
  try {
    const expected = Buffer.from(hashText, 'base64url');
    const actual = scryptSync(password, Buffer.from(saltText, 'base64url'), expected.length, scryptOptions(N, r, p));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch { return false; }
}

function base32Decode(value) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = String(value || '').toUpperCase().replace(/=+$/g, '').replace(/\s+/g, '');
  let bits = 0, buffer = 0;
  const output = [];
  for (const char of clean) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error('Invalid TOTP secret');
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) { bits -= 8; output.push((buffer >> bits) & 0xff); }
  }
  return Buffer.from(output);
}

export function generateTotpSecret() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = randomBytes(20);
  let bits = 0, buffer = 0, result = '';
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte; bits += 8;
    while (bits >= 5) { bits -= 5; result += alphabet[(buffer >> bits) & 31]; }
  }
  if (bits > 0) result += alphabet[(buffer << (5 - bits)) & 31];
  return result;
}

export function buildTotpUri(secret, email = requiredEnv('AMAZONITE_OWNER_EMAIL')) {
  const issuer = 'Amazonite Electronic';
  return `otpauth://totp/${encodeURIComponent(`${issuer}:${email}`)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`;
}

export function verifyTotp(code, secret, nowMs = Date.now()) {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code) || typeof secret !== 'string' || !secret) return false;
  let key;
  try { key = base32Decode(secret); } catch { return false; }
  const counter = Math.floor(nowMs / 1000 / TOTP_STEP_SECONDS);
  for (const offset of [-1, 0, 1]) {
    const message = Buffer.alloc(8); message.writeBigUInt64BE(BigInt(counter + offset));
    const digest = createHmac('sha1', key).update(message).digest();
    const index = digest[digest.length - 1] & 0x0f;
    const binary = ((digest[index] & 0x7f) << 24) | (digest[index + 1] << 16) | (digest[index + 2] << 8) | digest[index + 3];
    const expected = String(binary % 1_000_000).padStart(6, '0');
    if (timingSafeEqual(Buffer.from(code), Buffer.from(expected))) return true;
  }
  return false;
}

export function createOwnerSession(now = Math.floor(Date.now() / 1000)) {
  const payload = Buffer.from(JSON.stringify({ sub: 'owner', amr: ['pwd', 'totp'], iat: now, exp: now + OWNER_SESSION_TTL_SECONDS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyOwnerSession(token, now = Math.floor(Date.now() / 1000)) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!payload || !signature) return false;
  const expected = sign(payload); const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data?.sub === 'owner' && Array.isArray(data.amr) && data.amr.includes('pwd') && data.amr.includes('totp') && Number.isInteger(data.exp) && data.exp > now;
  } catch { return false; }
}

export function getOwnerSessionFromRequest(request) {
  const cookieHeader = request?.headers?.get?.('cookie') ?? request?.headers?.cookie ?? '';
  const match = String(cookieHeader).match(new RegExp(`(?:^|;\\s*)${OWNER_SESSION_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

export function isOwnerRequest(request) {
  try { return verifyOwnerSession(getOwnerSessionFromRequest(request)); } catch { return false; }
}

export function buildOwnerCookie(token) {
  return `${OWNER_SESSION_COOKIE}=${token}; Max-Age=${OWNER_SESSION_TTL_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

export function clearOwnerCookie() {
  return `${OWNER_SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

export function generatePasswordHash(password, { N = 16384, r = 8, p = 1, keyLength = 64 } = {}) {
  const salt = randomBytes(16); const hash = scryptSync(password, salt, keyLength, scryptOptions(N, r, p));
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}
