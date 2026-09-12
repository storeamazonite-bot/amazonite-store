import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const exists = relative => fs.existsSync(path.join(root, relative));
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const removedLegacyFiles = [
  'admin/editor.html',
  'admin/owner-editor.html',
  'assets/store-control.js',
  'assets/style.css',
  'assets/hero-bg.svg',
  'assets/store-data.js',
  'data/store-settings.json',
  'products/index.html',
  'categories/audio-tech.html',
  'categories/kitchen-everyday.html',
  'categories/smart-home.html',
  'customer-care.html',
  'disclosure.html',
  'reviews/haylou-s30.html'
];

for (const file of removedLegacyFiles) {
  assert.equal(exists(file), false, `legacy artifact must remain absent: ${file}`);
}

// Scan the public storefront/runtime surface. The protected admin/dashboard UIs are
// intentionally excluded because they have their own current design system and data layer.
const scanRoots = ['index.html', 'wishlist.html', 'assets', 'categories', 'products', 'reviews', 'customer-care.html', 'disclosure.html', 'data', 'lib', 'middleware.js', 'owner-login.html', 'vercel.json'];
const skipDirs = new Set(['.git', 'node_modules']);
const textExtensions = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg']);
const legacyMarkers = [
  /Amazonite Store/,
  /Amazonit Electronic/,
  /amazonite_owner_config_v1/,
  /amazonite-premium-ui/,
  /function injectStyle\(/,
  /function buildBrand\(/,
  /AMAZONITE_STORE_DATA/,
  /--accent:#5cff3b/,
  /site-header/,
  /assets\/store-control\.js/
];

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (textExtensions.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

const files = [];
for (const target of scanRoots) {
  const full = path.join(root, target);
  if (fs.existsSync(full) && fs.statSync(full).isDirectory()) files.push(...walk(full));
  else if (fs.existsSync(full) && textExtensions.has(path.extname(target).toLowerCase())) files.push(full);
}

for (const file of new Set(files)) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const source = fs.readFileSync(file, 'utf8');
  for (const marker of legacyMarkers) {
    assert.doesNotMatch(source, marker, `legacy template marker found in ${relative}`);
  }
}

const storefront = read('index.html');
assert.match(storefront, /<title>Amazonite Electronic — Top Electronics\. Unbeatable Prices\.<\/title>/);
assert.match(storefront, /TOP ELECTRONICS\.<br><span>UNBEATABLE PRICES\.<\/span>/);
assert.match(storefront, /assets\/affiliate-tracker\.js/);
assert.match(storefront, /assets\/wishlist\.js/);

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
console.log(`Checked ${removedLegacyFiles.length} removed legacy artifacts and scanned ${new Set(files).size} public storefront/runtime files.`);