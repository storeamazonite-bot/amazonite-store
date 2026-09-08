import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');

const security = read('lib/security.js');
const auth = read('lib/auth.js');
const login = read('api/auth/login.js');
const session = read('api/auth/session.js');
const logout = read('api/auth/logout.js');
const products = read('api/products/index.js');
const productById = read('api/products/[id].js');
const schema = read('supabase/schema.sql');

// Authentication identity must come from server-verified Supabase user metadata.
assert.match(security, /app_metadata\?\.role === ['"]OWNER['"]/);
assert.match(auth, /supabaseAdmin\.auth\.getUser\(access\)/);
assert.match(auth, /isOwner\(data\.user\)/);

// Unauthenticated and non-owner requests must be rejected server-side.
assert.match(auth, /status\(401\)\.json\(\{ error: ['"]Authentication required\./);
assert.match(auth, /status\(403\)\.json\(\{ error: ['"]Owner access required\./);
assert.match(products, /const owner = await requireOwner\(req, res\)/);
assert.match(productById, /const owner = await requireOwner\(req, res\)/);

// Public reads are limited to active products; status=all requires owner auth.
assert.match(products, /eq\(['"]status['"], ['"]active['"]\)/);
assert.match(products, /status === ['"]all['"]/);
assert.match(products, /requireOwner\(req, res\)/);
assert.match(productById, /eq\(['"]status['"], ['"]active['"]\)/);

// Login must authenticate through Supabase and reject non-owners before issuing cookies.
assert.match(login, /signInWithPassword/);
assert.match(login, /if \(error \|\| !data\?\.session \|\| !data\?\.user\)/);
assert.match(login, /if \(!isOwner\(data\.user\)\)/);
assert.match(login, /sessionCookie\(['"]ae_access['"]/);
assert.match(login, /sessionCookie\(['"]ae_refresh['"]/);

// Session endpoint must enforce OWNER after resolving the session.
assert.match(session, /resolveSession\(req, res\)/);
assert.match(session, /if \(!isOwner\(user\)\)/);

// Logout must clear both session cookies.
assert.match(logout, /clearSessionCookies\(\)/);
assert.match(security, /ae_access=.*HttpOnly; Secure; SameSite=Lax/);
assert.match(security, /ae_refresh=.*HttpOnly; Secure; SameSite=Lax/);

// Product mutations must be restricted to the owner and validated.
assert.match(products, /req\.method === ['"]POST['"]/);
assert.match(productById, /['"]PUT['"], ['"]PATCH['"], ['"]DELETE['"]/);
assert.match(productById, /ID_RE/);
assert.match(schema, /enable row level security/i);
assert.match(schema, /Public can read active products/);

// The service-role key must stay server-side; no browser code should contain it.
assert.match(read('lib/supabase.js'), /SUPABASE_SERVICE_ROLE_KEY/);
assert.doesNotMatch(read('index.html'), /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE/);

console.log('Owner auth security contract: PASS');
console.log('Covered: 401 unauthenticated, 403 non-owner, OWNER authorization, secure cookies, session/logout, CRUD protection, RLS contract, server-only service key.');
console.log('Note: this is a code/contract test; live Supabase credentials and production runtime are not exercised here.');
