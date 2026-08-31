# Amazonite Store — Conversion Tracking

## Funnel
`landing_view -> product_view -> affiliate_click -> sale_signal -> commission_signal`

The store can reliably own and measure the first three events. Sale and commission data must come from an authoritative affiliate reporting source/API; the frontend must never fabricate them.

## Product-level attribution
Every outbound affiliate click should carry the product ID in the store's own analytics event. Do not rely on a generic affiliate destination to identify the product.

## Privacy
Do not collect passwords, payment information, access tokens, or unnecessary personally identifying information in client-side analytics.

## KPI definitions
- CTR = affiliate clicks / product views
- Product conversion = reported sales / affiliate clicks, only when sale data is available
- EPC = reported commission / affiliate clicks, only when commission data is available
- ROI = (reported commission - ad spend) / ad spend, only for campaigns with actual spend and commission data
