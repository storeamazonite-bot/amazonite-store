const DEFAULT_WEIGHTS = Object.freeze({
  affiliateLink: 20,
  availability: 20,
  commission: 20,
  demand: 15,
  contentPotential: 15,
  dataFreshness: 10
});

const DEFAULT_BANDS = Object.freeze({ high_potential: 80, test: 60, watch: 40 });

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clamp01(value) {
  const n = finite(value);
  return n === null ? 0 : Math.max(0, Math.min(1, n));
}

function hasUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function freshnessSignal(lastCheckedAt, now = Date.now()) {
  if (!lastCheckedAt) return 0;
  const time = Date.parse(lastCheckedAt);
  if (!Number.isFinite(time) || time > now) return 0;
  const ageDays = (now - time) / 86400000;
  if (ageDays <= 1) return 1;
  if (ageDays <= 7) return 0.8;
  if (ageDays <= 30) return 0.5;
  if (ageDays <= 90) return 0.25;
  return 0;
}

function demandSignal(orders, rating, minOrders = 500, minRating = 4.5) {
  const o = finite(orders);
  const r = finite(rating);
  if (o === null || r === null) return 0;
  const orderSignal = clamp01(Math.log10(Math.max(o, 1)) / Math.log10(Math.max(minOrders, 1)));
  const ratingSignal = clamp01((r - 3) / 2);
  const gateBonus = o >= minOrders && r >= minRating ? 0.2 : 0;
  return Math.min(1, orderSignal * 0.6 + ratingSignal * 0.4 + gateBonus);
}

function commissionSignal(commissionRate, minimum = 8) {
  const rate = finite(commissionRate);
  if (rate === null || rate <= 0) return 0;
  return clamp01(rate / Math.max(minimum, 1));
}

function availabilitySignal(product) {
  if (product?.status === 'out_of_stock') return 0;
  if (product?.status === 'active') return 1;
  if (product?.availability === true) return 1;
  if (product?.availability === false) return 0;
  return 0.5;
}

function contentSignal(product) {
  let score = 0;
  if (String(product?.name || '').trim()) score += 0.25;
  if (String(product?.category || '').trim()) score += 0.2;
  if (hasUrl(product?.imageUrl)) score += 0.2;
  if (String(product?.notes || '').trim()) score += 0.1;
  if (finite(product?.rating) !== null) score += 0.1;
  if (finite(product?.orders) !== null) score += 0.15;
  return Math.min(1, score);
}

export function scoreProduct(product = {}, options = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...(options.weights || {}) };
  const bands = { ...DEFAULT_BANDS, ...(options.decisionBands || {}) };
  const minOrders = finite(options.minOrders) ?? 500;
  const minRating = finite(options.minRating) ?? 4.5;
  const minCommission = finite(options.minCommissionPercent) ?? 8;

  const signals = {
    affiliateLink: hasUrl(product.affiliateUrl) ? 1 : 0,
    availability: availabilitySignal(product),
    commission: commissionSignal(product.commissionRate, minCommission),
    demand: demandSignal(product.orders, product.rating, minOrders, minRating),
    contentPotential: contentSignal(product),
    dataFreshness: freshnessSignal(product.lastCheckedAt, options.now ?? Date.now())
  };

  const score = Math.round(Object.entries(weights).reduce((sum, [key, weight]) => sum + clamp01(signals[key]) * Number(weight || 0), 0));
  const hardGates = {
    orders: finite(product.orders) !== null && Number(product.orders) >= minOrders,
    rating: finite(product.rating) !== null && Number(product.rating) >= minRating,
    commission: finite(product.commissionRate) !== null && Number(product.commissionRate) >= minCommission,
    affiliateUrl: hasUrl(product.affiliateUrl)
  };

  let decision = 'watch';
  if (hardGates.orders && hardGates.rating && hardGates.commission && hardGates.affiliateUrl && score >= bands.high_potential) decision = 'high_potential';
  else if (score >= bands.test) decision = 'test';
  else if (score >= bands.watch) decision = 'watch';

  const reasons = [];
  if (!hardGates.affiliateUrl) reasons.push('Affiliate URL is not verified.');
  if (!hardGates.orders) reasons.push(`Orders must be at least ${minOrders}.`);
  if (!hardGates.rating) reasons.push(`Rating must be at least ${minRating}.`);
  if (!hardGates.commission) reasons.push(`Commission must be at least ${minCommission}%.`);
  if (hardGates.orders && hardGates.rating && hardGates.commission && hardGates.affiliateUrl) reasons.push('All monetization gates are satisfied.');

  return { score, decision, signals, hardGates, reasons };
}

export function enrichProduct(product = {}, options = {}) {
  const intelligence = scoreProduct(product, options);
  return { ...product, intelligence };
}

export { DEFAULT_WEIGHTS, DEFAULT_BANDS };
