import assert from 'node:assert/strict';

// Static security contract test for api/aliexpress-search.js.
// This test never needs the real Vercel secrets and never calls Omkar.
const fs = await import('node:fs/promises');
const source = await fs.readFile(new URL('../api/aliexpress-search.js', import.meta.url), 'utf8');

assert.match(source, /process\.env\.AMAZONITE_INTERNAL_API_TOKEN/);
assert.match(source, /req\.headers\[['"]x-amazonite-internal-token['"]\]/);
assert.match(source, /status\(401\)/);
assert.match(source, /process\.env\.ALIEXPRESS_SCRAPER_API_KEY/);
assert.match(source, /['"]API-Key['"]\s*:\s*apiKey/);
assert.match(source, /\/aliexpress\/v2\/search/);
assert.doesNotMatch(source, /NEXT_PUBLIC_ALIEXPRESS_SCRAPER_API_KEY/);

console.log('PASS: Vercel AliExpress proxy keeps secrets server-side and requires the internal token.');
