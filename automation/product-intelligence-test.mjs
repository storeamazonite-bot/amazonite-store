import assert from 'node:assert/strict';
import { calculateWinningScore, decisionForScore, eligibility, evaluateProduct } from './product_intelligence.mjs';

const base = {
  orders: 501,
  rating: 4.51,
  commissionPercent: 8.01,
  affiliateUrl: 'https://example.com/affiliate',
  available: true,
};

const checks = eligibility(base);
assert.deepEqual(checks, {
  orders: true,
  rating: true,
  commission: true,
  affiliateUrl: true,
  available: true,
});

for (const [field, value] of [['orders', 500], ['rating', 4.5], ['commissionPercent', 8]]) {
  const product = { ...base, [field]: value };
  assert.equal(eligibility(product)[field === 'commissionPercent' ? 'commission' : field], false, `${field} boundary must fail`);
}

assert.equal(eligibility({ ...base, commissionRate: 8.01 }).commission, true, 'commissionRate alias must pass');
assert.equal(eligibility({ ...base, affiliateUrl: '' }).affiliateUrl, false);
assert.equal(eligibility({ ...base, available: false }).available, false);
assert.equal(eligibility({ ...base, stock: 0 }).available, false);

assert.equal(calculateWinningScore({ trendMomentum: 100, googleDemand: 100, marketEvidence: 100, reviewsRating: 100, affiliateCommission: 100, profitPotential: 100, competition: 100 }), 100);
assert.equal(decisionForScore(85), 'winner');
assert.equal(decisionForScore(75), 'strong');
assert.equal(decisionForScore(65), 'test');
assert.equal(decisionForScore(64.9), 'reject');

const evaluated = evaluateProduct(base, {
  trendMomentum: 100,
  googleDemand: 100,
  marketEvidence: 100,
  reviewsRating: 100,
  affiliateCommission: 100,
  profitPotential: 100,
  competition: 100,
});
assert.equal(evaluated.hardPass, true);
assert.equal(evaluated.decision, 'winner');

console.log('PASS: Product Intelligence hard gates, aliases, score bands, and fail-closed decisions validated.');
