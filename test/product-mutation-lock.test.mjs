import test from 'node:test';
import assert from 'node:assert/strict';
import { withProductMutationLock } from '../lib/product-mutation-lock.mjs';

test('product mutations execute in submission order', async () => {
  const events = [];
  const first = withProductMutationLock(async () => {
    events.push('first:start');
    await new Promise(resolve => setTimeout(resolve, 10));
    events.push('first:end');
    return 1;
  });
  const second = withProductMutationLock(async () => {
    events.push('second:start');
    events.push('second:end');
    return 2;
  });
  assert.deepEqual(await Promise.all([first, second]), [1, 2]);
  assert.deepEqual(events, ['first:start', 'first:end', 'second:start', 'second:end']);
});
