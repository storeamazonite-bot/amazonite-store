import { createSign } from 'node:crypto';

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const FIELDS = ['timestamp','type','product_id','offer_id','page','destination_domain'];

function configured() { return Boolean(process.env.GOOGLE_SHEETS_SPREADSHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON); }
function provider() { return String(process.env.ANALYTICS_STORAGE_PROVIDER || 'json').trim().toLowerCase(); }
function fail(code, message) { const e = new Error(message); e.code = code; return e; }
function account() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw fail('ANALYTICS_STORAGE_NOT_CONFIGURED','Google service account is not configured');
  return raw.trim().startsWith('{') ? JSON.parse(raw) : JSON.parse(Buffer.from(raw,'base64').toString('utf8'));
}
function b64(value) { return Buffer.from(value).toString('base64url'); }
async function accessToken() {
  const a = account();
  if (!a.client_email || !a.private_key) throw fail('ANALYTICS_STORAGE_NOT_CONFIGURED','Invalid Google service account configuration');
  const now = Math.floor(Date.now()/1000);
  const head = b64(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const claim = b64(JSON.stringify({iss:a.client_email,scope:SCOPE,aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
  const unsigned = `${head}.${claim}`;
  const signer = createSign('RSA-SHA256'); signer.update(unsigned); signer.end();
  const assertion = `${unsigned}.${signer.sign(a.private_key,'base64url')}`;
  const response = await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
  if (!response.ok) throw fail('ANALYTICS_STORAGE_ERROR',`Google token request failed (${response.status})`);
  const body = await response.json();
  if (!body.access_token) throw fail('ANALYTICS_STORAGE_ERROR','Google token response did not contain an access token');
  return body.access_token;
}
async function request(path, options={}) {
  const token = await accessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(process.env.GOOGLE_SHEETS_SPREADSHEET_ID)}${path}`,{...options,headers:{authorization:`Bearer ${token}`,'content-type':'application/json',...(options.headers||{})}});
  const text = await response.text(); const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw fail('ANALYTICS_STORAGE_ERROR',body?.error?.message || `Google Sheets request failed (${response.status})`);
  return body;
}
function tab() { return process.env.GOOGLE_SHEETS_ANALYTICS_TAB || 'Events'; }
function assertReady() { if (provider() !== 'google_sheets' || !configured()) throw fail('ANALYTICS_STORAGE_NOT_CONFIGURED','Persistent analytics storage is not configured'); }
function cleanEvent(input={}) {
  const type = String(input.type || '').trim();
  if (!['product_view','affiliate_click'].includes(type)) throw fail('ANALYTICS_INVALID_EVENT','Unsupported analytics event');
  const productId = String(input.product_id || '').trim().slice(0,128);
  if (!productId) throw fail('ANALYTICS_INVALID_EVENT','product_id is required');
  return [new Date().toISOString(),type,productId,String(input.offer_id||'').trim().slice(0,128),String(input.page||'').trim().slice(0,512),String(input.destination_domain||'').trim().slice(0,253)];
}
export function validateAnalyticsEvent(input) { cleanEvent(input); return true; }
export async function appendAnalyticsEvent(input) {
  assertReady();
  await request(`/values/${encodeURIComponent(`${tab()}!A:F`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,{method:'POST',body:JSON.stringify({values:[cleanEvent(input)]})});
  return {ok:true};
}
export async function readAnalyticsEvents() {
  assertReady();
  const data = await request(`/values/${encodeURIComponent(`${tab()}!A:F`)}`);
  const rows = data.values || [];
  const start = rows.length && rows[0].map(String).join('|') === FIELDS.join('|') ? 1 : 0;
  return rows.slice(start).filter(row=>row.some(cell=>String(cell).trim()!=='')).map(row=>({timestamp:row[0]||null,type:row[1]||'',product_id:row[2]||'',offer_id:row[3]||'',page:row[4]||'',destination_domain:row[5]||''}));
}
export { FIELDS };
