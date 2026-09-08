import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

const password = 'test-owner-password';
const salt = 'test-salt';
const N = 16384;
const r = 8;
const p = 1;
const hash = crypto.scryptSync(password, salt, 32, { N, r, p }).toString('hex');
process.env.AMAZONITE_AUTH_SECRET = 'test-auth-secret-with-sufficient-entropy-for-unit-tests';
process.env.AMAZONITE_OWNER_PASSWORD_HASH = `scrypt$${N}$${r}$${p}$${salt}$${hash}`;
process.env.AMAZONITE_INTERNAL_API_TOKEN = 'test-internal-token';

const auth = await import('../lib/owner-auth.mjs');
const { default: middleware } = await import('../middleware.js');

const request = (path, headers = {}) => new Request(`https://example.test${path}`, { headers });
const ownerCookie = () => auth.ownerCookie(auth.createOwnerSession(Math.floor(Date.now() / 1000)));

async function run(path, headers = {}) {
  return middleware(request(path, headers));
}

test('blocks dashboard without owner session', async () => {
  const response = await run('/dashboard/');
  assert.equal(response.status, 302);
  assert.match(response.headers.get('location'), /\/owner-login\.html\?next=%2Fdashboard%2F?$/);
});

test('blocks admin with malformed owner cookie without throwing', async () => {
  const response = await run('/admin/index.html', { cookie: 'amazonite_owner_session=%E0%A4%A' });
  assert.equal(response.status, 302);
  assert.match(response.headers.get('location'), /\/owner-login\.html\?next=%2Fadmin%2Findex\.html$/);
});

test('blocks admin with tampered owner session', async () => {
  const token = auth.createOwnerSession(Math.floor(Date.now() / 1000));
  const dot = token.lastIndexOf('.');
  const signature = token.slice(dot + 1);
  const replacement = signature[0] === 'A' ? 'B' : 'A';
  const tampered = `${token.slice(0, dot + 1)}${replacement}${signature.slice(1)}`;
  const response = await run('/admin/index.html', { cookie: `amazonite_owner_session=${encodeURIComponent(tampered)}` });
  assert.equal(response.status, 302);
});

test('allows dashboard with a valid owner session', async () => {
  const response = await run('/dashboard/index.html', { cookie: ownerCookie() });
  assert.equal(response, undefined);
});

test('rejects MCP without internal token', async () => {
  const response = await run('/api/mcp');
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('rejects MCP with only the owner cookie', async () => {
  const response = await run('/api/mcp', { cookie: ownerCookie() });
  assert.equal(response.status, 401);
});

test('rejects MCP with a wrong internal token', async () => {
  const response = await run('/api/mcp', { 'x-amazonite-internal-token': 'wrong-token' });
  assert.equal(response.status, 401);
});

test('allows MCP with the configured internal token', async () => {
  const response = await run('/api/mcp', { 'x-amazonite-internal-token': process.env.AMAZONITE_INTERNAL_API_TOKEN });
  assert.equal(response, undefined);
});
