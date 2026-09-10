import test from 'node:test';
import assert from 'node:assert/strict';
import { createOwnerSession } from '../lib/owner-auth.mjs';

process.env.AMAZONITE_AUTH_SECRET = 'test-auth-secret';

function responseStub() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = JSON.stringify(value); return this; },
    end(value = '') { this.body = value; }
  };
}

const ownerHeaders = () => ({ cookie: `amazonite_owner_session=${createOwnerSession()}` });
const sameOriginHeaders = () => ({ ...ownerHeaders(), origin: 'https://example.com', host: 'example.com' });
const crossOriginHeaders = () => ({ ...ownerHeaders(), origin: 'https://evil.example', host: 'example.com' });

test('admin product POST rejects cross-origin owner request', async () => {
  const { default: handler } = await import('../api/admin/products.mjs');
  const response = responseStub();
  await handler({ method: 'POST', headers: crossOriginHeaders(), body: {} }, response);
  assert.equal(response.statusCode, 403);
  assert.equal(JSON.parse(response.body).error, 'cross_origin_request');
});

test('storefront product POST rejects cross-origin owner request', async () => {
  const { default: handler } = await import('../api/products.mjs');
  const response = responseStub();
  await handler({ method: 'POST', headers: crossOriginHeaders(), body: {} }, response);
  assert.equal(response.statusCode, 403);
  assert.equal(JSON.parse(response.body).error, 'cross_origin_request');
});

test('product mutation route rejects cross-origin owner request before storage', async () => {
  const { default: handler } = await import('../api/products/[id].mjs');
  const response = responseStub();
  await handler({ method: 'DELETE', query: { id: 'demo' }, headers: crossOriginHeaders() }, response);
  assert.equal(response.statusCode, 403);
  assert.equal(JSON.parse(response.body).error, 'cross_origin_request');
});

test('owner logout rejects cross-origin request', async () => {
  const { default: handler } = await import('../api/auth/logout.mjs');
  const response = responseStub();
  await handler({ method: 'POST', headers: crossOriginHeaders() }, response);
  assert.equal(response.statusCode, 403);
  assert.equal(JSON.parse(response.body).error, 'cross_origin_request');
});

test('owner login rejects cross-origin request', async () => {
  const { default: handler } = await import('../api/auth/login.mjs');
  const response = responseStub();
  await handler({ method: 'POST', headers: crossOriginHeaders(), body: {} }, response);
  assert.equal(response.statusCode, 403);
  assert.equal(JSON.parse(response.body).error, 'cross_origin_request');
});

test('owner 2FA setup rejects cross-origin request', async () => {
  const { default: handler } = await import('../api/auth/setup.mjs');
  const response = responseStub();
  await handler({ method: 'POST', headers: crossOriginHeaders(), body: {} }, response);
  assert.equal(response.statusCode, 403);
  assert.equal(JSON.parse(response.body).error, 'cross_origin_request');
});

test('owner logout accepts a same-origin request', async () => {
  const { default: handler } = await import('../api/auth/logout.mjs');
  const response = responseStub();
  await handler({ method: 'POST', headers: sameOriginHeaders() }, response);
  assert.equal(response.statusCode, 200);
  assert.match(response.headers['set-cookie'], /Max-Age=0/);
});
