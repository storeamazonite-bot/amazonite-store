import test from 'node:test';
import assert from 'node:assert/strict';
import { createOwnerSession } from '../lib/owner-auth.mjs';

process.env.AMAZONITE_AUTH_SECRET = 'test-auth-secret';

test('product API module exists and owner sessions are usable by the API boundary', async () => {
  const { default: handler } = await import('../api/admin/products.mjs');
  assert.equal(typeof handler, 'function');
  const token = createOwnerSession();
  assert.match(token, /^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$/);
});
