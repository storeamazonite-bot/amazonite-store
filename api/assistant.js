export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) return res.status(503).json({ error: 'AI assistant is not configured' });

  const body = req.body || {};
  const message = String(body.message || '').trim().slice(0, 1200);
  const products = Array.isArray(body.products) ? body.products.slice(0, 24) : [];
  if (!message) return res.status(400).json({ error: 'message is required' });

  const catalog = products.map((p, i) =>
    `${i + 1}. ${String(p.name || '').slice(0,120)} | ${String(p.category || '').slice(0,60)} | ${String(p.rating || '')} | ${String(p.price || '')} | ${String(p.orders || '')}`
  ).join('\n');

  const system = `You are Amazonite AI, a commercial shopping assistant inside Amazonite Electronic, an affiliate electronics discovery store.
Rules:
- Help shoppers choose among the supplied catalog.
- Never invent a product, price, rating, orders, availability, discount, review, warranty, commission, or feature that is not in the supplied catalog.
- If the catalog does not contain enough evidence, say so and ask a short clarifying question.
- Do not claim Amazonite sells, ships, refunds, or guarantees the products. The shopper completes the purchase on the merchant/AliExpress page.
- Be concise, helpful, conversion-friendly, and honest.
- You may recommend based on the supplied names, categories, ratings, prices and order counts.
- Reply in the user's language when clear; otherwise use concise English.
CATALOG:\n${catalog || '(empty)'}`;

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 350,
        messages: [{ role: 'system', content: system }, { role: 'user', content: message }],
      }),
    });

    if (!upstream.ok) return res.status(502).json({ error: 'AI provider request failed' });
    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: 'AI provider returned no reply' });
    return res.status(200).json({ reply });
  } catch {
    return res.status(502).json({ error: 'Unable to reach AI provider' });
  }
}
