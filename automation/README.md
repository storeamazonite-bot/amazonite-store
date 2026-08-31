# Amazonite Store Automation

This folder defines the free-first automation architecture.

## Daily pipeline

1. **06:00 — Product discovery**
   - Query the configured e-commerce MCP/search source.
   - Keep only products with `orders > 500`, `rating > 4.5`, and `commission > 8%`.
   - Write normalized rows to Google Sheets.
2. **08:00 — Content generation**
   - Read unprocessed rows.
   - Generate Arabic marketing copy with Gemini Flash.
   - Fall back to Groq when Gemini is unavailable or rate-limited.
   - Preserve the affiliate URL verbatim.
3. **12:00 — Publishing**
   - Publish only rows marked `content_ready`.
   - Mark successful rows `published`; retain errors for retry.
4. **Weekly — Conversion review**
   - Read Microsoft Clarity metrics and summarize funnel issues and recommended changes.

## Important implementation boundary

The public `cn-ecommerce-search` skill currently documents Taobao/Tmall/XHS and is zero-config; it does **not** document AliExpress in the installed skill definition. Therefore this project must not pretend it can satisfy the AliExpress requirement through that exact package alone. The architecture keeps the MCP adapter swappable so an AliExpress-capable MCP/search adapter can be used without changing the rest of the pipeline.

## Secrets

Never commit API keys, service-account JSON, affiliate credentials, or Clarity tokens. Use runtime secrets/credentials.

## Free-first policy

- Gemini Flash: use the documented free tier first.
- Groq: use as fallback within its free limits.
- Microsoft Clarity: use for analytics.
- n8n: prefer self-hosted Community Edition if a free runtime is required; n8n Cloud is not a permanently free production plan.
- Make: free plan is available but limited to monthly credits.
