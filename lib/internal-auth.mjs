import { timingSafeEqual } from 'node:crypto';

export const INTERNAL_TOKEN_HEADER = 'x-amazonite-internal-token';

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function hasValidInternalToken(request) {
  const expected = process.env.AMAZONITE_INTERNAL_API_TOKEN?.trim();
  if (!expected || !request?.headers?.get) return false;
  const supplied = request.headers.get(INTERNAL_TOKEN_HEADER)?.trim();
  return safeEqual(supplied, expected);
}

export function isAuthorizedInternalRequest(request) {
  return hasValidInternalToken(request);
}
