import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAnalyticsEvent } from '../lib/analytics-store.mjs';

test('analytics accepts supported product events', () => {
  assert.equal(validateAnalyticsEvent({type:'product_view',product_id:'AE-001'}), true);
  assert.equal(validateAnalyticsEvent({type:'affiliate_click',product_id:'AE-001',destination_domain:'aliexpress.com'}), true);
});

test('analytics rejects unsupported or incomplete events', () => {
  assert.throws(() => validateAnalyticsEvent({type:'page_view',product_id:'AE-001'}), /Unsupported analytics event/);
  assert.throws(() => validateAnalyticsEvent({type:'product_view'}), /product_id is required/);
});
