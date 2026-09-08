import { readFile } from 'node:fs/promises';

const CATALOG_PATH = new URL('../data/products.json', import.meta.url);
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

export const PRODUCT_FIELDS = [
  'id','name','category','status','affiliateUrl','sourceProductUrl','price','currency',
  'commissionRate','rating','orders','market','imageUrl','lastCheckedAt',
  'intelligenceScore','intelligenceDecision','notes'
];

function provider() {
  return String(process.env.PRODUCT_STORAGE_PROVIDER || 'json').trim().toLowerCase();
}
function googleConfigured() {
  return Boolean(process.env.GOOGLE_SHEETS_SPREADSHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
}
function normalizeRow(row = {}) {
  const value = (key, fallback = null) => row[key] === undefined ? fallback : row[key];
  const numberOrNull = (input) => {
    if (input === '' || input === null || input === undefined) return null;
    const n = Number(input); return Number.isFinite(n) ? n : null;
  };
  return {
    id: String(value('id','')).trim(), name: String(value('name','')).trim(),
    category: String(value('category','')).trim(), status: String(value('status','draft')).trim(),
    affiliateUrl: value('affiliateUrl'), sourceProductUrl: value('sourceProductUrl'),
    price: numberOrNull(value('price')), currency: String(value('currency','USD')).trim() || 'USD',
    commissionRate: numberOrNull(value('commissionRate')), rating: numberOrNull(value('rating')),
    orders: numberOrNull(value('orders')), market: String(value('market','')).trim(),
    imageUrl: value('imageUrl'), lastCheckedAt: value('lastCheckedAt'),
    intelligence: {
      score: numberOrNull(value('intelligenceScore',0)) ?? 0,
      decision: String(value('intelligenceDecision','watch')).trim() || 'watch', signals: {}, reasons: []
    }, notes: String(value('notes','')).trim()
  };
}
function flattenProduct(product) {
  return [product.id,product.name,product.category,product.status,product.affiliateUrl??'',product.sourceProductUrl??'',
    product.price??'',product.currency??'USD',product.commissionRate??'',product.rating??'',product.orders??'',product.market??'',
    product.imageUrl??'',product.lastCheckedAt??'',product.intelligence?.score??0,product.intelligence?.decision??'watch',product.notes??''];
}
async function readJsonCatalog() {
  const text = await readFile(CATALOG_PATH,'utf8'); const catalog = JSON.parse(text);
  return {schemaVersion:catalog.schemaVersion,affiliateProgram:catalog.affiliateProgram,linkPolicy:catalog.linkPolicy,
    intelligence:catalog.intelligence,statuses:catalog.statuses,products:(catalog.products||[]).map(normalizeRow)};
}
function base64Url(input) { return Buffer.from(input).toString('base64url'); }
function parseServiceAccount() {
  const raw=process.env.GOOGLE_SERVICE_ACCOUNT_JSON; if(!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not configured');
  return raw.trim().startsWith('{') ? JSON.parse(raw) : JSON.parse(Buffer.from(raw,'base64').toString('utf8'));
}
async function googleAccessToken() {
  const account=parseServiceAccount(); if(!account.client_email||!account.private_key) throw new Error('Invalid Google service account configuration');
  const now=Math.floor(Date.now()/1000),header=base64Url(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const claim=base64Url(JSON.stringify({iss:account.client_email,scope:GOOGLE_SHEETS_SCOPE,aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
  const unsigned=`${header}.${claim}`; const {createSign}=await import('node:crypto'); const signer=createSign('RSA-SHA256'); signer.update(unsigned); signer.end();
  const assertion=`${unsigned}.${signer.sign(account.private_key,'base64url')}`;
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
  if(!response.ok) throw new Error(`Google token request failed (${response.status})`); const body=await response.json();
  if(!body.access_token) throw new Error('Google token response did not contain an access token'); return body.access_token;
}
async function googleRequest(path,options={}) {
  const token=await googleAccessToken(); const response=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(process.env.GOOGLE_SHEETS_SPREADSHEET_ID)}${path}`,
    {...options,headers:{authorization:`Bearer ${token}`,'content-type':'application/json',...(options.headers||{})}});
  const text=await response.text(); const body=text?JSON.parse(text):null;
  if(!response.ok) throw new Error(body?.error?.message||`Google Sheets request failed (${response.status})`); return body;
}
async function readGoogleProducts() {
  const tab=process.env.GOOGLE_SHEETS_TAB||'Products'; const range=encodeURIComponent(`${tab}!A:Q`); const data=await googleRequest(`/values/${range}`);
  const rows=data.values||[]; if(!rows.length) return []; const headers=rows[0].map(String);
  return rows.slice(1).filter(row=>row.some(cell=>String(cell).trim()!=='')).map(row=>{const item={};headers.forEach((header,index)=>{item[header]=row[index]??'';});return normalizeRow(item);});
}
function assertWritable() {
  if(provider()==='google_sheets'&&googleConfigured()) return; const error=new Error('Persistent product storage is not configured'); error.code='PRODUCT_STORAGE_NOT_CONFIGURED'; throw error;
}
export async function getProductCatalog() {
  if(provider()==='google_sheets') {
    if(!googleConfigured()){const error=new Error('Google Sheets storage is selected but not configured');error.code='PRODUCT_STORAGE_NOT_CONFIGURED';throw error;}
    const catalog=await readJsonCatalog(); return {...catalog,products:await readGoogleProducts()};
  }
  return readJsonCatalog();
}
export async function createProduct(product) {
  assertWritable(); const tab=process.env.GOOGLE_SHEETS_TAB||'Products'; const next=normalizeRow(product);
  await googleRequest(`/values/${encodeURIComponent(`${tab}!A:Q`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,{method:'POST',body:JSON.stringify({values:[flattenProduct(next)]})}); return next;
}
export async function updateProduct(id,product) {
  assertWritable(); const products=await readGoogleProducts(); const index=products.findIndex(item=>item.id===id);
  if(index<0){const error=new Error('Product not found');error.code='PRODUCT_NOT_FOUND';throw error;}
  const tab=process.env.GOOGLE_SHEETS_TAB||'Products',rowNumber=index+2,next=normalizeRow({...products[index],...product,id});
  await googleRequest(`/values/${encodeURIComponent(`${tab}!A${rowNumber}:Q${rowNumber}`)}?valueInputOption=USER_ENTERED`,{method:'PUT',body:JSON.stringify({range:`${tab}!A${rowNumber}:Q${rowNumber}`,values:[flattenProduct(next)]})}); return next;
}
export async function deleteProduct(id) {
  assertWritable(); const products=await readGoogleProducts(); if(!products.some(item=>item.id===id)){const error=new Error('Product not found');error.code='PRODUCT_NOT_FOUND';throw error;}
  const error=new Error('Product deletion requires Google Sheets batchUpdate configuration'); error.code='PRODUCT_DELETE_NOT_CONFIGURED'; throw error;
}
