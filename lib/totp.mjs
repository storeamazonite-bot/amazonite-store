import { createHmac, timingSafeEqual } from 'node:crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input) {
  const normalized = String(input || '').toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  if (!/^[A-Z2-7]+$/.test(normalized)) throw new Error('Invalid base32 secret');

  let bits = 0;
  let value = 0n;
  const output = [];

  for (const character of normalized) {
    value = (value << 5n) | BigInt(BASE32.indexOf(character));
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push(Number((value >> BigInt(bits)) & 255n));
    }
  }

  return Buffer.from(output);
}

function codeFor(secret, counter, digits, algorithm) {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac(algorithm, base32Decode(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return String(binary % (10 ** digits)).padStart(digits, '0');
}

export function verifyTotp(
  secret,
  token,
  now = Math.floor(Date.now() / 1000),
  { digits = 6, period = 30, algorithm = 'sha1', window = 1 } = {},
) {
  const normalizedToken = String(token || '');
  if (!secret || !/^\d+$/.test(normalizedToken) || normalizedToken.length !== digits) return false;
  if (!Number.isInteger(digits) || digits < 6 || digits > 8) return false;
  if (!Number.isInteger(period) || period < 15) return false;
  if (!Number.isInteger(window) || window < 0 || window > 2) return false;
  if (!['sha1', 'sha256', 'sha512'].includes(String(algorithm).toLowerCase())) return false;

  try {
    const counter = Math.floor(now / period);
    const supplied = Buffer.from(normalizedToken);
    for (let delta = -window; delta <= window; delta += 1) {
      if (counter + delta < 0) continue;
      const expected = Buffer.from(codeFor(secret, counter + delta, digits, String(algorithm).toLowerCase()));
      if (expected.length === supplied.length && timingSafeEqual(expected, supplied)) return true;
    }
  } catch {
    return false;
  }

  return false;
}
