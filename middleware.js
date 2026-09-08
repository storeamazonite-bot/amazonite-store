const COOKIE_NAME = 'amazonite_owner_session';

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return '';
  }
}

function cookieValue(request) {
  const raw = request.headers.get('cookie') || '';
  const item = raw.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE_NAME}=`));
  return item ? safeDecode(item.slice(COOKIE_NAME.length + 1)) : '';
}

function base64urlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(normalized);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

async function validOwnerSession(token) {
  if (!token) return false;
  const dot = token.lastIndexOf('.');
  if (dot <= 0 || dot === token.length - 1) return false;
  const encoded = token.slice(0, dot);
  const supplied = token.slice(dot + 1);
  const secret = process.env.AMAZONITE_AUTH_SECRET;
  if (!secret) return false;

  try {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!await crypto.subtle.verify('HMAC', key, base64urlToBytes(supplied), new TextEncoder().encode(encoded))) return false;
    const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(encoded)));
    const now = Math.floor(Date.now() / 1000);
    return payload?.sub === 'owner' && Number.isInteger(payload.iat) && Number.isInteger(payload.exp) && payload.iat <= now && payload.exp > now;
  } catch {
    return false;
  }
}

async function validInternalToken(request) {
  const expected = process.env.AMAZONITE_INTERNAL_API_TOKEN;
  const supplied = request.headers.get('x-amazonite-internal-token');
  if (!expected || !supplied) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(expected), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const [a, b] = await Promise.all([
    crypto.subtle.sign('HMAC', key, encoder.encode(supplied)),
    crypto.subtle.sign('HMAC', key, encoder.encode(expected))
  ]);
  const aa = new Uint8Array(a); const bb = new Uint8Array(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

export default async function middleware(request) {
  const path = new URL(request.url).pathname;

  if (path === '/api/mcp') {
    if (await validInternalToken(request)) return;
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  }

  if (await validOwnerSession(cookieValue(request))) return;

  const url = new URL('/owner-login.html', request.url);
  url.searchParams.set('next', path);
  return Response.redirect(url);
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/mcp']
};
