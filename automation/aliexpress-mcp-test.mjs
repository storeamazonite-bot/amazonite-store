import assert from 'node:assert/strict';
import { getAliExpressProduct, searchAliExpress } from './aliexpress-mcp-adapter.mjs';

async function main() {
  const previousMode = process.env.ALIEXPRESS_SOURCE_MODE;
  const previousKey = process.env.ALIEXPRESS_SCRAPER_API_KEY;

  try {
    delete process.env.ALIEXPRESS_SCRAPER_API_KEY;
    process.env.ALIEXPRESS_SOURCE_MODE = 'auto';

    const results = await searchAliExpress('HAYLOU S30');
    assert(Array.isArray(results), 'local fallback must return an array');
    assert(results.length >= 1, 'local catalog should contain the HAYLOU S30 test product');
    assert.equal(results[0].source, 'local-catalog');
    assert.match(results[0].name, /HAYLOU S30/i);

    const product = await getAliExpressProduct('AE-001');
    assert.equal(product.id, 'AE-001');
    assert.equal(product.source, 'local-catalog');

    process.env.ALIEXPRESS_SOURCE_MODE = 'remote-only';
    await assert.rejects(
      () => searchAliExpress('HAYLOU S30'),
      /ALIEXPRESS_SCRAPER_API_KEY is missing/,
      'remote-only mode must fail clearly when the API key is absent',
    );

    console.log('PASS: AliExpress adapter local fallback and remote-only guard validated.');
  } finally {
    if (previousMode === undefined) delete process.env.ALIEXPRESS_SOURCE_MODE;
    else process.env.ALIEXPRESS_SOURCE_MODE = previousMode;
    if (previousKey === undefined) delete process.env.ALIEXPRESS_SCRAPER_API_KEY;
    else process.env.ALIEXPRESS_SCRAPER_API_KEY = previousKey;
  }
}

main().catch(error => {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
});
