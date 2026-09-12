import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync(path.join(process.cwd(), 'assets/analytics-engine.js'), 'utf8');
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'analytics-engine.js' });
const { createAnalyticsEngine, createLocalStore, AnalyticsValidationError } = sandbox.AmazoniteAnalyticsEngine;

function memoryStore(initial = []) {
  const events = [...initial];
  return { events, append(event) { events.push(event); }, read() { return [...events]; } };
}
function fakeStorage(initial = null) {
  let value = initial;
  return { getItem() { return value; }, setItem(_key, next) { value = next; }, value() { return value; } };
}

test('accepts a valid recommendation vote and stores a normalized event', () => {
  const store = memoryStore(); const engine = createAnalyticsEngine({ store });
  const event = engine.track('recommendation_vote', { product_id: 'prod-123', vote: 'yes', previous_vote: 'no' });
  assert.equal(event.type, 'recommendation_vote'); assert.equal(event.source, 'local'); assert.equal(event.product_id, 'prod-123'); assert.equal(event.vote, 'yes'); assert.equal(store.read().length, 1); assert.equal(typeof event.timestamp, 'string');
});

test('rejects direct, nested, and disguised PII before storage', () => {
  for (const payload of [{ product_id: 'prod-123', email: 'visitor@example.com' }, { product_id: 'prod-123', meta: { phone: '+123456789' } }, { product_id: 'prod-123', cta_label: 'contact visitor@example.com' }]) {
    const store = memoryStore(); const engine = createAnalyticsEngine({ store });
    assert.throws(() => engine.track('product_view', payload), AnalyticsValidationError); assert.equal(store.read().length, 0);
  }
});

test('rejects phone-like and card-like values even without PII field names', () => {
  const engine = createAnalyticsEngine({ store: memoryStore() });
  assert.throws(() => engine.track('cta_click', { cta_label: '+1 202-555-0198' }), AnalyticsValidationError);
  assert.throws(() => engine.track('cta_click', { cta_label: '4111 1111 1111 1111' }), AnalyticsValidationError);
});

test('rejects unknown event types and invalid payload fields', () => {
  const store = memoryStore(); const engine = createAnalyticsEngine({ store });
  assert.throws(() => engine.track('fake_event', { product_id: 'prod-123' }), AnalyticsValidationError);
  assert.throws(() => engine.track('affiliate_click', { product_id: 42 }), AnalyticsValidationError);
  assert.throws(() => engine.track('product_view', { product_id: 'prod-123', extra: true }), AnalyticsValidationError);
  assert.equal(store.read().length, 0);
});

test('enforces bounded query length and recommendation values', () => {
  const store = memoryStore(); const engine = createAnalyticsEngine({ store });
  assert.throws(() => engine.track('search_used', { query_type: 'search', query_length: -1 }), AnalyticsValidationError);
  assert.throws(() => engine.track('search_used', { query_type: 'search', query_length: 501 }), AnalyticsValidationError);
  assert.throws(() => engine.track('recommendation_vote', { vote: 'maybe' }), AnalyticsValidationError);
  assert.throws(() => engine.track('recommendation_vote', { vote: 'yes', previous_vote: 'maybe' }), AnalyticsValidationError);
});

test('recovers safely from corrupt local storage', () => {
  const storage = fakeStorage('{not-json'); const store = createLocalStore(storage, 'test');
  assert.equal(store.read().length, 0); assert.doesNotThrow(() => store.append({ type: 'product_view' })); assert.equal(JSON.parse(storage.value()).length, 1);
});

test('does not fail the storefront when local storage is unavailable or quota-limited', () => {
  const unavailable = createLocalStore(null, 'test'); assert.doesNotThrow(() => unavailable.append({ type: 'product_view' }));
  const quota = { getItem() { return '[]'; }, setItem() { throw new Error('QuotaExceededError'); } }; const store = createLocalStore(quota, 'test'); assert.doesNotThrow(() => store.append({ type: 'product_view' }));
});

test('keeps analytics explicitly local until a central sink is configured', () => {
  const store = memoryStore(); const engine = createAnalyticsEngine({ store }); const event = engine.track('ai_interaction', { interaction: 'product_recommendation' });
  assert.equal(event.source, 'local'); assert.equal(engine.isCentralized(), false);
});

test('supports an explicit central sink without inventing aggregation', () => {
  const local = memoryStore(); const central = memoryStore(); const engine = createAnalyticsEngine({ store: local, centralSink: central }); const event = engine.track('affiliate_click', { product_id: 'prod-9' });
  assert.equal(event.source, 'central'); assert.equal(local.read().length, 1); assert.equal(central.read().length, 1); assert.deepEqual(central.read()[0], local.read()[0]); assert.equal(engine.isCentralized(), true);
});

test('does not silently convert a central sink failure into a false success', () => {
  const local = memoryStore(); const central = { append() { throw new Error('central unavailable'); } }; const engine = createAnalyticsEngine({ store: local, centralSink: central });
  assert.throws(() => engine.track('product_view', { product_id: 'prod-1' }), /central unavailable/); assert.equal(local.read().length, 1);
});
