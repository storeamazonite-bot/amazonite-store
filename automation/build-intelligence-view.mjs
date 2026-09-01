import fs from 'node:fs/promises';
import { evaluateProduct } from './product_intelligence.mjs';
import { loadAffiliateRegistry, verifyAffiliateRecord } from './affiliate-verification.mjs';

const PRODUCTS = new URL('../data/products.json', import.meta.url);
const STAGING = new URL('../data/product-discovery-staging.json', import.meta.url);
const OUTPUT = new URL('../data/intelligence-view.json', import.meta.url);

const defaultSignals = product => ({
  trendMomentum: Number(product.intelligence?.signals?.trendMomentum ?? 0),
  googleDemand: Number(product.intelligence?.signals?.googleDemand ?? 0),
  marketEvidence: Number(product.intelligence?.signals?.marketEvidence ?? 0),
  reviewsRating: Number(product.intelligence?.signals?.reviewsRating ?? (Number(product.rating ?? 0) > 4.5 ? 100 : 0)),
  affiliateCommission: Number(product.intelligence?.signals?.affiliateCommission ?? 0),
  profitPotential: Number(product.intelligence?.signals?.profitPotential ?? 0),
  competition: Number(product.intelligence?.signals?.competition ?? 0),
});

async function readJson(url, fallback) {
  try {
    return JSON.parse(await fs.readFile(url, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

function exactAffiliate(product, registry) {
  const match = registry.find(record =>
    String(record.productId) === String(product.id) &&
    record.sourceProductUrl === String(product.sourceProductUrl ?? ''),
  );
  return match ? verifyAffiliateRecord(match) : {
    verified: false,
    record: null,
    reasons: ['No exact product-level Affiliate record found.'],
  };
}

function buildItem(product, registry, origin) {
  const affiliate = exactAffiliate(product, registry);
  const candidate = {
    ...product,
    affiliateUrl: affiliate.verified ? affiliate.record.affiliateUrl : null,
    commissionPercent: affiliate.verified ? affiliate.record.commissionPercent : (product.commissionPercent ?? null),
    available: product.available !== false && product.stock !== 0,
  };
  const intelligence = evaluateProduct(candidate, defaultSignals(candidate));
  const reasons = [
    ...intelligence.reasons,
    ...affiliate.reasons,
  ];
  return {
    ...candidate,
    origin,
    publicationStatus: intelligence.hardPass ? 'publishable' : 'blocked',
    affiliateVerification: {
      verified: affiliate.verified,
      record: affiliate.record,
      reasons: affiliate.reasons,
    },
    intelligence: {
      ...intelligence,
      reasons: [...new Set(reasons)],
    },
  };
}

async function main() {
  const catalog = await readJson(PRODUCTS, { products: [] });
  const staging = await readJson(STAGING, { results: [] });
  const registry = await loadAffiliateRegistry();
  const catalogProducts = Array.isArray(catalog.products) ? catalog.products : [];
  const stagedProducts = Array.isArray(staging.results) ? staging.results : [];

  const catalogIds = new Set(catalogProducts.map(product => String(product.id)));
  const items = [
    ...catalogProducts.map(product => buildItem(product, registry, 'catalog')),
    ...stagedProducts
      .filter(product => !catalogIds.has(String(product.id)))
      .map(product => buildItem(product, registry, 'discovery-staging')),
  ];

  const summary = items.reduce((acc, item) => {
    acc.total += 1;
    if (item.publicationStatus === 'publishable') acc.publishable += 1;
    else acc.blocked += 1;
    if (item.origin === 'discovery-staging') acc.discovered += 1;
    if (item.affiliateVerification.verified) acc.affiliateVerified += 1;
    if (item.intelligence.decision === 'winner') acc.winners += 1;
    else if (['strong', 'test'].includes(item.intelligence.decision)) acc.strongOrTest += 1;
    else acc.watchOrReject += 1;
    return acc;
  }, { total: 0, publishable: 0, blocked: 0, discovered: 0, affiliateVerified: 0, winners: 0, strongOrTest: 0, watchOrReject: 0 });

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: 'products.json + product-discovery-staging.json + affiliate-verification.json',
    policy: {
      writesProductsJson: false,
      publishableRequiresAllHardGates: true,
      hardGates: 'orders > 500; rating > 4.5; commission > 8%; exact Affiliate URL; current availability',
      failClosed: true,
    },
    summary,
    items,
  };

  await fs.writeFile(OUTPUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify(payload, null, 2));
}

main().catch(error => {
  console.error(`Intelligence view build failed closed: ${error.message}`);
  process.exitCode = 1;
});
