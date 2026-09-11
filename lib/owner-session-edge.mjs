const textEncoder = new TextEncoder();

function base64urlToBytes(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64urlToText(value) {
  return new TextDecoder().decode(base64urlToBytes(value));
}

async function signature(payload, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const bytes = await crypto.subtle.sign('HMAC', key, textEncoder.encode(payload));
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyOwnerSessionEdge(token, secret, now = Math.floor(Date.now() / 1000)) {
  if (!token || typeof token !== 'string' || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;

  const [payload, providedSignature] = parts;
  try {
    const expectedSignature = await signature(payload, secret);
    if (!constantTimeEqual(providedSignature, expectedSignature)) return false;

    const data = JSON.parse(base64urlToText(payload));
    return data?.sub === 'owner' && Number.isInteger(data.exp) && data.exp > now;
  } catch {
    return false;
  }
}
