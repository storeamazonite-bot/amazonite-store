import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const html = fs.readFileSync('index.html');
const sha256 = crypto.createHash('sha256').update(html).digest('hex');

// Official Amazonite Electronic baseline + the approved surgical security integration.
// The approved secure artifact is generated from the exact original storefront and
// changes only the owner auth/data behavior, logout control, and admin note/script.
const APPROVED_SECURE_SHA256 = 'b58fc2c9045755527618fe3cce065c01c697a012d34a1d110490ee2da4eaa285';

assert.equal(
  sha256,
  APPROVED_SECURE_SHA256,
  `index.html is not the approved original-preserved secure artifact. Expected ${APPROVED_SECURE_SHA256}, got ${sha256}`
);

console.log('Original baseline integrity: PASS');
console.log(`SHA-256: ${sha256}`);
console.log('Covered: exact original storefront structure preserved with only the approved secure Dashboard/Auth/API integration.');
