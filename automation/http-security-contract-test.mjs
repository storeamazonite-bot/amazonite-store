import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const security = read('lib/http-security.js');
const login = read('api/auth/login.js');
const products = read('api/products/index.js');
const productById = read('api/products/[id].js');

assert.match(security, /X-Content-Type-Options/);
assert.match(security, /X-Frame-Options/);
assert.match(security, /Referrer-Policy/);
assert.match(security, /Permissions-Policy/);
assert.match(security, /Content-Security-Policy/);
assert.match(security, /Cache-Control/);
assert.match(security, /enforceSameOrigin/);
assert.match(security, /Cross-origin request rejected/);
assert.doesNotMatch(security, /Access-Control-Allow-Origin['"]?\s*[:=]\s*['"]\*['"]/i);
assert.match(security, /rateLimit/);
assert.match(security, /status\(429\)/);
assert.match(security, /Retry-After/);
assert.match(login, /setSecurityHeaders\(res, \{ noStore: true \}\)/);
assert.match(login, /enforceSameOrigin\(req, res\)/);
assert.match(login, /rateLimit\(req, res, \{ limit: 10, prefix: ['"]login['"] \}\)/);
assert.match(login, /scope: ['"]local['"]/);
assert.match(products, /requireOwner\(req, res\)/);
assert.match(productById, /requireOwner\(req, res\)/);

console.log('HTTP security contract: PASS');
console.log('Covered: security headers, same-origin CSRF rejection, 429 rate limiting, Retry-After, local non-owner signout.');
console.log('Note: rate limiting is best-effort per serverless instance until distributed runtime storage is wired.');
