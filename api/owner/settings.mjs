import { isOwnerRequest } from '../../lib/owner-auth.mjs';
import { getSettings, replaceSettings, SETTINGS_KEYS } from '../../lib/google-sheets-settings-store.mjs';

const METHODS = new Set(['GET', 'PUT']);
const MAX_BODY = 12_000;
const LIMITS = { storeName: 120, currency: 3, seoTitle: 180, seoDescription: 2_000, disclosure: 2_000, heroTag: 120, heroTitle: 180, heroHighlight: 180, heroText: 2_000, heroCta: 120, heroUrl: 500, heroImage: 500, heroVideo: 500, visitorCta: 180, description: 2_000, markets: 500 };

function json(response, status, body) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  return response.status(status).json(body);
}

function originAllowed(request) {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (!origin || !host) return true;
  try { return new URL(origin).host === host; } catch { return false; }
}

function readBody(request) {
  const raw = typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {});
  if (raw.length > MAX_BODY) throw new Error('body_too_large');
  return JSON.parse(raw);
}

function cleanPatch(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_settings');
  const out = {};
  for (const key of SETTINGS_KEYS) {
    if (!(key in input)) continue;
    const value = String(input[key] ?? '').trim();
    if (value.length > LIMITS[key]) throw new Error(`invalid_${key}`);
    out[key] = value;
  }
  if ('storeName' in out && !out.storeName) throw new Error('invalid_storeName');
  if ('currency' in out && !/^[A-Z]{3}$/.test(out.currency)) throw new Error('invalid_currency');
  return out;
}

export default async function handler(request, response) {
  if (!METHODS.has(request.method)) return json(response, 405, { ok: false, error: 'method_not_allowed' });
  if (!originAllowed(request)) return json(response, 403, { ok: false, error: 'origin_not_allowed' });
  if (!isOwnerRequest(request)) return json(response, 401, { ok: false, error: 'unauthorized' });

  try {
    if (request.method === 'GET') return json(response, 200, { ok: true, settings: await getSettings() });
    const patch = cleanPatch(readBody(request));
    const current = await getSettings();
    const settings = { ...current, ...patch };
    if (!settings.storeName) throw new Error('invalid_storeName');
    if (!/^[A-Z]{3}$/.test(settings.currency)) throw new Error('invalid_currency');
    await replaceSettings(settings);
    return json(response, 200, { ok: true, settings });
  } catch (error) {
    if (error?.message === 'body_too_large') return json(response, 413, { ok: false, error: 'body_too_large' });
    if (error?.message?.startsWith('invalid_')) return json(response, 400, { ok: false, error: error.message });
    return json(response, 503, { ok: false, error: 'storage_unavailable' });
  }
}
