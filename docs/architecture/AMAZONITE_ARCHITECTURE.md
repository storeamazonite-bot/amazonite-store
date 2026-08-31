# Amazonite Store — Architecture Baseline

## Product intent
Amazonite Store is a consumer-facing affiliate commerce site. It does **not** recruit or manage affiliate marketers. Visitors discover products, compare useful information, and click verified affiliate offers to the merchant.

## Current repository evidence
- Static HTML/CSS site on `main`.
- `index.html` is the current storefront entry point.
- `assets/style.css` contains the shared visual system.
- `reviews/haylou-s30.html` is the first long-form product review.
- The current review explicitly keeps the buying link inactive until the affiliate offer is verified.

## Target architecture

### 1. Presentation layer
- Responsive storefront homepage.
- Category landing pages.
- Product/review pages.
- Search/filter UI.
- Clear CTA hierarchy.
- Mobile-first navigation.

### 2. Product catalog layer
Every product must have a stable internal ID and structured metadata:

```text
productId
name
slug
category
subcategory
image
priceDisplay
currency
rating
shortDescription
pros
cons
affiliateUrl
storeUrl (optional)
status
lastVerifiedAt
```

Affiliate URLs are data, not hard-coded ad-hoc into unrelated page markup.

### 3. Affiliate routing
- Product-level affiliate URL is the primary purchase destination.
- A separate store-level affiliate URL may be configured for a merchant/store CTA.
- Empty/unverified URLs must never silently redirect visitors to an arbitrary seller.
- Affiliate disclosure remains visible and truthful.
- Do not expose API keys or private credentials in frontend code.

### 4. Measurement
The site should be prepared for first-party click measurement using a stable product ID and CTA event before redirecting to the merchant. No personally identifying data is required for the initial implementation.

### 5. Content/SEO
Each important product should have a canonical URL, unique title/description, useful buying context, structured data where accurate, internal links, and category context. Claims must be verified before publication.

## Design system
Brand baseline:
- Navy: `#0A1E2E`
- Background: `#E6F0FA`
- Teal: `#2A9D8F`
- Orange CTA: `#FF7A2F`
- Gold: `#D4AF37`
- Confirmed: `#10B981`
- Pending: `#F59E0B`

## Operational rules
1. Never mix a product affiliate URL with a different product.
2. Never replace a verified affiliate URL based on name similarity alone.
3. Store URL is maintained separately from product URLs.
4. Product changes should be reversible and reviewed before production publication.
5. Secrets belong in server-side/environment configuration, never in static HTML.

## Rollout order
1. Normalize catalog and product IDs.
2. Add affiliate-link configuration and validation.
3. Upgrade product/category navigation.
4. Add click measurement.
5. Add SEO/content enhancements.
6. Run responsive/accessibility/link QA.
7. Publish only after all purchase CTAs resolve to verified destinations.
