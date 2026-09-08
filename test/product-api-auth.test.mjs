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
    end(value = '') { this.body = value; }
  };
}

test('product API module exists', async () => {
  const { default: handler } = await import('../api/admin/products.mjs');
  assert.equal(typeof handler, 'function');
});

test('product API rejects requests without an owner session', async () => {
  const { default: handler } = await import('../api/admin/products.mjs');
  const response = responseStub();
  await handler({ method: 'GET', headers: {} }, response);
  assert.equal(response.statusCode, 401);
  assert.deepEqual(JSON.parse(response.body), { ok: false, error: 'Unauthorized' });
});

test('product API rejects unauthenticated deletion before touching storage', async () => {
  const { default: handler } = await import('../api/admin/products.mjs');
  const response = responseStub();
  await handler({ method: 'DELETE', query: { id: 'AE-001' }, headers: {} }, response);
  assert.equal(response.statusCode, 401);
  assert.deepEqual(JSON.parse(response.body), { ok: false, error: 'Unauthorized' });
});

test('product API accepts a valid owner session for catalog reads', async () => {
  const { default: handler } = await import('../api/admin/products.mjs');
  const response = responseStub();
  const token = createOwnerSession();
  await handler({ method: 'GET', headers: { cookie: `amazonite_owner_session=${token}` } }, response);
  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.equal(body.ok, true);
  assert.ok(Array.isArray(body.products));
});
