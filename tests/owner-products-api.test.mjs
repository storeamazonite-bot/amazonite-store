import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

process.env.AMAZONITE_AUTH_SECRET = 'test-auth-secret-with-sufficient-entropy-for-unit-tests';
process.env.AMAZONITE_OWNER_PASSWORD_HASH = 'scrypt$16384$8$1$test-salt$' + crypto.scryptSync('test-owner-password', 'test-salt', 32, { N: 16384, r: 8, p: 1 }).toString('hex');
process.env.GOOGLE_SHEETS_SPREADSHEET_ID = 'test-sheet';
process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: 'test@example.invalid', private_key: '-----BEGIN PRIVATE KEY-----\ninvalid\n-----END PRIVATE KEY-----' });

const { createOwnerSession, ownerCookie } = await import('../lib/owner-auth.mjs');
const { default: handler } = await import('../api/owner/products.mjs');

function responseMock() {
  const headers = {};
  return {
    headers,
    statusCode: 200,
    body: undefined,
    setHeader(name, value) { headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

const validCookie = ownerCookie(createOwnerSession(1_700_000_000));

test('rejects unauthenticated product reads before storage access', async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error('storage should not be reached'); };
  try {
    const response = responseMock();
    await handler({ method: 'GET', headers: { host: 'example.test' } }, response);
    assert.equal(response.statusCode, 401);
    assert.equal(response.body.error, 'unauthorized');
    assert.equal(called, false);
  } finally { globalThis.fetch = originalFetch; }
});

test('rejects cross-origin mutation before storage access', async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error('storage should not be reached'); };
  try {
    const response = responseMock();
    await handler({ method: 'POST', headers: { host: 'example.test', origin: 'https://evil.example' }, body: '{}' }, response);
    assert.equal(response.statusCode, 403);
    assert.equal(response.body.error, 'origin_not_allowed');
    assert.equal(called, false);
  } finally { globalThis.fetch = originalFetch; }
});

test('valid owner session reaches server-side storage and does not expose storage errors', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('simulated storage failure'); };
  try {
    const response = responseMock();
    await handler({ method: 'GET', headers: { host: 'example.test', cookie: validCookie } }, response);
    assert.equal(response.statusCode, 503);
    assert.deepEqual(response.body, { ok: false, error: 'storage_unavailable' });
  } finally { globalThis.fetch = originalFetch; }
});
