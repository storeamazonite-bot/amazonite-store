import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync('index.html', 'utf8');

// Original storefront/dashboard structure must remain present.
for (const marker of [
  'id="products"',
  'id="grid"',
  'id="adminLauncher"',
  'id="adminPanel"',
  'id="productForm"',
  'id="adminList"',
  'id="adminCount"',
  'class="card"',
  'class="buy"',
  'class="hero"',
]) assert.ok(html.includes(marker), `Missing original/dashboard marker: ${marker}`);

// Dashboard data/auth must use server APIs rather than client-side credentials/data storage.
for (const marker of [
  '/api/auth/session',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/products?status=active',
  '/api/products?status=all',
  'method:\'POST\'',
  'method:\'PUT\'',
  'method:\'DELETE\'',
]) assert.ok(html.includes(marker), `Missing secure integration marker: ${marker}`);

assert.doesNotMatch(html, /AMZ-OWNER-2026/);
assert.doesNotMatch(html, /localStorage\s*\./);
assert.doesNotMatch(html, /localStorage\s*\[/);
assert.doesNotMatch(html, /password\s*[:=]\s*['"][^'"]+['"]/i);
assert.match(html, /credentials:\s*['"]include['"]/);
assert.match(html, /data-buy-id/);
assert.match(html, /affiliate_url/);
assert.match(html, /id="adminLogout"/);
assert.match(html, /<button[^>]+id="adminLogout"[^>]*>تسجيل الخروج<\/button>/);
assert.match(html, /id="adminClose"/);
assert.match(html, /adminLogout/);
assert.match(html, /\/api\/auth\/logout/);

console.log('Dashboard integration contract: PASS');
console.log('Covered: original storefront/dashboard markers, API-backed auth/products/logout, visible logout control, preserved close control, no localStorage credentials/data source, no hardcoded owner password.');
