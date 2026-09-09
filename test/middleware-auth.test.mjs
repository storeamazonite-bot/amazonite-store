import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createOwnerSession } from '../lib/owner-auth.mjs';
import middleware from '../middleware.js';

const SECRET = 'middleware-test-secret';
process.env.AMAZONITE_AUTH_SECRET = SECRET;

function tokenFor(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function requestFor(path, token) {
  const headers = new Headers();
  if (token) headers.set('cookie', `amazonite_owner_session=${token}`);
  return new Request(`https://example.test${path}`, { headers });
}

test('middleware accepts a session with password + TOTP assurance', async () => {
  const response = await middleware(requestFor('/admin/products.html', createOwnerSession()));
  assert.equal(response, undefined);
});

test('middleware rejects a signed owner token without TOTP assurance', async () => {
  const token = tokenFor({ sub: 'owner', amr: ['pwd'], iat: 1, exp: Math.floor(Date.now() / 1000) + 3600 });
  const response = await middleware(requestFor('/admin/products.html', token));
  assert.equal(response.status, 307);
  assert.match(response.headers.get('location'), /\/owner-login\.html\?next=%2Fadmin%2Fproducts\.html/);
});

test('middleware rejects a signed owner token without password assurance', async () => {
  const token = tokenFor({ sub: 'owner', amr: ['totp'], iat: 1, exp: Math.floor(Date.now() / 1000) + 3600 });
  const response = await middleware(requestFor('/dashboard/index.html', token));
  assert.equal(response.status, 307);
  assert.match(response.headers.get('location'), /\/owner-login\.html\?next=%2Fdashboard%2Findex\.html/);
});

test('middleware rejects expired sessions', async () => {
  const token = tokenFor({ sub: 'owner', amr: ['pwd', 'totp'], iat: 1, exp: Math.floor(Date.now() / 1000) - 1 });
  const response = await middleware(requestFor('/admin/products.html', token));
  assert.equal(response.status, 307);
});
