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

async function main() {
  const query = arg('query', 'HAYLOU S30 wireless ANC headphones');
  const page = Number(arg('page', '1')) || 1;
  const startedAt = new Date().toISOString();

  try {
    const products = await searchAliExpress(query, { sort: 'orders', page });
    const results = products.map(product => ({
      ...product,
      intelligence: evaluateProduct(product, {
        trendMomentum: 0,
        googleDemand: 0,
        marketEvidence: 0,
        reviewsRating: product.rating > 4.5 ? 100 : 0,
        affiliateCommission: 0,
        profitPotential: 0,
        competition: 0,
      }),
      stagingStatus: 'not-publishable-until-verified',
    }));

    const payload = {
      generatedAt: new Date().toISOString(),
      source: 'aliexpress-mcp',
      query,
      page,
      count: results.length,
      results,
      policy: {
        writesProductsJson: false,
        requiresVerifiedAffiliateUrl: true,
        requiresAuthoritativeCommission: true,
        hardGates: 'orders > 500; rating > 4.5; commission > 8%',
      },
    };

    await writeStaging(payload);
    console.log(JSON.stringify(payload, null, 2));
  } catch (error) {
    const payload = {
      generatedAt: new Date().toISOString(),
      source: 'aliexpress-mcp',
      query,
      page,
      count: 0,
      results: [],
      error: error.message,
      failedClosed: true,
      startedAt,
    };
    await writeStaging(payload);
    console.error(`Product intelligence runner failed closed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
