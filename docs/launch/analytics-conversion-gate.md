# Analytics + Conversion Tracking Gate

## Purpose
Measure the store funnel without collecting unnecessary personal data.

## Required events
- `page_view` — page path and page type only.
- `product_view` — stable internal product ID and category.
- `cta_view` — CTA location and product ID.
- `affiliate_click` — internal product ID, destination class, and CTA location; never raw personal identifiers.
- `affiliate_blocked` — internal product ID and reason (`unverified`, `missing_url`, or `policy_block`).
- `search` — normalized query category where possible; avoid raw personal data.

## Rules
- Do not collect names, email addresses, phone numbers, passwords, payment data, or full URLs containing tokens.
- Do not log affiliate URLs if they can contain tracking identifiers unnecessarily.
- Keep product IDs stable and non-personal.
- Consent requirements must be respected for any analytics provider that uses cookies or other non-essential tracking.
- Analytics must never activate an unverified affiliate destination.

## Funnel KPIs
1. Landing sessions / page views.
2. Product view rate.
3. CTA view rate.
4. Verified affiliate click-through rate.
5. Affiliate clicks by product/category.
6. Blocked-click rate, used as a data-quality signal.

## Launch status
Provider configuration and production measurement are intentionally pending until the deployment/analytics provider is selected and configured. The repository must not claim live analytics coverage without real evidence.
