import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

const password = 'test-owner-password';
const salt = 'test-salt';
const N = 16384;
const r = 8;
const p = 1;
const hash = crypto.scryptSync(password, salt, 32, { N, r, p }).toString('hex');
process.env.AMAZONITE_AUTH_SECRET = 'test-auth-secret-with-sufficient-entropy-for-unit-tests';
process.env.AMAZONITE_OWNER_PASSWORD_HASH = `scrypt$${N}$${r}$${p}$${salt}$${hash}`;

const auth = await import('../lib/owner-auth.mjs');

test('accepts the configured owner password and rejects a wrong password', () => {
  assert.equal(auth.verifyOwnerPassword(password), true);
  assert.equal(auth.verifyOwnerPassword('wrong-password'), false);
});

test('creates a valid owner session', () => {
  const token = auth.createOwnerSession(1_700_000_000);
  assert.equal(auth.verifyOwnerSession(token, 1_700_000_001), true);
});

test('rejects a tampered session', () => {
  const token = auth.createOwnerSession(1_700_000_000);
  const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;
  assert.equal(auth.verifyOwnerSession(tampered, 1_700_000_001), false);
});

test('rejects an expired session', () => {
  const token = auth.createOwnerSession(1_700_000_000);
  assert.equal(auth.verifyOwnerSession(token, 1_700_000_000 + auth.OWNER_SESSION_TTL_SECONDS + 1), false);
});

test('owner cookie is HttpOnly, Secure and SameSite=Strict', () => {
  const cookie = auth.ownerCookie('token');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
});

test('malformed owner cookie does not throw and is rejected', () => {
  const request = { headers: { cookie: 'amazonite_owner_session=%E0%A4%A' } };
  assert.doesNotThrow(() => auth.isOwnerRequest(request));
  assert.equal(auth.isOwnerRequest(request), false);
});

test('missing auth secret fails closed without throwing', () => {
  const token = auth.createOwnerSession(1_700_000_000);
  const previous = process.env.AMAZONITE_AUTH_SECRET;
  delete process.env.AMAZONITE_AUTH_SECRET;
  try {
    const request = { headers: { cookie: `amazonite_owner_session=${encodeURIComponent(token)}` } };
    assert.doesNotThrow(() => auth.isOwnerRequest(request));
    assert.equal(auth.isOwnerRequest(request), false);
  } finally {
    process.env.AMAZONITE_AUTH_SECRET = previous;
  }
});
