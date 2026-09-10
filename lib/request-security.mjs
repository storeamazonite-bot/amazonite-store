function header(request, name) {
  return request?.headers?.[name] ?? request?.headers?.get?.(name) ?? '';
}

function normalizeHost(value) {
  return String(value || '').trim().split(',')[0].trim().toLowerCase();
}

export function isSameOriginRequest(request) {
  const origin = String(header(request, 'origin') || '').trim();
  if (!origin || origin.toLowerCase() === 'null') return false;
  let originUrl;
  try { originUrl = new URL(origin); } catch { return false; }
  if (!['http:', 'https:'].includes(originUrl.protocol)) return false;
  const forwardedHost = normalizeHost(header(request, 'x-forwarded-host'));
  const host = normalizeHost(forwardedHost || header(request, 'host'));
  if (!host || originUrl.host.toLowerCase() !== host) return false;
  const forwardedProto = String(header(request, 'x-forwarded-proto') || '').split(',')[0].trim().toLowerCase();
  const requestProto = forwardedProto || (originUrl.protocol === 'https:' ? 'https' : 'http');
  return originUrl.protocol === `${requestProto}:`;
}

export function requireSameOrigin(request, response, json) {
  if (isSameOriginRequest(request)) return true;
  response.setHeader('Vary', 'Origin');
  json(response, 403, { ok: false, error: 'cross_origin_request' });
  return false;
}
