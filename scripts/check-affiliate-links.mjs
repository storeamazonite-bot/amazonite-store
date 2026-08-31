#!/usr/bin/env node
/**
 * Amazonite Store — Product/affiliate link health checker.
 *
 * Run: node scripts/check-affiliate-links.mjs
 *
 * Safety: this checker never purchases, authenticates, changes AliExpress data,
 * or follows a link in a browser. It only performs a lightweight HTTP check
 * against explicitly configured product URLs.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'data', 'products.json');
const reportDir = path.join(root, 'data', 'health');
const reportPath = path.join(reportDir, 'latest.json');

const timeoutMs = Number(process.env.LINK_CHECK_TIMEOUT_MS || 12000);
const userAgent = 'AmazoniteStore-LinkHealth/1.0';

async function checkUrl(url) {
  if (!url) return { state: 'missing', httpStatus: null, finalUrl: null, checkedAt: new Date().toISOString() };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': userAgent }
      });
      // Some merchants reject HEAD. A minimal GET is used only as fallback.
      if (response.status === 405 || response.status === 403) {
        response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: { 'user-agent': userAgent, range: 'bytes=0-0' }
        });
      }
    } finally {
      clearTimeout(timer);
    }
    const status = response.status;
    return {
      state: status >= 200 && status < 400 ? 'reachable' : 'http_error',
      httpStatus: status,
      finalUrl: response.url || url,
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      state: error?.name === 'AbortError' ? 'timeout' : 'network_error',
      httpStatus: null,
      finalUrl: null,
      error: error?.message || String(error),
      checkedAt: new Date().toISOString()
    };
  }
}

const raw = await fs.readFile(registryPath, 'utf8');
const registry = JSON.parse(raw);
const results = [];

for (const product of registry.products || []) {
  const affiliate = await checkUrl(product.affiliateUrl);
  const source = await checkUrl(product.sourceProductUrl);

  let recommendedStatus = product.status;
  if (affiliate.state === 'missing') recommendedStatus = 'needs_review';
  else if (['http_error', 'network_error', 'timeout'].includes(affiliate.state)) recommendedStatus = 'link_invalid';
  else if (product.status === 'link_invalid') recommendedStatus = 'needs_review';

  results.push({
    id: product.id,
    name: product.name,
    currentStatus: product.status,
    recommendedStatus,
    affiliate,
    source
  });
}

await fs.mkdir(reportDir, { recursive: true });
const report = {
  schemaVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  checkedProducts: results.length,
  results
};
await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

const summary = results.reduce((acc, item) => {
  acc[item.affiliate.state] = (acc[item.affiliate.state] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({ report: reportPath, summary }, null, 2));
