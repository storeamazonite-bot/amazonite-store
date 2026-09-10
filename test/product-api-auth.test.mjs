import test from 'node:test';
import assert from 'node:assert/strict';
import { createOwnerSession } from '../lib/owner-auth.mjs';
import { validateProductInput } from '../api/admin/products.mjs';

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

test('product API accepts a valid owner session for catalog reads', async () => {
  const { default: handler } = await import('../api/admin/products.mjs');
  const response = responseStub();
  const token = createOwnerSession();
  await handler({ method: 'GET', headers: { cookie: `amazonite_owner_session=${token}` } }, response);
  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.equal(body.ok, true);
  assert.ok(Array.isArray(body.products));
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
});

test('product validation rejects non-AliExpress affiliate URLs, missing affiliate URLs, and unsafe numeric values', () => {
  const base = { name:'Test Gadget', category:'technology', status:'Draft', affiliateUrl:'https://www.aliexpress.com/item/123', price:49.99, currency:'USD', rating:4.8, orders:500, market:'US', imageUrl:'https://cdn.example.com/item.webp' };
  assert.equal(validateProductInput({...base, affiliateUrl:'javascript:alert(1)'}), 'Invalid AliExpress affiliate URL');
  assert.equal(validateProductInput({...base, affiliateUrl:null}), 'Invalid AliExpress affiliate URL');
  assert.equal(validateProductInput({...base, rating:6}), 'Invalid rating');
  assert.equal(validateProductInput({...base, orders:1.5}), 'Invalid orders');
});

test('product validation accepts a bounded owner product payload', () => {
  const payload = { name:'Test Gadget', category:'technology', status:'Draft', affiliateUrl:'https://www.aliexpress.com/item/123', sourceProductUrl:'https://www.aliexpress.com/item/123', price:49.99, currency:'USD', commissionRate:8, rating:4.8, orders:500, market:'US', imageUrl:'https://cdn.example.com/item.webp', notes:'test' };
  assert.equal(validateProductInput(payload), null);
});
