import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import handler from '../api/owner/settings.mjs';

const secret = 'test-secret';
const now = Math.floor(Date.now() / 1000);
process.env.AMAZONITE_AUTH_SECRET = secret;
delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

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

async function run(request) {
  const response = responseMock();
  await handler(request, response);
  return response;
}

const ownerHeaders = { host: 'store.example', origin: 'https://store.example', cookie: `amazonite_owner_session=${token()}` };

test('unauthenticated GET is rejected', async () => {
  const response = await run({ method: 'GET', headers: {} });
  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { ok: false, error: 'unauthorized' });
});

test('cross-origin PUT is rejected before storage', async () => {
  const response = await run({ method: 'PUT', headers: { ...ownerHeaders, origin: 'https://evil.example' }, body: '{}' });
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error, 'origin_not_allowed');
});

test('oversized PUT is rejected', async () => {
  const response = await run({ method: 'PUT', headers: ownerHeaders, body: JSON.stringify({ storeName: 'x'.repeat(15000) }) });
  assert.equal(response.statusCode, 413);
  assert.equal(response.body.error, 'body_too_large');
});

test('invalid settings are rejected before storage', async () => {
  const response = await run({ method: 'PUT', headers: ownerHeaders, body: JSON.stringify({ storeName: '' }) });
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'invalid_storeName');
});

test('full owner editor settings pass validation before storage', async () => {
  const settings = {
    storeName: 'Amazonite Electronic', currency: 'USD', seoTitle: 'Amazonite Electronic', seoDescription: 'Tech picks', disclosure: 'Affiliate disclosure',
    heroTag: 'BEST SELLER', heroTitle: 'Picun F8 Pro', heroHighlight: 'Immersive sound', heroText: 'Discover selected electronics.', heroCta: 'Shop now',
    heroUrl: '#products', heroImage: 'assets/hero.webp', heroVideo: '',
  };
  const response = await run({ method: 'PUT', headers: ownerHeaders, body: JSON.stringify(settings) });
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { ok: false, error: 'storage_unavailable' });
});

test('authorized GET fails generically when storage is not configured', async () => {
  const response = await run({ method: 'GET', headers: { cookie: `amazonite_owner_session=${token()}` } });
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { ok: false, error: 'storage_unavailable' });
});

test('owner editor has no localStorage persistence path', async () => {
  const editor = await fs.readFile(new URL('../admin/editor.html', import.meta.url), 'utf8');
  assert.doesNotMatch(editor, /localStorage/i);
  assert.match(editor, /\.\.\/api\/owner\/settings/);
  assert.match(editor, /\.\.\/api\/owner\/products/);
});
