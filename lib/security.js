export function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf('=');
    return i < 0 ? [v, ''] : [v.slice(0, i), decodeURIComponent(v.slice(i + 1))];
  }));
}

export function isOwner(user) {
  return user?.app_metadata?.role === 'OWNER';
}

export function sessionCookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookies() {
  return [
    'ae_access=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    'ae_refresh=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
  ];
}
