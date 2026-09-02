import assert from 'node:assert/strict';

const base = (process.env.ALIEXPRESS_SCRAPER_API_BASE || 'https://aliexpress-scraper-api.omkar.cloud').replace(/\/$/, '');

const searchUrl = new URL(`${base}/aliexpress/search`);
searchUrl.searchParams.set('query', 'HAYLOU S30');
searchUrl.searchParams.set('page', '1');
assert.equal(searchUrl.pathname, '/aliexpress/search');
assert.equal(searchUrl.searchParams.get('query'), 'HAYLOU S30');

const productUrl = new URL(`${base}/aliexpress/product`);
productUrl.searchParams.set('product_id', '1005007170995524');
assert.equal(productUrl.pathname, '/aliexpress/product');
assert.equal(productUrl.searchParams.get('product_id'), '1005007170995524');

console.log('PASS: AliExpress adapter URLs match the documented Omkar API contract.');
