import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import handler from '../api/owner/settings.mjs';

const secret = 'test-secret';
const now = Math.floor(Date.now() / 1000);
process.env.AMAZONITE_AUTH_SECRET = secret;

function token() {
  const payload = Buffer.from(JSON.stringify({ sub: 'owner', iat: now - 10, exp: now + 3600 })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function responseMock() {
  const headers = {};
  return {
    headers,
    setHeader(name, value) { headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

const originalFetch = global.fetch;
const fakeStorage = {
  getSettings: async () => ({ storeName: 'Amazonite Store', visitorCta: '', description: '', markets: '' }),
  replaceSettings: async () => {},
};

async function run(request, storage = fakeStorage) {
  const module = await import('../lib/google-sheets-settings-store.mjs');
  module.getSettings = storage.getSettings;
  module.replaceSettings = storage.replaceSettings;
  const response = responseMock();
  await handler(request, response);
  return response;
}

test('unauthenticated GET is rejected before storage access', async () => {
  let touched = false;
  const response = await run({ method: 'GET', headers: {} }, { getSettings: async () => { touched = true; return {}; } });
  assert.equal(response.statusCode, 401);
  assert.equal(touched, false);
});

test('cross-origin PUT is rejected', async () => {
  let touched = false;
  const response = await run({ method: 'PUT', headers: { host: 'store.example', origin: 'https://evil.example', cookie: `amazonite_owner_session=${token()}` }, body: '{}' }, { replaceSettings: async () => { touched = true; } });
  assert.equal(response.statusCode, 403);
  assert.equal(touched, false);
});

test('oversized PUT is rejected', async () => {
  const response = await run({ method: 'PUT', headers: { host: 'store.example', origin: 'https://store.example', cookie: `amazonite_owner_session=${token()}` }, body: JSON.stringify({ storeName: 'x'.repeat(9000) }) });
  assert.equal(response.statusCode, 413);
});

test('invalid settings are rejected before storage', async () => {
  let touched = false;
  const response = await run({ method: 'PUT', headers: { host: 'store.example', origin: 'https://store.example', cookie: `amazonite_owner_session=${token()}` }, body: JSON.stringify({ storeName: '' }) }, { replaceSettings: async () => { touched = true; } });
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'invalid_storeName');
  assert.equal(touched, false);
});

test('authorized storage failure is generic', async () => {
  const response = await run({ method: 'GET', headers: { cookie: `amazonite_owner_session=${token()}` } }, { getSettings: async () => { throw new Error('private google details'); } });
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { ok: false, error: 'storage_unavailable' });
});

global.fetch = originalFetch;
