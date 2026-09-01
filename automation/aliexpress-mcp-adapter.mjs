const DEFAULT_URL = 'http://127.0.0.1:8000/mcp';

function endpoint() {
  return process.env.ALIEXPRESS_MCP_URL || DEFAULT_URL;
}

async function readResponse(response) {
  const text = await response.text();
  if (!response.ok) throw new Error(`MCP HTTP ${response.status}: ${text.slice(0, 500)}`);
  const type = response.headers.get('content-type') || '';
  if (type.includes('text/event-stream')) {
    const events = text.split(/\n\n+/).map(x => x.match(/^data:\s*(.+)$/m)?.[1]).filter(Boolean);
    const last = events.at(-1);
    if (!last) throw new Error('MCP returned an empty SSE response');
    return JSON.parse(last);
  }
  return JSON.parse(text);
}

export async function createSession({ url = endpoint() } = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'amazonite-store', version: '1.0.0' },
      },
    }),
  });
  const data = await readResponse(response);
  if (data.error) throw new Error(`MCP initialize failed: ${JSON.stringify(data.error)}`);
  return { url, sessionId: response.headers.get('mcp-session-id') || null, nextId: 2 };
}

async function call(session, method, params = {}) {
  const headers = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
  };
  if (session.sessionId) headers['mcp-session-id'] = session.sessionId;
  const response = await fetch(session.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: session.nextId++, method, params }),
  });
  const data = await readResponse(response);
  if (data.error) throw new Error(`MCP ${method} failed: ${JSON.stringify(data.error)}`);
  return data.result;
}

function unwrap(result) {
  if (!result) return null;
  if (result.structuredContent !== undefined) return result.structuredContent;
  if (Array.isArray(result.content)) {
    const json = result.content.find(x => x.type === 'text' && typeof x.text === 'string');
    if (json) {
      try { return JSON.parse(json.text); } catch { return { text: json.text }; }
    }
  }
  return result;
}

export async function listTools(session) {
  return unwrap(await call(session, 'tools/list'));
}

export async function callTool(session, name, args = {}) {
  return unwrap(await call(session, 'tools/call', { name, arguments: args }));
}

function normalizeProduct(raw = {}) {
  return {
    id: String(raw.id ?? raw.productId ?? raw.itemId ?? ''),
    name: raw.name ?? raw.title ?? '',
    sourceProductUrl: raw.sourceProductUrl ?? raw.url ?? raw.productUrl ?? '',
    affiliateUrl: raw.affiliateUrl ?? null,
    price: Number(raw.price ?? 0) || 0,
    currency: raw.currency ?? process.env.AE_CURRENCY ?? 'USD',
    rating: Number(raw.rating ?? raw.averageRating ?? 0) || 0,
    orders: Number(raw.orders ?? raw.ordersSold ?? raw.sold ?? raw.orderCount ?? 0) || 0,
    reviewCount: Number(raw.reviewCount ?? raw.reviews ?? 0) || 0,
    available: raw.available !== false && raw.stock !== 0,
    stock: raw.stock ?? null,
    store: raw.store ?? null,
    shipping: raw.shipping ?? null,
    commissionPercent: raw.commissionPercent ?? raw.commission ?? null,
    lastCheckedAt: new Date().toISOString(),
  };
}

function rows(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.products)) return value.products;
  if (Array.isArray(value?.items)) return value.items;
  if (value?.product) return [value.product];
  return [];
}

export async function searchAliExpress(query, { sort = 'orders', page = 1 } = {}) {
  const session = await createSession();
  await call(session, 'notifications/initialized').catch(() => null);
  const result = await callTool(session, 'search_aliexpress', { query, sort, page });
  return rows(result).map(normalizeProduct);
}

export async function getAliExpressProduct(productIdOrUrl) {
  const session = await createSession();
  await call(session, 'notifications/initialized').catch(() => null);
  const result = await callTool(session, 'get_aliexpress_product', { productIdOrUrl });
  const product = rows(result)[0] ?? result;
  return normalizeProduct(product);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (command === 'tools') {
      const s = await createSession();
      console.log(JSON.stringify(await listTools(s), null, 2));
    } else if (command === 'search') {
      console.log(JSON.stringify(await searchAliExpress(args.join(' ')), null, 2));
    } else if (command === 'product') {
      console.log(JSON.stringify(await getAliExpressProduct(args.join(' ')), null, 2));
    } else {
      console.log('Usage: node automation/aliexpress-mcp-adapter.mjs tools | search <query> | product <id-or-url>');
    }
  } catch (error) {
    console.error(`AliExpress MCP adapter error: ${error.message}`);
    process.exitCode = 1;
  }
}
