function num(value) {
  if (value === null || value === undefined || value === '') return NaN;
  return Number(String(value).replace(/[^0-9.\-]/g, ''));
}

function qualifies(product, limits = {}) {
  const minOrders = Number(limits.minOrders ?? process.env.MIN_ORDERS ?? 500);
  const minRating = Number(limits.minRating ?? process.env.MIN_RATING ?? 4.5);
  const minCommission = Number(limits.minCommissionPercent ?? process.env.MIN_COMMISSION_PERCENT ?? 8);

  return (
    num(product.orders ?? product.orderCount ?? product.sold) > minOrders &&
    num(product.rating ?? product.averageRating) > minRating &&
    num(product.commissionPercent ?? product.commission_rate ?? product.commission) > minCommission
  );
}

function filterProducts(products, limits) {
  return (products || []).filter((p) => qualifies(p, limits));
}

module.exports = { qualifies, filterProducts };
