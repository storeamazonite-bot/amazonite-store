import assert from 'node:assert/strict';
import { buildIntelligenceView } from './build-intelligence-view.mjs';

const catalog = { products: [] };
const staging = {
  results: [{
    id: 'TEST-001',
    name: 'Test discovery product',
    sourceProductUrl: 'https://www.aliexpress.com/item/TEST-001.html',
    orders: 1000,
    rating: 4.8,
    commissionPercent: 12,
    available: true,
  }],
};

const view = buildIntelligenceView(catalog, staging, []);
const item = view.items[0];

assert.equal(view.summary.total, 1);
assert.equal(view.summary.discovered, 1);
assert.equal(view.summary.blocked, 1);
assert.equal(view.summary.publishable, 0);
assert.equal(item.origin, 'discovery-staging');
assert.equal(item.publicationStatus, 'blocked');
assert.equal(item.affiliateVerification.verified, false);
assert.equal(item.intelligence.checks.orders, true);
assert.equal(item.intelligence.checks.rating, true);
assert.equal(item.intelligence.checks.commission, true);
assert.equal(item.intelligence.checks.affiliateUrl, false);

console.log('PASS: Discovery staging remains blocked without exact Affiliate verification.');
