import crypto from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const DEFAULT_TAB = 'Products';

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function serviceAccount() {
  const raw = requiredEnv('GOOGLE_SERVICE_ACCOUNT_JSON');
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.client_email || !parsed.private_key) throw new Error('Invalid service account');
    return parsed;
  } catch {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON');
  }
}

async function accessToken() {
  const account = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: account.client_email,
    scope: SHEETS_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
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
  return {
    spreadsheetId: requiredEnv('GOOGLE_SHEETS_SPREADSHEET_ID'),
    tab: process.env.GOOGLE_SHEETS_TAB?.trim() || DEFAULT_TAB,
  };
}

function range(tab, a1) {
  const escaped = tab.replace(/'/g, "''");
  return `'${escaped}'!${a1}`;
}

async function sheetsRequest(path, options = {}) {
  const token = await accessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config().spreadsheetId}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* handled below */ }
  if (!response.ok) throw new Error(`Google Sheets request failed (${response.status})`);
  return data;
}

export const PRODUCT_COLUMNS = [
  'id', 'name', 'category', 'status', 'affiliate_url', 'original_url', 'price', 'currency',
  'commission_rate', 'rating', 'orders', 'market', 'image_url', 'notes', 'score', 'link_status',
  'link_validation_reason', 'created_at', 'updated_at'
];

function rowToProduct(row) {
  const product = {};
  PRODUCT_COLUMNS.forEach((key, index) => { product[key] = row[index] ?? ''; });
  for (const key of ['price', 'commission_rate', 'rating', 'orders', 'score']) {
    if (product[key] !== '') product[key] = Number(product[key]);
  }
  return product;
}

function productToRow(product) {
  return PRODUCT_COLUMNS.map(key => product[key] ?? '');
}

export async function listProducts() {
  const { tab } = config();
  const data = await sheetsRequest(`/values/${encodeURIComponent(range(tab, 'A:T'))}`);
  const values = Array.isArray(data?.values) ? data.values : [];
  if (!values.length) return [];
  const header = values[0].map(String);
  if (header.join('|') !== PRODUCT_COLUMNS.join('|')) throw new Error('Products sheet schema mismatch');
  return values.slice(1).filter(row => String(row[0] || '').trim()).map(rowToProduct);
}

export async function replaceProducts(products) {
  const { tab } = config();
  const values = [PRODUCT_COLUMNS, ...products.map(productToRow)];
  const clearRange = encodeURIComponent(range(tab, 'A:T'));
  await sheetsRequest(`/values/${clearRange}:clear`, { method: 'POST', body: '{}' });
  const updateRange = encodeURIComponent(range(tab, `A1:T${Math.max(values.length, 1)}`));
  await sheetsRequest(`/values/${updateRange}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ range: range(tab, `A1:T${Math.max(values.length, 1)}`), majorDimension: 'ROWS', values }),
  });
}
