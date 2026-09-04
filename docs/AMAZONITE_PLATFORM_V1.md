# Amazonite Affiliate Commerce Platform — V1

## Mission
Amazonite is an affiliate-commerce discovery platform. The visitor discovers and evaluates products on Amazonite, then chooses **Discover Product** to continue to the merchant through the approved affiliate destination.

## Core flow
Visitor → Discovery → Product page → Discover Product → Affiliate destination → Merchant → Purchase/commission

## Product lifecycle
`draft` → `review` → `active` → `testing` → `winner` / `dropped` → `archived`

No automatic import publishes directly. Imported products enter `draft` and require verification before publication.

## Affiliate offer model
A product can have one or more offers. The first provider is AliExpress, but the data model is merchant/network agnostic.

Required offer fields:
- provider
- original_url
- affiliate_url
- market
- currency
- commission_rate
- status
- last_validated_at
- link_status
- link_validation_reason

Affiliate URLs must remain intact. No generic cloaking, shortening, rewriting, or redirect layer should be introduced without confirming the applicable affiliate-program rules.

### V1 link validation
The current validator performs structural checks before an offer can be marked ready:
- valid URL syntax
- HTTPS required
- approved AliExpress destination host
- exact supplied destination preserved

`READY` means the URL passed structural/domain validation. It does **not** prove that affiliate attribution or commission tracking is active; that still requires verification through the approved affiliate workflow.

## Product intelligence
Initial score inputs:
- demand: 25%
- orders/sales evidence: 20%
- rating: 15%
- commission: 15%
- value/price: 10%
- trend: 10%
- competition: 5%

Decision bands:
- 90–100: WINNER
- 75–89: STRONG TEST
- 60–74: TEST
- below 60: DROP

The score is a decision aid, not a claim about guaranteed profitability.

## NOVA performance decision layer
Observed performance is evaluated separately from product quality. V1 uses conservative minimum sample gates:
- at least 30 product views
- at least 3 affiliate clicks

Performance decisions:
- CTR ≥ 8%: WINNER
- CTR ≥ 5% and < 8%: PROMOTE
- CTR < 1%: DROP
- otherwise: TEST
- below minimum sample: COLLECT DATA

A product with a non-READY affiliate destination is blocked from performance promotion even if its product-quality score is high.

## Admin modules
1. Overview / Command Center
2. Products
3. Add Affiliate Product (manual + automatic import)
4. Affiliate Links / Offers
5. Marketing
6. Analytics
7. Automation
8. Settings

## Tracking events
Use first-party event names that do not alter the affiliate destination:
- `product_view`
- `affiliate_click`
- `search`
- `category_view`
- `campaign_visit`

Recommended event payload:
`product_id`, `offer_id`, `source`, `medium`, `campaign`, `market`, `device`, `timestamp`, `page`.

V1 currently stores events in browser `localStorage`. This is suitable for controlled MVP validation, but it is not shared production analytics across visitors/devices.

## Security boundary
The public storefront must never expose admin controls. Production admin requires authentication and server-side authorization before real data, affiliate configuration, or integrations are connected.

## Current implementation status
Implemented in V1:
- first-party product-view/click instrumentation
- AliExpress structural affiliate-link validator
- affiliate-link status and validation metadata in product data
- Admin link revalidation
- Product + link + observed-performance NOVA decision layer
- launch-gate overview

Still required for production:
- verified affiliate destinations with confirmed attribution
- shared/server-side analytics
- production authentication and server-side admin authorization
- automated product import and price monitoring

## Launch gates
1. Verified catalog
2. Verified affiliate destinations
3. Mobile UX
4. Analytics/event tracking
5. Organic content validation
6. Small paid test only after evidence

## V1 principle
Build the foundation once, keep the catalog and offer model provider-agnostic, and let NOVA coordinate product research, content, SEO/GEO, creative, CRO, analytics and growth decisions.