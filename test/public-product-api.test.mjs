import test from 'node:test';
import assert from 'node:assert/strict';

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

test('public product API exposes only active public fields', async () => {
  const { default: handler } = await import('../api/products.mjs');
  const response = responseStub();
  await handler({ method: 'GET', query: { status: 'active' }, headers: {} }, response);
  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.equal(body.ok, true);
  assert.ok(Array.isArray(body.products));
  for (const product of body.products) {
    assert.equal(typeof product.id, 'string');
    assert.ok(!Object.hasOwn(product, 'notes'));
    assert.ok(!Object.hasOwn(product, 'commissionRate'));
    assert.ok(!Object.hasOwn(product, 'intelligence'));
  }
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
});

test('public product API protects non-public catalog reads and mutations', async () => {
  const { default: handler } = await import('../api/products.mjs');
  const responseAll = responseStub();
  await handler({ method: 'GET', query: { status: 'all' }, headers: {} }, responseAll);
  assert.equal(responseAll.statusCode, 401);

  const responsePost = responseStub();
  await handler({ method: 'POST', headers: {}, body: {} }, responsePost);
  assert.equal(responsePost.statusCode, 401);
});

test('protected product id route rejects unauthenticated mutation attempts', async () => {
  const { default: handler } = await import('../api/products/[id].mjs');
  const response = responseStub();
  await handler({ method: 'DELETE', query: { id: 'AE-001' }, headers: {} }, response);
  assert.equal(response.statusCode, 401);
});
