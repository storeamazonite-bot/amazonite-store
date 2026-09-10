import test from 'node:test';
import assert from 'node:assert/strict';
import { isSameOriginRequest } from '../lib/request-security.mjs';

test('same-origin request accepts matching Origin', () => {
  assert.equal(isSameOriginRequest({ headers: { origin: 'https://example.com', host: 'example.com' } }), true);
});

test('same-origin request rejects cross-origin Origin', () => {
  assert.equal(isSameOriginRequest({ headers: { origin: 'https://evil.example', host: 'example.com' } }), false);
});

test('same-origin request rejects Origin null', () => {
  assert.equal(isSameOriginRequest({ headers: { origin: 'null', host: 'example.com' } }), false);
});

test('same-origin request uses forwarded host when present', () => {
  assert.equal(isSameOriginRequest({ headers: { origin: 'https://shop.example.com', host: 'internal.vercel', 'x-forwarded-host': 'shop.example.com' } }), true);
});
