import test from 'node:test';
import assert from 'node:assert/strict';
import { hasValidInternalToken } from '../lib/internal-auth.mjs';

const originalToken = process.env.AMAZONITE_INTERNAL_API_TOKEN;

function restoreToken() {
  if (originalToken === undefined) delete process.env.AMAZONITE_INTERNAL_API_TOKEN;
  else process.env.AMAZONITE_INTERNAL_API_TOKEN = originalToken;
}

test.afterEach(restoreToken);

test('accepts the configured internal token on Web Request headers', () => {
  process.env.AMAZONITE_INTERNAL_API_TOKEN = 'test-internal-secret';
  const request = new Request('https://example.test/api/mcp', {
    headers: { 'x-amazonite-internal-token': 'test-internal-secret' }
  });

  assert.equal(hasValidInternalToken(request), true);
});

test('rejects missing or incorrect internal tokens', () => {
  process.env.AMAZONITE_INTERNAL_API_TOKEN = 'test-internal-secret';

  assert.equal(hasValidInternalToken(new Request('https://example.test/api/mcp')), false);
  assert.equal(
    hasValidInternalToken(new Request('https://example.test/api/mcp', {
      headers: { 'x-amazonite-internal-token': 'wrong-secret' }
    })),
    false
  );
});

test('accepts the configured internal token on Node-style headers', () => {
  process.env.AMAZONITE_INTERNAL_API_TOKEN = 'test-internal-secret';
  const request = {
    headers: { 'x-amazonite-internal-token': 'test-internal-secret' }
  };

  assert.equal(hasValidInternalToken(request), true);
});
