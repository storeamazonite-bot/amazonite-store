import test from 'node:test';
import assert from 'node:assert/strict';
import { clearLoginFailures, isLoginRateLimited, recordLoginFailure, LOGIN_RATE_LIMIT } from '../lib/login-rate-limit.mjs';

function request(ip) { return { headers: { 'x-forwarded-for': ip } }; }

test('login rate limiter locks after repeated failures and resets after lockout', () => {
  const req = request('198.51.100.10');
  const email = `owner-${Date.now()}@example.com`;
  let t = 1_000_000;
  clearLoginFailures(req, email);
  assert.equal(isLoginRateLimited(req, email, t), false);
  for (let i = 0; i < LOGIN_RATE_LIMIT.MAX_FAILURES; i += 1) recordLoginFailure(req, email, t + i);
  assert.equal(isLoginRateLimited(req, email, t + 100), true);
  assert.equal(isLoginRateLimited(req, email, t + LOGIN_RATE_LIMIT.LOCKOUT_MS + 1), false);
  clearLoginFailures(req, email);
});

test('rate-limit key separates client IPs', () => {
  const email = `owner-${Date.now()}@example.com`;
  const a = request('198.51.100.11');
  const b = request('198.51.100.12');
  let t = 2_000_000;
  clearLoginFailures(a, email); clearLoginFailures(b, email);
  for (let i = 0; i < LOGIN_RATE_LIMIT.MAX_FAILURES; i += 1) recordLoginFailure(a, email, t + i);
  assert.equal(isLoginRateLimited(a, email, t + 100), true);
  assert.equal(isLoginRateLimited(b, email, t + 100), false);
  clearLoginFailures(a, email); clearLoginFailures(b, email);
});
