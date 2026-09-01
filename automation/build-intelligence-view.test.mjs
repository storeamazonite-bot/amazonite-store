import assert from 'node:assert/strict';
import { verifyAffiliateRecord } from './affiliate-verification.mjs';

const product = {
  id: 'TEST-001',
  name: 'Test Product',
  sourceProductUrl: 'https://www.aliexpress.com/item/123.html',
  orders: 501,
  rating: 4.6,
  commissionPercent: 8.1,
  available: true,
};

const missing = verifyAffiliateRecord(product);
assert.equal(missing.verified, false);
assert.equal(missing.reasons.includes('Affiliate URL is missing.'), true);

const verified = verifyAffiliateRecord({
  ...product,
  affiliateUrl: 'https://s.click.aliexpress.com/e/test',
  verifiedAt: '2026-09-01T00:00:00.000Z',
  source: 'AliExpress Affiliate portal',
});
assert.equal(verified.verified, true);
assert.equal(verified.record.commissionPercent, 8.1);

console.log('PASS: Intelligence view affiliate gate is fail-closed and accepts complete authoritative records.');
