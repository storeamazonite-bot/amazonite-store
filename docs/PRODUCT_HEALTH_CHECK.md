# Product & Affiliate Link Health Check

## What is checked
- Product has a product-level affiliate URL.
- Affiliate URL is reachable over HTTP(S).
- Redirect destination is captured for review.
- Optional source product URL is checked separately.
- A health report is written to `data/health/latest.json`.

## Status rules
- `needs_review`: missing affiliate URL or previously invalid link needs verification.
- `link_invalid`: timeout, network failure or HTTP error from the affiliate URL.
- `active`: reserved for products that have a verified affiliate URL and passed publication checks.
- `out_of_stock`: catalog/product availability signal from an authoritative product source, not inferred from a generic HTTP status.
- `retired`: intentionally removed from merchandising.

## Important limitation
HTTP reachability does **not** prove that a product is in stock, eligible for commission, or that a commission rate is current. Those fields must be checked against the AliExpress affiliate portal/API or another authoritative source available to the project.

## Safe operation
The checker does not log in, purchase, modify merchant data, bypass protections, or expose credentials.
