# Amazonite Store — Launch Readiness V1

## Status
**Controlled MVP / Organic Testing Ready**

Production affiliate launch remains gated until affiliate destinations are verified and production-grade shared analytics/authentication are available.

## READY
- Responsive public storefront foundation
- Product/review content structure
- First-party product-view and affiliate-click event model
- Local analytics dashboard
- Product Intelligence scoring and NOVA decision layer
- AliExpress affiliate URL structural validation
- Affiliate-link management and revalidation UI
- Admin pages marked `noindex,nofollow`
- No generic affiliate URL cloaking or blind URL rewriting

## READY WITH DATA NEEDED
- Product catalog expansion to the controlled shortlist
- Exact product-level AliExpress affiliate URLs
- Affiliate commission-rate evidence
- Market/currency/offer metadata
- Organic traffic and click evidence

## BLOCKED FOR PRODUCTION
- Shared server-side analytics database
- Production admin authentication and server-side authorization
- Verified commission attribution for every published affiliate destination
- Production deployment verification when the Vercel connection has the required project scope

## PERFORMANCE GATE
A product should not be declared a winner from a tiny sample. Current V1 decision rules require at least 30 product views and 3 affiliate clicks before performance classification; CTR bands then determine WINNER, PROMOTE, TEST, or DROP.

## PAID MEDIA
Paid advertising remains **LATER**. First establish organic traffic, product-page engagement, affiliate-click evidence, and a repeatable winning-product signal.

## Affiliate Safety Rule
A structurally valid AliExpress URL is not proof of affiliate attribution. Only publish a monetization CTA after the destination has been confirmed through the approved AliExpress affiliate workflow. Preserve the supplied tracking URL exactly.

## Next Engineering Stage
1. Verify current production deployment after Vercel authorization is restored.
2. Connect a shared analytics layer that can persist events across visitors/devices.
3. Add production authentication and server-side authorization for admin operations.
4. Populate the controlled product shortlist with verified affiliate offers.
5. Run organic validation and promote only evidence-backed winners.
