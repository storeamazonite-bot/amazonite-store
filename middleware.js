import { verifyOwnerSessionEdge } from './lib/owner-session-edge.mjs';

const OWNER_SESSION_COOKIE = 'amazonite_owner_session';

function readCookie(header, name) {
  const prefix = `${name}=`;
  for (const part of String(header || '').split(';')) {
    const value = part.trim();
    if (value.startsWith(prefix)) return value.slice(prefix.length);
  }
  return '';
}

export default async function middleware(request) {
  const secret = process.env.AMAZONITE_AUTH_SECRET;
  const token = request.headers.get('cookie')
    ? readCookie(request.headers.get('cookie'), OWNER_SESSION_COOKIE)
    : '';

  if (await verifyOwnerSessionEdge(token, secret)) return;

  return Response.redirect(new URL('/owner-login.html', request.url), 302);
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
