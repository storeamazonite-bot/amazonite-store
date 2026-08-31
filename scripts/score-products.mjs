#!/usr/bin/env node
/** Amazonite Store — deterministic product intelligence scorer. */
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'data', 'products.json');
const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
const weights = registry.intelligence?.weights || {};
const bands = registry.intelligence?.decisionBands || { high_potential: 80, test: 60, watch: 40 };

function freshnessScore(lastCheckedAt) {
  if (!lastCheckedAt) return 0;
  const ageHours = (Date.now() - Date.parse(lastCheckedAt)) / 36e5;
  if (ageHours <= 24) return 100;
  if (ageHours <= 72) return 70;
  if (ageHours <= 168) return 40;
  return 10;
}
function linkScore(p) { return p.affiliateUrl ? 100 : 0; }
function availabilityScore(p) {
  if (p.status === 'active') return 100;
  if (p.status === 'out_of_stock' || p.status === 'retired') return 0;
  return 30;
}
function commissionScore(p) {
  const rate = Number(p.commissionRate);
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  if (rate >= 15) return 100;
  if (rate >= 10) return 85;
  if (rate >= 5) return 65;
  return 40;
}
function demandScore(p) { return Number.isFinite(Number(p?.intelligence?.signals?.demand)) ? Number(p.intelligence.signals.demand) : 0; }
function contentScore(p) { return Number.isFinite(Number(p?.intelligence?.signals?.contentPotential)) ? Number(p.intelligence.signals.contentPotential) : 0; }

for (const p of registry.products || []) {
  const signals = {
    affiliateLink: linkScore(p),
    availability: availabilityScore(p),
    commission: commissionScore(p),
    demand: demandScore(p),
    contentPotential: contentScore(p),
    dataFreshness: freshnessScore(p.lastCheckedAt)
  };
  const total = Math.round(Object.entries(signals).reduce((sum, [key, value]) => sum + value * (Number(weights[key]) || 0) / 100, 0));
  const decision = total >= bands.high_potential ? 'high_potential' : total >= bands.test ? 'test' : 'watch';
  const reasons = [];
  if (!p.affiliateUrl) reasons.push('Affiliate URL missing or unverified.');
  if (p.status !== 'active') reasons.push(`Product status is ${p.status || 'unknown'}.`);
  if (!p.commissionRate) reasons.push('Current commission rate is not verified.');
  if (!p.lastCheckedAt) reasons.push('Freshness check has not been completed.');
  p.intelligence = { score: total, decision, signals, reasons };
}

await fs.writeFile(registryPath, JSON.stringify(registry, null, 2) + '\n');
console.log(JSON.stringify({ scored: registry.products?.length || 0 }, null, 2));
