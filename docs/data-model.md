# Amazonite Store — Initial Data Model

Core entities:

- `products`: canonical product identity and presentation data
- `product_sources`: source/provider identifiers and source URLs
- `product_metrics`: observed price, rating, sales and availability signals
- `market_signals`: trend and competition observations
- `affiliate_links`: provider-specific tracking URLs and validation state
- `commissions`: observed commission rules/results where available
- `content`: SEO and product content lifecycle
- `click_events`: privacy-minimized outbound click events
- `automation_jobs`: workflow state, retries and errors
- `audit_logs`: security-sensitive actions

Design rule: source-specific data stays behind provider adapters; the core product model remains provider-neutral.
