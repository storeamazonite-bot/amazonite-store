import { clearOwnerCookie } from '../../lib/owner-auth.mjs';

export default function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  response.setHeader('Set-Cookie', clearOwnerCookie());
  return response.status(200).json({ ok: true });
}
