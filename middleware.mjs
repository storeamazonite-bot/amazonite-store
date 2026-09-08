const COOKIE_NAME = 'amazonite_owner_session';

function cookieValue(request) {
  const raw = request.headers.get('cookie') || '';
  const item = raw.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE_NAME}=`));
  return item ? decodeURIComponent(item.slice(COOKIE_NAME.length + 1)) : '';
}

function base64urlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(normalized);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

async function validSession(token) {
  if (!token) return false;
  const dot = token.lastIndexOf('.');
  if (dot <= 0 || dot === token.length - 1) return false;

  const encoded = token.slice(0, dot);
  const supplied = token.slice(dot + 1);
  const secret = process.env.AMAZONITE_AUTH_SECRET;
  if (!secret) return false;

  try {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const signatureOk = await crypto.subtle.verify('HMAC', key, base64urlToBytes(supplied), new TextEncoder().encode(encoded));
    if (!signatureOk) return false;
    const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(encoded)));
    const now = Math.floor(Date.now() / 1000);
    return payload?.sub === 'owner' && Number.isInteger(payload.iat) && Number.isInteger(payload.exp) && payload.iat <= now && payload.exp > now;
  } catch {
    return false;
  }
}

export default async function middleware(request) {
  if (await validSession(cookieValue(request))) return;
  const url = new URL('/owner-login.html', request.url);
  url.searchParams.set('next', new URL(request.url).pathname);
  return Response.redirect(url);
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
};
