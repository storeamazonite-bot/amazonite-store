import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePasswordHash, verifyOwnerPassword, createOwnerSession, verifyOwnerSession } from '../lib/owner-auth.mjs';

process.env.AMAZONITE_AUTH_SECRET = 'test-only-secret-change-me';
process.env.AMAZONITE_OWNER_PASSWORD_HASH = generatePasswordHash('correct-password');

test('owner password accepts the configured password and rejects a wrong one', () => {
  assert.equal(verifyOwnerPassword('correct-password'), true);
  assert.equal(verifyOwnerPassword('wrong-password'), false);
});

test('owner session is valid until expiry and fails after tampering', () => {
  const now = 1_800_000_000;
  const token = createOwnerSession(now);
  assert.equal(verifyOwnerSession(token, now + 60), true);
  assert.equal(verifyOwnerSession(token, now + 60 * 60 * 9), false);
  assert.equal(verifyOwnerSession(`${token}x`, now + 60), false);
});
