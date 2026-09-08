import { timingSafeEqual } from 'node:crypto';

export const INTERNAL_TOKEN_HEADER = 'x-amazonite-internal-token';

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function readHeader(request, name) {
  if (typeof request?.headers?.get === 'function') {
    return request.headers.get(name);
  }
  const headers = request?.headers;
  if (!headers) return undefined;
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

export function hasValidInternalToken(request) {
  const expected = process.env.AMAZONITE_INTERNAL_API_TOKEN?.trim();
  if (!expected) return false;
  const supplied = readHeader(request, INTERNAL_TOKEN_HEADER)?.trim();
  return safeEqual(supplied, expected);
}

export function isAuthorizedInternalRequest(request) {
  return hasValidInternalToken(request);
}
