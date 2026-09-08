import { supabaseAuth } from '../../lib/supabase.js';
import { isOwner, sessionCookie } from '../../lib/security.js';
import { enforceSameOrigin, rateLimit, setSecurityHeaders } from '../../lib/http-security.js';

export default async function handler(req, res) {
  setSecurityHeaders(res, { noStore: true });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!enforceSameOrigin(req, res)) return;
  if (!rateLimit(req, res, { limit: 10, prefix: 'login' })) return;
  if (!supabaseAuth) return res.status(503).json({ error: 'Authentication service is not configured.' });
  try {
    const { email, password } = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error || !data?.session || !data?.user) return res.status(401).json({ error: 'Invalid credentials.' });
    if (!isOwner(data.user)) {
      await supabaseAuth.auth.signOut({ scope: 'local' });
      return res.status(403).json({ error: 'Owner access required.' });
    }
    res.setHeader('Set-Cookie', [
      sessionCookie('ae_access', data.session.access_token, data.session.expires_in || 3600),
      sessionCookie('ae_refresh', data.session.refresh_token, 60 * 60 * 24 * 30)
    ]);
    return res.status(200).json({ authenticated: true, user: { id: data.user.id, email: data.user.email } });
  } catch {
    return res.status(400).json({ error: 'Invalid request.' });
  }
}
