import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const tracker = fs.readFileSync(path.join(root, 'assets', 'affiliate-tracker.js'), 'utf8');
const engine = fs.readFileSync(path.join(root, 'assets', 'analytics-engine.js'), 'utf8');

test('tracker no longer writes legacy v1 analytics storage', () => {
  assert.equal(tracker.includes('amazonite_events_v1'), false);
  assert.equal(tracker.includes('localStorage.setItem'), false);
});

test('tracker loads and instantiates the analytics engine', () => {
  assert.match(tracker, /assets\/analytics-engine\.js/);
  assert.match(tracker, /createAnalyticsEngine/);
  assert.match(tracker, /engine\.track\(type,data\|\|\{\}\)/);
});

test('storefront analytics events are routed through the tracker', () => {
  assert.match(tracker, /affiliateClick/);
  assert.match(tracker, /affiliate_click/);
  assert.match(tracker, /product_view/);
  assert.match(tracker, /ai_interaction/);
});

test('analytics engine remains the validation boundary', () => {
  assert.match(engine, /function validate\(type,payload\)/);
  assert.match(engine, /scanForPII\(payload,'payload\.'\)/);
  assert.match(engine, /createLocalStore/);
  assert.match(engine, /isCentralized\(\)/);
});
