import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync('index.html', 'utf8');

// The latest user-supplied dashboard structure is authoritative.
for (const marker of [
  'id="loginPage"',
  'id="loginForm"',
  'id="loginUser"',
  'id="loginPass"',
  'id="loginError"',
  'id="dashboardPage"',
  'id="logoutBtn"',
  'id="account-settings"',
  'id="accountForm"',
  'id="username"',
  'id="password"',
  'id="email"',
  'id="language"',
  'class="products"',
  'class="product"',
  'class="buy-btn"',
]) assert.ok(html.includes(marker), `Missing latest dashboard marker: ${marker}`);

// Auth is server-backed and uses the existing visual controls; no client-side credentials are stored.
for (const marker of [
  '/api/auth/session',
  '/api/auth/login',
  '/api/auth/logout',
  "method: 'POST'",
  "credentials: 'include'",
]) assert.ok(html.includes(marker), `Missing secure auth integration marker: ${marker}`);

assert.doesNotMatch(html, /AMZ-OWNER-2026/);
assert.doesNotMatch(html, /localStorage\s*\./);
assert.doesNotMatch(html, /localStorage\s*\[/);
assert.doesNotMatch(html, /password\s*[:=]\s*['"][^'"]+['"]/i);
assert.match(html, /\/api\/auth\/logout/);
assert.match(html, /\/api\/auth\/session/);
assert.match(html, /\/api\/auth\/login/);

console.log('Dashboard integration contract: PASS');
console.log('Covered: latest login/dashboard/account structure, server-backed owner auth/session/logout, credentials-in-cookie flow, no localStorage credentials, no hardcoded owner password.');
