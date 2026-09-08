import { parseCookies, isOwner, sessionCookie } from './security.js';
import { supabaseAdmin } from './supabase.js';

export async function requireOwner(req, res) {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Authentication service is not configured.' });
    return null;
  }
  const cookies = parseCookies(req.headers.cookie || '');
  const access = cookies.ae_access;
  if (!access) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  const { data, error } = await supabaseAdmin.auth.getUser(access);
  if (error || !data?.user) {
    res.status(401).json({ error: 'Invalid or expired session.' });
    return null;
  }
  if (!isOwner(data.user)) {
    res.status(403).json({ error: 'Owner access required.' });
    return null;
  }
  return data.user;
}

export async function resolveSession(req, res) {
  if (!supabaseAdmin) return null;
  const cookies = parseCookies(req.headers.cookie || '');
  if (!cookies.ae_access) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(cookies.ae_access);
  if (!error && data?.user) return data.user;
  if (!cookies.ae_refresh) return null;
  const refreshed = await supabaseAdmin.auth.refreshSession({ refresh_token: cookies.ae_refresh });
  const session = refreshed.data?.session;
  if (!session?.access_token || !refreshed.data?.user) return null;
  res.setHeader('Set-Cookie', [
    sessionCookie('ae_access', session.access_token, session.expires_in || 3600),
    sessionCookie('ae_refresh', session.refresh_token, 60 * 60 * 24 * 30)
  ]);
  return refreshed.data.user;
}
