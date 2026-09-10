import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicRateLimiter } from '../lib/public-rate-limit.mjs';

test('public rate limiter allows configured number of requests then blocks', () => {
  const limiter = createPublicRateLimiter({ windowMs: 60_000, maxRequests: 2 });
  const request = { headers: { 'x-forwarded-for': '203.0.113.10' } };
  assert.equal(limiter.isLimited(request, 1), false);
  limiter.record(request, 1);
  assert.equal(limiter.isLimited(request, 2), false);
  limiter.record(request, 2);
  assert.equal(limiter.isLimited(request, 3), true);
});

test('public rate limiter resets after window', () => {
  const limiter = createPublicRateLimiter({ windowMs: 100, maxRequests: 1 });
  const request = { headers: { 'x-forwarded-for': '203.0.113.11' } };
  limiter.record(request, 0);
  assert.equal(limiter.isLimited(request, 50), true);
  assert.equal(limiter.isLimited(request, 101), false);
});
