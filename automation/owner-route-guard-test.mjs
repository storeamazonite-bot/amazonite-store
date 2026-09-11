import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyOwnerSessionEdge } from '../lib/owner-session-edge.mjs';

const secret = 'route-guard-test-secret';
const now = 1_750_000_000;

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function makeToken(payload) {
  const encoded = base64url(JSON.stringify(payload));
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

assert.equal(
  await verifyOwnerSessionEdge(makeToken({ sub: 'owner', iat: now - 60, exp: now + 3600 }), secret, now),
  true,
  'valid owner session must be accepted',
);

assert.equal(
  await verifyOwnerSessionEdge(makeToken({ sub: 'owner', iat: now - 7200, exp: now - 1 }), secret, now),
  false,
  'expired owner session must be rejected',
);

const valid = makeToken({ sub: 'owner', iat: now - 60, exp: now + 3600 });
const tampered = `${valid.slice(0, -1)}${valid.endsWith('A') ? 'B' : 'A'}`;
assert.equal(await verifyOwnerSessionEdge(tampered, secret, now), false, 'tampered session must be rejected');
assert.equal(await verifyOwnerSessionEdge(valid, 'wrong-secret', now), false, 'wrong secret must be rejected');
assert.equal(await verifyOwnerSessionEdge('', secret, now), false, 'missing session must be rejected');
assert.equal(await verifyOwnerSessionEdge(valid, '', now), false, 'missing secret must be rejected');

console.log('Owner route guard session tests passed');
