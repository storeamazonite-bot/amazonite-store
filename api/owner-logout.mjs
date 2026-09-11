import { clearOwnerCookie } from '../lib/owner-auth.mjs';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Set-Cookie', clearOwnerCookie());
  return res.status(200).json({ ok: true });
}
