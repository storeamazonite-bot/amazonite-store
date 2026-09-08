import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreProduct } from '../lib/product-intelligence.mjs';

const fresh = new Date('2026-09-08T10:00:00Z').toISOString();

test('winning product satisfies hard gates and can reach high potential', () => {
  const result = scoreProduct({
    affiliateUrl: 'https://s.click.aliexpress.com/example',
    status: 'active',
    orders: 5000,
    rating: 4.8,
    commissionRate: 12,
    name: 'Premium ANC Headphones',
    category: 'Audio & Tech',
    imageUrl: 'https://example.com/image.jpg',
    notes: 'Strong content potential',
    lastCheckedAt: fresh
  }, { now: Date.parse(fresh) });

  assert.equal(result.hardGates.orders, true);
  assert.equal(result.hardGates.rating, true);
  assert.equal(result.hardGates.commission, true);
  assert.equal(result.hardGates.affiliateUrl, true);
  assert.equal(result.decision, 'high_potential');
  assert.ok(result.score >= 80);
});

test('missing affiliate link blocks high potential even with strong product metrics', () => {
  const result = scoreProduct({
    status: 'active', orders: 5000, rating: 4.9, commissionRate: 15,
    name: 'Good Product', category: 'Audio', lastCheckedAt: fresh
  }, { now: Date.parse(fresh) });

  assert.equal(result.hardGates.affiliateUrl, false);
  assert.notEqual(result.decision, 'high_potential');
  assert.match(result.reasons.join(' '), /Affiliate URL/);
});

test('minimum gates use 500 orders, 4.5 rating and 8 percent commission', () => {
  const result = scoreProduct({
    affiliateUrl: 'https://example.com/a', status: 'active',
    orders: 499, rating: 4.49, commissionRate: 7.99,
    name: 'Near Gate', category: 'Audio', lastCheckedAt: fresh
  }, { now: Date.parse(fresh) });

  assert.equal(result.hardGates.orders, false);
  assert.equal(result.hardGates.rating, false);
  assert.equal(result.hardGates.commission, false);
});
