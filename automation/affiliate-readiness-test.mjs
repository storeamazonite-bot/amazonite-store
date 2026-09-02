import assert from 'node:assert/strict';
import { evaluateAffiliateReadiness } from './affiliate-readiness.mjs';
import { evaluateProduct } from './product_intelligence.mjs';

const base = {
  orders: 501,
  rating: 4.51,
  commissionPercent: 8.01,
  affiliateUrl: 'https://example.com/affiliate',
  sourceUrl: 'https://www.aliexpress.com/item/example.html',
  available: true,
};

assert.equal(evaluateAffiliateReadiness(base).eligible, true);

for (const [field, value] of [['orders', 500], ['rating', 4.5], ['commissionPercent', 8]]) {
  assert.equal(
    evaluateAffiliateReadiness({ ...base, [field]: value }).eligible,
    false,
    `${field} boundary must fail`,
  );
}

assert.equal(evaluateAffiliateReadiness({ ...base, affiliateUrl: '' }).eligible, false);
assert.equal(evaluateAffiliateReadiness({ ...base, sourceUrl: '' }).eligible, false);
assert.equal(evaluateAffiliateReadiness({ ...base, available: false }).eligible, false);

const rejected = evaluateProduct({ ...base, commissionPercent: 8 }, {
  trendMomentum: 100,
  googleDemand: 100,
  marketEvidence: 100,
  reviewsRating: 100,
  affiliateCommission: 100,
  profitPotential: 100,
  competition: 100,
});
assert.equal(rejected.hardPass, false);
assert.equal(rejected.decision, 'reject');

const winner = evaluateProduct(base, {
  trendMomentum: 100,
  googleDemand: 100,
  marketEvidence: 100,
  reviewsRating: 100,
  affiliateCommission: 100,
  profitPotential: 100,
  competition: 100,
});
assert.equal(winner.hardPass, true);
assert.equal(winner.decision, 'winner');

console.log('PASS: Affiliate Readiness gate is enforced before Product Intelligence scoring.');
