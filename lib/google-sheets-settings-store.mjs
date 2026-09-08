import crypto from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const DEFAULT_TAB = 'Settings';
export const SETTINGS_KEYS = ['storeName', 'visitorCta', 'description', 'markets'];

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function base64url(value) { return Buffer.from(value).toString('base64url'); }

function serviceAccount() {
  try {
    const parsed = JSON.parse(requiredEnv('GOOGLE_SERVICE_ACCOUNT_JSON'));
    if (!parsed.client_email || !parsed.private_key) throw new Error('invalid');
    return parsed;
  } catch { throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON'); }
}

async function accessToken() {
  const account = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ iss: account.client_email, scope: SHEETS_SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64url(signer.sign(account.private_key))}`;
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!response.ok) throw new Error('Google authorization failed');
  const data = await response.json();
  if (!data.access_token) throw new Error('Google authorization returned no token');
  return data.access_token;
}

function config() {
  return { spreadsheetId: requiredEnv('GOOGLE_SHEETS_SPREADSHEET_ID'), tab: process.env.GOOGLE_SHEETS_SETTINGS_TAB?.trim() || DEFAULT_TAB };
}

function range(tab, a1) { return `'${tab.replace(/'/g, "''")}'!${a1}`; }

async function sheetsRequest(path, options = {}) {
  const token = await accessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config().spreadsheetId}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!response.ok) throw new Error(`Google Sheets request failed (${response.status})`);
  return data;
}

function defaults() { return { storeName: 'Amazonite Store', visitorCta: '', description: '', markets: '' }; }

export async function getSettings() {
  const { tab } = config();
  const data = await sheetsRequest(`/values/${encodeURIComponent(range(tab, 'A:B'))}`);
  const values = Array.isArray(data?.values) ? data.values : [];
  const settings = defaults();
  for (const row of values.slice(1)) {
    const key = String(row[0] || '').trim();
    if (SETTINGS_KEYS.includes(key)) settings[key] = String(row[1] ?? '');
  }
  return settings;
}

export async function replaceSettings(settings) {
  const { tab } = config();
  const values = [['key', 'value'], ...SETTINGS_KEYS.map(key => [key, String(settings[key] ?? '')])];
  const clearRange = encodeURIComponent(range(tab, 'A:B'));
  await sheetsRequest(`/values/${clearRange}:clear`, { method: 'POST', body: '{}' });
  const updateRange = encodeURIComponent(range(tab, `A1:B${values.length}`));
  await sheetsRequest(`/values/${updateRange}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ range: range(tab, `A1:B${values.length}`), majorDimension: 'ROWS', values }),
  });
}
