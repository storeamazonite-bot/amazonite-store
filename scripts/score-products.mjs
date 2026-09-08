#!/usr/bin/env node
/** Amazonite Electronic — deterministic product intelligence scorer. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { enrichProduct } from '../lib/product-intelligence.mjs';

const root = process.cwd();
const registryPath = path.join(root, 'data', 'products.json');
const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
const config = registry.intelligence || {};
const options = {
  weights: config.weights,
  decisionBands: config.decisionBands,
  minOrders: Number(process.env.MIN_ORDERS || 500),
  minRating: Number(process.env.MIN_RATING || 4.5),
  minCommissionPercent: Number(process.env.MIN_COMMISSION_PERCENT || 8)
};

for (const product of registry.products || []) {
  const enriched = enrichProduct(product, options);
  product.intelligence = enriched.intelligence;
}

await fs.writeFile(registryPath, JSON.stringify(registry, null, 2) + '\n');
console.log(JSON.stringify({ scored: registry.products?.length || 0 }, null, 2));
