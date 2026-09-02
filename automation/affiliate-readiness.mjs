const MIN_ORDERS = Number(process.env.MIN_ORDERS || 500);
const MIN_RATING = Number(process.env.MIN_RATING || 4.5);
const MIN_COMMISSION_PERCENT = Number(process.env.MIN_COMMISSION_PERCENT || 8);

export function evaluateAffiliateReadiness(product) {
  const orders = Number(product.orders_count ?? product.orders ?? 0);
  const rating = Number(product.rating ?? 0);
  const commission = Number(product.commission_percent ?? product.commissionRate ?? 0);
  const affiliateUrl = String(product.affiliate_url ?? product.affiliateUrl ?? '').trim();
  const sourceUrl = String(product.source_url ?? product.product_url ?? product.link ?? '').trim();
  const available = product.available !== false;

  const checks = {
    orders: orders > MIN_ORDERS,
    rating: rating > MIN_RATING,
    commission: commission > MIN_COMMISSION_PERCENT,
    affiliateUrl: affiliateUrl.length > 0,
    sourceUrl: sourceUrl.length > 0,
    available
  };

  const eligible = Object.values(checks).every(Boolean);
  return {
    eligible,
    checks,
    reason: eligible
      ? 'Eligible for Product Intelligence scoring.'
      : 'Not eligible: all affiliate hard gates must pass before promotion.'
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample = {
    orders_count: 501,
    rating: 4.6,
    commission_percent: 9,
    affiliate_url: 'https://example.com/affiliate',
    source_url: 'https://www.aliexpress.com/item/example.html',
    available: true
  };
  const result = evaluateAffiliateReadiness(sample);
  if (!result.eligible) process.exit(1);
  console.log('PASS: affiliate readiness hard gates validated.');
}
