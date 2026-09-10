import { clearOwnerCookie } from '../../lib/owner-auth.mjs';
import { isSameOriginRequest } from '../../lib/request-security.mjs';

export default function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.setHeader('Cache-Control', 'no-store');
    return response.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  if (!isSameOriginRequest(request)) {
    response.setHeader('Cache-Control', 'no-store');
    return response.status(403).json({ ok: false, error: 'cross_origin_request' });
  }
  response.setHeader('Set-Cookie', clearOwnerCookie());
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  return response.status(200).json({ ok: true });
}
