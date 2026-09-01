const DEFAULT_WEIGHTS = Object.freeze({
  trendMomentum: 20,
  googleDemand: 20,
  marketEvidence: 20,
  reviewsRating: 10,
  affiliateCommission: 15,
  profitPotential: 10,
  competition: 5,
});

const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

export function calculateWinningScore(signals = {}, weights = DEFAULT_WEIGHTS) {
  const score =
    clamp(signals.trendMomentum) * weights.trendMomentum / 100 +
    clamp(signals.googleDemand) * weights.googleDemand / 100 +
    clamp(signals.marketEvidence) * weights.marketEvidence / 100 +
    clamp(signals.reviewsRating) * weights.reviewsRating / 100 +
    clamp(signals.affiliateCommission) * weights.affiliateCommission / 100 +
    clamp(signals.profitPotential) * weights.profitPotential / 100 +
    clamp(signals.competition) * weights.competition / 100;

  return Math.round(score * 10) / 10;
}

export function decisionForScore(score) {
  if (score >= 85) return 'winner';
  if (score >= 75) return 'strong';
  if (score >= 65) return 'test';
  return 'reject';
}

export function eligibility(product = {}, limits = {}) {
  const minOrders = Number(limits.minOrders ?? process.env.MIN_ORDERS ?? 500);
  const minRating = Number(limits.minRating ?? process.env.MIN_RATING ?? 4.5);
  const minCommission = Number(limits.minCommissionPercent ?? process.env.MIN_COMMISSION_PERCENT ?? 8);
  const orders = Number(product.orders ?? product.orderCount ?? product.sold ?? 0);
  const rating = Number(product.rating ?? product.averageRating ?? 0);
  const commission = Number(product.commissionPercent ?? product.commission_rate ?? product.commission ?? 0);

  return {
    orders: orders > minOrders,
    rating: rating > minRating,
    commission: commission > minCommission,
    affiliateUrl: Boolean(product.affiliateUrl),
    available: product.available !== false && product.stock !== 0,
  };
}

export function evaluateProduct(product = {}, signals = {}, limits = {}) {
  const checks = eligibility(product, limits);
  const score = calculateWinningScore(signals);
  const decision = decisionForScore(score);
  const hardPass = checks.orders && checks.rating && checks.commission && checks.affiliateUrl && checks.available;

  return {
    score,
    decision: hardPass ? decision : 'reject',
    hardPass,
    checks,
    signals: Object.fromEntries(Object.entries(signals).map(([key, value]) => [key, clamp(value)])),
    reasons: [
      !checks.orders && 'Orders do not exceed the minimum threshold.',
      !checks.rating && 'Rating does not exceed the minimum threshold.',
      !checks.commission && 'Commission does not exceed the minimum threshold.',
      !checks.affiliateUrl && 'Product-level Affiliate URL is not verified.',
      !checks.available && 'Current availability is not verified as purchasable.',
    ].filter(Boolean),
  };
}

export { DEFAULT_WEIGHTS };
