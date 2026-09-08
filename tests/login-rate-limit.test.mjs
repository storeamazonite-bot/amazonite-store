import assert from 'node:assert/strict';
import test from 'node:test';

const limiter = await import('../lib/login-rate-limit.mjs');

function fresh() {
  limiter.resetLoginRateLimitForTests();
}

test('allows the first five failed attempts and blocks the sixth', () => {
  fresh();
  const key = '203.0.113.10';
  for (let i = 0; i < 5; i++) assert.equal(limiter.registerLoginFailure(key, 1_700_000_000 + i), false);
  assert.equal(limiter.registerLoginFailure(key, 1_700_000_010), true);
  assert.equal(limiter.isLoginRateLimited(key, 1_700_000_010), true);
});

test('rate limit expires after the configured window', () => {
  fresh();
  const key = '203.0.113.11';
  for (let i = 0; i < 5; i++) limiter.registerLoginFailure(key, 1_700_000_000 + i);
  assert.equal(limiter.isLoginRateLimited(key, 1_700_000_000 + limiter.LOGIN_RATE_LIMIT_WINDOW_SECONDS + 1), false);
});

test('successful authentication clears the failure record', () => {
  fresh();
  const key = '203.0.113.12';
  for (let i = 0; i < 5; i++) limiter.registerLoginFailure(key, 1_700_000_000 + i);
  limiter.clearLoginFailures(key);
  assert.equal(limiter.isLoginRateLimited(key, 1_700_000_010), false);
});
