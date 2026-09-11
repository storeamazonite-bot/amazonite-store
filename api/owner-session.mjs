import { OWNER_SESSION_COOKIE, verifyOwnerSession } from '../lib/owner-auth.mjs';

function readCookie(header, name) {
  const prefix = `${name}=`;
  for (const part of String(header || '').split(';')) {
    const value = part.trim();
    if (value.startsWith(prefix)) return value.slice(prefix.length);
  }
  return '';
}

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = readCookie(req.headers.cookie, OWNER_SESSION_COOKIE);
    return res.status(200).json({ authenticated: verifyOwnerSession(token) });
  } catch {
    return res.status(200).json({ authenticated: false });
  }
}
