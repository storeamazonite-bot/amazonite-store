import { isOwnerRequest } from '../../lib/owner-auth.mjs';

export default function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).setHeader('Allow', 'GET').json({ ok: false, error: 'method_not_allowed' });
  response.setHeader('Cache-Control', 'no-store');
  return response.status(200).json({ ok: isOwnerRequest(request) });
}
