# Amazonite Store — AliExpress MCP Integration

## Purpose

Provide a replaceable, read-only AliExpress data adapter for Product Intelligence without coupling the storefront to the MCP runtime.

## Runtime contract

The adapter should expose these logical operations:

- `search_aliexpress(query, sort, page)` → normalized product candidates.
- `get_aliexpress_product(productIdOrUrl)` → normalized product details.

The current reference implementation is the open-source `jnslmk/aliexpress-mcp` server. It is self-hosted and uses AliExpress web/internal endpoints, so it must be treated as an experimental upstream: low request volume, graceful failure, and no dependency from the public storefront.

## Normalized product shape

```json
{
  "id": "string",
  "name": "string",
  "sourceProductUrl": "string",
  "affiliateUrl": null,
  "price": 0,
  "currency": "USD",
  "rating": 0,
  "orders": 0,
  "reviewCount": 0,
  "available": true,
  "stock": null,
  "store": null,
  "shipping": null,
  "commissionPercent": null,
  "lastCheckedAt": "ISO-8601"
}
```

## Hard publication gates

A candidate cannot become `active` until all of these are verified:

1. orders > 500
2. rating > 4.5
3. commission > 8%
4. product-level AliExpress Affiliate URL exists and is preserved verbatim
5. current availability is verified
6. product identity matches the source URL

MCP product data alone does **not** establish affiliate commission. Commission must come from the authoritative affiliate workflow/portal or an explicitly verified affiliate source.

## Winning Score

After hard gates, Product Intelligence scores candidates using:

- Trend Momentum: 20%
- Google Demand: 20%
- Market Evidence: 20%
- Reviews/Rating: 10%
- Affiliate Commission: 15%
- Profit Potential: 10%
- Competition: 5%

Decision bands:

- 85–100: Winner
- 75–84.9: Strong
- 65–74.9: Test
- <65: Reject

## Failure policy

If MCP is unavailable, stale, blocked, or returns incomplete data:

- do not publish;
- keep the existing storefront unchanged;
- record the failure for retry/health monitoring;
- never fabricate price, commission, orders, stock, or Affiliate URLs.
