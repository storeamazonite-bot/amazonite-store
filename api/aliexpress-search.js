export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = process.env.AMAZONITE_INTERNAL_API_TOKEN?.trim();
  const suppliedToken = req.headers['x-amazonite-internal-token'];
  if (!accessToken || suppliedToken !== accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.ALIEXPRESS_SCRAPER_API_KEY?.trim();
  if (!apiKey) return res.status(503).json({ error: 'AliExpress scraper is not configured' });

  const query = String(req.query?.query || '').trim();
  const page = String(req.query?.page || '1');
  const countryCode = String(req.query?.country_code || process.env.AE_COUNTRY_CODE || 'US').trim().toUpperCase();
  const sortBy = String(req.query?.sort_by || 'most_orders').trim();

  if (!query) return res.status(400).json({ error: 'query is required' });
  if (!['best_match', 'most_orders', 'price_low_to_high', 'price_high_to_low'].includes(sortBy)) {
    return res.status(400).json({ error: 'invalid sort_by' });
  }

  const base = (process.env.ALIEXPRESS_SCRAPER_API_BASE || 'https://aliexpress-scraper-api.omkar.cloud').replace(/\/$/, '');
  const params = new URLSearchParams({ query, page, country_code: countryCode, sort_by: sortBy });

  try {
    const upstream = await fetch(`${base}/aliexpress/v2/search?${params}`, {
      headers: { accept: 'application/json', 'API-Key': apiKey },
    });
    const text = await upstream.text();
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'AliExpress source request failed' });

    let data;
    try { data = JSON.parse(text); } catch { return res.status(502).json({ error: 'AliExpress returned invalid JSON' }); }

    // Return only public product data; never return request headers, API keys, or runtime env values.
    const results = Array.isArray(data?.results) ? data.results : [];
    return res.status(200).json({ results, count: results.length, page: Number(page), country_code: countryCode });
  } catch {
    return res.status(502).json({ error: 'Unable to reach AliExpress source' });
  }
}
