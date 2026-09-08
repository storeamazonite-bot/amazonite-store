import { resolveSession } from '../../lib/auth.js';
import { isOwner } from '../../lib/security.js';
import { setSecurityHeaders } from '../../lib/http-security.js';

export default async function handler(req, res) {
  setSecurityHeaders(res, { noStore: true });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  const user = await resolveSession(req, res);
  if (!user) return res.status(401).json({ authenticated: false });
  if (!isOwner(user)) return res.status(403).json({ authenticated: false });
  return res.status(200).json({ authenticated: true, user: { id: user.id, email: user.email } });
}
