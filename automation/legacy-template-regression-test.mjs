import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const exists = relative => fs.existsSync(path.join(root, relative));
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const removedLegacyFiles = [
  'admin/editor.html',
  'admin/owner-editor.html',
  'assets/store-control.js'
];

for (const file of removedLegacyFiles) {
  assert.equal(exists(file), false, `legacy artifact must remain absent: ${file}`);
}

const storefront = read('index.html');
assert.match(storefront, /<title>Amazonite Electronic — Top Electronics\. Unbeatable Prices\.<\/title>/);
assert.match(storefront, /TOP ELECTRONICS\.<br><span>UNBEATABLE PRICES\.<\/span>/);
assert.doesNotMatch(storefront, /Amazonite Store/);
assert.doesNotMatch(storefront, /Amazonit Electronic/);

const middleware = read('middleware.js');
assert.match(middleware, /matcher:\s*\['\/admin\/:path\*',\s*'\/dashboard\/:path\*'\]/);
assert.match(middleware, /amazonite_owner_session/);

const vercel = read('vercel.json');
assert.match(vercel, /Strict-Transport-Security/);
assert.match(vercel, /X-Frame-Options/);

const ownerLogin = read('owner-login.html');
assert.match(ownerLogin, /api\/owner-login/);
assert.match(ownerLogin, /Authenticator code/);

console.log('Legacy template regression: PASS');
console.log(`Checked ${removedLegacyFiles.length} removed legacy artifacts plus storefront, middleware, Vercel security headers, and owner login.`);
