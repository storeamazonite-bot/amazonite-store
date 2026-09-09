const COOKIE = 'amazonite_owner_session';
const LOGIN_PATH = '/owner-login.html';

function base64urlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  return atob(padded);
}

async function verifySession(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!payload || !signature) return false;
  try {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigNormalized = signature.replace(/-/g, '+').replace(/_/g, '/');
    const sigPadded = sigNormalized + '='.repeat((4 - sigNormalized.length % 4) % 4);
    const sigBytes = Uint8Array.from(atob(sigPadded), c => c.charCodeAt(0));
    const data = new TextEncoder().encode(payload);
    if (!(await crypto.subtle.verify('HMAC', key, sigBytes, data))) return false;
    const json = JSON.parse(base64urlDecode(payload));
    return json?.sub === 'owner'
      && Array.isArray(json.amr)
      && json.amr.includes('pwd')
      && json.amr.includes('totp')
      && Number.isInteger(json.exp)
      && json.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

function getCookie(request, name) {
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : '';
}

export default async function middleware(request) {
  const secret = process.env.AMAZONITE_AUTH_SECRET;
  const token = getCookie(request, COOKIE);
  if (await verifySession(token, secret)) return;

  const url = new URL(LOGIN_PATH, request.url);
  url.searchParams.set('next', `${new URL(request.url).pathname}${new URL(request.url).search}`);
  return Response.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
