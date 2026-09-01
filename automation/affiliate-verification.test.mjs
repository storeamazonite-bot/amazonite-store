import assert from 'node:assert/strict';
import { verifyAffiliateRecord } from './affiliate-verification.mjs';

const base = {
  productId: '123',
  productName: 'Test product',
  sourceProductUrl: 'https://www.aliexpress.com/item/123.html',
  affiliateUrl: 'https://s.click.aliexpress.com/e/test',
  commissionPercent: 8.01,
  verifiedAt: '2026-09-01T00:00:00.000Z',
  source: 'AliExpress Affiliate portal',
};

assert.equal(verifyAffiliateRecord(base).verified, true);
assert.equal(verifyAffiliateRecord({ ...base, affiliateUrl: '' }).verified, false);
assert.equal(verifyAffiliateRecord({ ...base, commissionPercent: null }).verified, false);
assert.equal(verifyAffiliateRecord({ ...base, source: '' }).verified, false);

console.log('PASS: Affiliate verification fails closed when required evidence is missing.');
