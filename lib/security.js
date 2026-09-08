export function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf('=');
    if (i < 0) return [v, ''];
    try {
      return [v.slice(0, i), decodeURIComponent(v.slice(i + 1))];
    } catch {
      return [v.slice(0, i), ''];
    }
  }));
}

export function isOwner(user) {
  return user?.app_metadata?.role === 'OWNER';
}

export function sessionCookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookies() {
  return [
    'ae_access=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
    'ae_refresh=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
  ];
}
