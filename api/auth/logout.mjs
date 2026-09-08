import { clearOwnerCookie, isOwnerRequest } from '../../lib/owner-auth.mjs';

export default function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).setHeader('Allow', 'POST').json({ ok: false, error: 'method_not_allowed' });

  const origin = request.headers.origin;
  const host = request.headers.host;
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return response.status(403).json({ ok: false, error: 'origin_not_allowed' });
    } catch {
      return response.status(403).json({ ok: false, error: 'origin_not_allowed' });
    }
  }

  if (!isOwnerRequest(request)) return response.status(401).setHeader('Cache-Control', 'no-store').json({ ok: false, error: 'unauthorized' });

  response.setHeader('Set-Cookie', clearOwnerCookie());
  response.setHeader('Cache-Control', 'no-store');
  return response.status(200).json({ ok: true });
}
