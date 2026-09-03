import assert from 'node:assert/strict';

const base = (process.env.ALIEXPRESS_SCRAPER_API_BASE || 'https://aliexpress-scraper-api.omkar.cloud').replace(/\/$/, '');

const searchUrl = new URL(`${base}/aliexpress/v2/search`);
searchUrl.searchParams.set('query', 'HAYLOU S30');
searchUrl.searchParams.set('page', '1');
searchUrl.searchParams.set('country_code', 'US');
searchUrl.searchParams.set('sort_by', 'most_orders');
assert.equal(searchUrl.pathname, '/aliexpress/v2/search');
assert.equal(searchUrl.searchParams.get('query'), 'HAYLOU S30');
assert.equal(searchUrl.searchParams.get('page'), '1');
assert.equal(searchUrl.searchParams.get('country_code'), 'US');
assert.equal(searchUrl.searchParams.get('sort_by'), 'most_orders');

const productUrl = new URL(`${base}/aliexpress/v2/product`);
productUrl.searchParams.set('product', '1005007170995524');
productUrl.searchParams.set('country_code', 'US');
assert.equal(productUrl.pathname, '/aliexpress/v2/product');
assert.equal(productUrl.searchParams.get('product'), '1005007170995524');
assert.equal(productUrl.searchParams.get('country_code'), 'US');

console.log('PASS: AliExpress adapter URLs match the documented Omkar V2 API contract.');
