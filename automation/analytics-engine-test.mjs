import assert from 'node:assert/strict';
import test from 'node:test';
import { createAnalyticsEngine, AnalyticsValidationError } from '../analytics/engine.mjs';

function memoryStore() {
  const events = [];
  return {
    events,
    append(event) { events.push(event); },
    read() { return [...events]; }
  };
}

test('accepts a valid recommendation vote and stores a normalized event', () => {
  const store = memoryStore();
  const engine = createAnalyticsEngine({ store });

  const event = engine.track('recommendation_vote', {
    product_id: 'prod-123',
    vote: 'yes',
    previous_vote: 'no'
  });

  assert.equal(event.type, 'recommendation_vote');
  assert.equal(event.source, 'local');
  assert.equal(event.product_id, 'prod-123');
  assert.equal(event.vote, 'yes');
  assert.equal(store.read().length, 1);
  assert.equal(typeof event.timestamp, 'string');
});

test('rejects PII instead of storing it', () => {
  const store = memoryStore();
  const engine = createAnalyticsEngine({ store });

  assert.throws(
    () => engine.track('product_view', {
      product_id: 'prod-123',
      email: 'visitor@example.com'
    }),
    AnalyticsValidationError
  );
  assert.equal(store.read().length, 0);
});

test('rejects unknown event types and invalid payload fields', () => {
  const store = memoryStore();
  const engine = createAnalyticsEngine({ store });

  assert.throws(
    () => engine.track('fake_event', { product_id: 'prod-123' }),
    AnalyticsValidationError
  );
  assert.throws(
    () => engine.track('affiliate_click', { product_id: 42 }),
    AnalyticsValidationError
  );
  assert.equal(store.read().length, 0);
});

test('keeps analytics explicitly local until a central sink is configured', () => {
  const store = memoryStore();
  const engine = createAnalyticsEngine({ store });

  const event = engine.track('ai_interaction', {
    interaction: 'product_recommendation'
  });

  assert.equal(event.source, 'local');
  assert.equal(engine.isCentralized(), false);
});
