import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { generatePasswordHash, verifyOwnerPassword, createOwnerSession, verifyOwnerSession, buildOwnerCookie, clearOwnerCookie, OWNER_SESSION_COOKIE } from '../lib/owner-auth.mjs';
import { verifyTotp } from '../lib/totp.mjs';

process.env.AMAZONITE_AUTH_SECRET = 'test-only-owner-auth-secret';
const password = 'test-owner-password';
process.env.AMAZONITE_OWNER_PASSWORD_HASH = generatePasswordHash(password);
process.env.AMAZONITE_OWNER_TOTP_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

assert.equal(verifyOwnerPassword(password), true);
assert.equal(verifyOwnerPassword('wrong-password'), false);

const issuedAt = 1_700_000_000;
const session = createOwnerSession(issuedAt);
assert.equal(verifyOwnerSession(session, issuedAt + 1), true);
assert.equal(verifyOwnerSession(session, issuedAt + 8 * 60 * 60), false);
assert.equal(verifyOwnerSession(`${session}x`, issuedAt + 1), false);

assert.match(buildOwnerCookie(session), new RegExp(`${OWNER_SESSION_COOKIE}=.*HttpOnly.*Secure.*SameSite=Strict`));
assert.match(clearOwnerCookie(), /Max-Age=0/);

assert.equal(verifyTotp(process.env.AMAZONITE_OWNER_TOTP_SECRET, '94287082', 59, { digits: 8, period: 30, algorithm: 'sha1', window: 0 }), true);
assert.equal(verifyTotp(process.env.AMAZONITE_OWNER_TOTP_SECRET, '94287081', 59, { digits: 8, period: 30, algorithm: 'sha1', window: 0 }), false);

console.log('PASS: Owner password hashing, signed session expiry/tamper rejection, secure cookie flags, and TOTP verification validated.');
