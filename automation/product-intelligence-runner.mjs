import fs from 'node:fs/promises';
import { searchAliExpress } from './aliexpress-mcp-adapter.mjs';
import { evaluateProduct } from './product_intelligence.mjs';

const STAGING = new URL('../data/product-discovery-staging.json', import.meta.url);

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function writeStaging(payload) {
  await fs.mkdir(new URL('../data/', import.meta.url), { recursive: true });
  await fs.writeFile(STAGING, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

export function buildIntelligenceSignals(product) {
  return {
    trendMomentum: 0,
    googleDemand: 0,
    marketEvidence: 0,
    reviewsRating: product.rating > 4.5 ? 100 : 0,
    affiliateCommission: 0,
    profitPotential: 0,
    competition: 0,
  };
}

export async function runProductIntelligence({ query, page = 1 } = {}) {
  const resolvedQuery = query || 'HAYLOU S30 wireless ANC headphones';
  const resolvedPage = Number(page) || 1;
  const startedAt = new Date().toISOString();

  try {
    const products = await searchAliExpress(resolvedQuery, { sort: 'orders', page: resolvedPage });
    const results = products.map(product => ({
      ...product,
      intelligence: evaluateProduct(product, buildIntelligenceSignals(product)),
      stagingStatus: 'not-publishable-until-verified',
    }));

    return {
      generatedAt: new Date().toISOString(),
      source: 'aliexpress-mcp',
      query: resolvedQuery,
      page: resolvedPage,
      count: results.length,
      results,
      policy: {
        writesProductsJson: false,
        requiresVerifiedAffiliateUrl: true,
        requiresAuthoritativeCommission: true,
        hardGates: 'orders > 500; rating > 4.5; commission > 8%',
      },
      startedAt,
    };
  } catch (error) {
    return {
      generatedAt: new Date().toISOString(),
      source: 'aliexpress-mcp',
      query: resolvedQuery,
      page: resolvedPage,
      count: 0,
      results: [],
      error: error.message,
      failedClosed: true,
      startedAt,
    };
  }
}

async function main() {
  const payload = await runProductIntelligence({
    query: arg('query', 'HAYLOU S30 wireless ANC headphones'),
    page: arg('page', '1'),
  });

  await writeStaging(payload);
  console.log(JSON.stringify(payload, null, 2));
  if (payload.failedClosed) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
