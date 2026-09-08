import assert from 'node:assert/strict';
import test from 'node:test';

process.env.AMAZONITE_AUTH_SECRET = 'test-auth-secret-with-sufficient-entropy-for-unit-tests';
process.env.AMAZONITE_OWNER_PASSWORD_HASH = 'scrypt$16384$8$1$test-salt$' + '00'.repeat(32);

const { default: login } = await import('../api/auth/login.mjs');
const { default: logout } = await import('../api/auth/logout.mjs');

function responseMock() {
  const headers = {};
  return {
    headers,
    statusCode: 200,
    body: undefined,
    setHeader(name, value) { headers[name.toLowerCase()] = value; return this; },
    set(headersToSet) { for (const [name, value] of Object.entries(headersToSet)) headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('login rejects missing Origin before credential processing', async () => {
  const response = responseMock();
  await login({ method: 'POST', headers: { host: 'store.example' }, body: JSON.stringify({ password: 'wrong' }) }, response);
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error, 'origin_not_allowed');
});

test('logout rejects missing Origin before session processing', async () => {
  const response = responseMock();
  await logout({ method: 'POST', headers: { host: 'store.example' } }, response);
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error, 'origin_not_allowed');
});
