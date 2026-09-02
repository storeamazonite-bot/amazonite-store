import fs from 'node:fs/promises';

const DEFAULT_API_BASE = 'https://aliexpress-scraper-api.omkar.cloud';
const LOCAL_CATALOG = new URL('../data/products.json', import.meta.url);

function apiBase() {
  return (process.env.ALIEXPRESS_SCRAPER_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');
}

function countryCode() {
  return process.env.AE_COUNTRY_CODE || process.env.AE_REGION || 'US';
}

function sourceMode() {
  return (process.env.ALIEXPRESS_SOURCE_MODE || 'auto').toLowerCase();
}

function hasRemoteCredentials() {
  return Boolean(process.env.ALIEXPRESS_SCRAPER_API_KEY?.trim());
}

async function getJson(url) {
  const headers = { accept: 'application/json' };
  if (hasRemoteCredentials()) headers['API-Key'] = process.env.ALIEXPRESS_SCRAPER_API_KEY.trim();

  const response = await fetch(url, { headers });
  const text = await response.text();
  if (!response.ok) throw new Error(`Omkar HTTP ${response.status}: ${text.slice(0, 500)}`);

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Omkar returned a non-JSON response');
  }
}

function numberFrom(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const match = value.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function normalizeProduct(raw = {}) {
  const pricing = raw.pricing ?? {};
  const store = raw.store;
  const sourceUrl = raw.sourceProductUrl ?? raw.source_url ?? raw.url ?? raw.productUrl ?? raw.link ?? raw.listing_url ?? raw.product_url ?? '';

  return {
    id: String(raw.id ?? raw.productId ?? raw.product_id ?? raw.itemId ?? ''),
    name: raw.name ?? raw.title ?? raw.product_title ?? raw.productTitle ?? '',
    sourceProductUrl: sourceUrl,
    affiliateUrl: raw.affiliateUrl ?? raw.affiliate_url ?? null,
    price: Number(raw.price ?? raw.sale_price ?? raw.current_price ?? raw.min_price ?? pricing.sale_price ?? 0) || 0,
    originalPrice: Number(raw.originalPrice ?? raw.original_price ?? pricing.original_price ?? 0) || 0,
    discountPercent: Number(raw.discountPercent ?? raw.discount_percent ?? pricing.discount_percent ?? 0) || 0,
    currency: raw.currency ?? raw.price_currency ?? pricing.currency ?? process.env.AE_CURRENCY ?? 'USD',
    rating: Number(raw.rating ?? raw.averageRating ?? raw.star_rating ?? raw.starRating ?? 0) || 0,
    orders: numberFrom(raw.orders ?? raw.ordersSold ?? raw.sold ?? raw.orderCount ?? raw.sold_count ?? raw.trade_count ?? raw.tradeCount ?? raw.orders_count),
    reviewCount: numberFrom(raw.reviewCount ?? raw.review_count ?? raw.reviews ?? raw.review_count_total ?? raw.reviews_count),
    wishlistCount: numberFrom(raw.wishlistCount ?? raw.wishlist_count),
    available: raw.available !== false && raw.stock !== 0,
    stock: raw.stock ?? raw.available_count ?? null,
    store: typeof store === 'object' && store !== null ? store.name ?? null : (store ?? raw.store_name ?? raw.seller_name ?? null),
    shipping: raw.shipping ?? raw.shipping_cost ?? null,
    images: Array.isArray(raw.images) ? raw.images : (raw.image ? [raw.image] : []),
    image: raw.image ?? raw.images?.[0] ?? null,
    isChoice: raw.is_choice ?? raw.isChoice ?? false,
    isHotSale: raw.is_hot_sale ?? raw.isHotSale ?? false,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    commissionPercent: raw.commissionPercent ?? raw.commission_percent ?? raw.commission ?? null,
    source: raw.source ?? 'aliexpress-scraper-api',
    lastCheckedAt: new Date().toISOString(),
  };
}

async function readLocalCatalog() {
  try {
    const text = await fs.readFile(LOCAL_CATALOG, 'utf8');
    const data = JSON.parse(text);
    return Array.isArray(data?.products) ? data.products : [];
  } catch {
    return [];
  }
}

function matchesQuery(product, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = `${product.name ?? ''} ${product.category ?? ''} ${product.notes ?? ''}`.toLowerCase();
  return terms.every(term => haystack.includes(term));
}

async function searchLocalCatalog(query, sort = 'orders') {
  const products = (await readLocalCatalog()).filter(product => matchesQuery(product, query));
  const normalized = products.map(product => normalizeProduct({
    ...product,
    source: 'local-catalog',
    orders_count: product.orders ?? product.orderCount ?? 0,
    commissionPercent: product.commissionRate ?? product.commissionPercent ?? null,
  }));

  return normalized.sort((a, b) => {
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'price') return a.price - b.price;
    return b.orders - a.orders;
  });
}

async function getLocalProduct(productIdOrUrl) {
  const products = await readLocalCatalog();
  const needle = String(productIdOrUrl).toLowerCase();
  const product = products.find(item => String(item.id ?? '').toLowerCase() === needle || String(item.sourceProductUrl ?? '').toLowerCase() === needle || String(item.affiliateUrl ?? '').toLowerCase() === needle);
  return product ? normalizeProduct({ ...product, source: 'local-catalog' }) : null;
}

export async function searchAliExpress(query, { sort = 'orders', page = 1 } = {}) {
  if (!hasRemoteCredentials()) {
    if (sourceMode() === 'remote-only') throw new Error('AliExpress remote source is not configured: ALIEXPRESS_SCRAPER_API_KEY is missing.');
    return searchLocalCatalog(query, sort);
  }

  const sortMap = { orders: 'most_orders', price: 'price_low_to_high', rating: 'best_match' };
  const params = new URLSearchParams({ query, page: String(page), country_code: countryCode(), sort_by: sortMap[sort] || 'best_match' });
  const data = await getJson(`${apiBase()}/aliexpress/v2/search?${params}`);
  let products = Array.isArray(data?.results) ? data.results : [];

  if (sort === 'rating') products = [...products].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  return products.map(normalizeProduct);
}

export async function getAliExpressProduct(productIdOrUrl) {
  if (!hasRemoteCredentials()) {
    if (sourceMode() === 'remote-only') throw new Error('AliExpress remote source is not configured: ALIEXPRESS_SCRAPER_API_KEY is missing.');
    const localProduct = await getLocalProduct(productIdOrUrl);
    if (!localProduct) throw new Error('Product is not present in the local catalog and the remote AliExpress source is not configured.');
    return localProduct;
  }

  const params = new URLSearchParams({ product: productIdOrUrl, country_code: countryCode() });
  const data = await getJson(`${apiBase()}/aliexpress/v2/product?${params}`);
  return normalizeProduct(data?.product ?? data);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (command === 'search') console.log(JSON.stringify(await searchAliExpress(args.join(' ')), null, 2));
    else if (command === 'product') console.log(JSON.stringify(await getAliExpressProduct(args.join(' ')), null, 2));
    else console.log('Usage: node automation/aliexpress-mcp-adapter.mjs search <query> | product <id-or-url>');
  } catch (error) {
    console.error(`AliExpress source error: ${error.message}`);
    process.exitCode = 1;
  }
}
