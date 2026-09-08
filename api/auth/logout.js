import { parseCookies, clearSessionCookies } from '../../lib/security.js';
import { supabaseAdmin } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const cookies = parseCookies(req.headers.cookie || '');
  if (supabaseAdmin && cookies.ae_access) {
    try { await supabaseAdmin.auth.admin.signOut(cookies.ae_access, 'local'); } catch (_) {}
  }
  res.setHeader('Set-Cookie', clearSessionCookies());
  return res.status(200).json({ authenticated: false });
}
