import assert from 'node:assert/strict';
import { verifyTotp } from '../lib/totp.mjs';

// RFC 6238 Appendix B: SHA-1, 8 digits, 30-second period.
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

assert.equal(
  verifyTotp(secret, '94287082', 59, { digits: 8, period: 30, algorithm: 'sha1', window: 0 }),
  true,
);
assert.equal(
  verifyTotp(secret, '94287081', 59, { digits: 8, period: 30, algorithm: 'sha1', window: 0 }),
  false,
);
assert.equal(
  verifyTotp(secret, '07081804', 1111111109, { digits: 8, period: 30, algorithm: 'sha1', window: 0 }),
  true,
);

console.log('PASS: TOTP RFC 6238 vectors and rejection path validated.');
