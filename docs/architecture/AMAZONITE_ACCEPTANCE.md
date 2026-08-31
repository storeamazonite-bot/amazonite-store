# Amazonite Store — Acceptance Criteria

## Storefront
- [ ] Homepage clearly presents Amazonite Store as a consumer shopping/recommendation destination.
- [ ] No copy suggests visitors can register as affiliate marketers.
- [ ] Navigation works on mobile and desktop.
- [ ] Main CTA leads to a real product/category destination.

## Product links
- [ ] Every published product has a unique stable Product ID.
- [ ] Every active purchase CTA maps to exactly one verified affiliate URL.
- [ ] Product name/category and affiliate URL are manually matchable.
- [ ] Missing or unverified links show a safe inactive state rather than a guessed URL.
- [ ] A merchant/store-level affiliate URL, if used, is stored separately from product URLs.

## Trust and compliance
- [ ] Affiliate disclosure is visible before or around the purchase journey.
- [ ] No fake testimonials, invented review counts, or unverifiable performance claims.
- [ ] Product claims are checked against a reliable source before publication.
- [ ] API keys and credentials are never shipped to the browser.

## UX and quality
- [ ] Responsive at phone, tablet, and desktop widths.
- [ ] Keyboard focus is visible for interactive controls.
- [ ] CTA buttons have readable contrast and clear labels.
- [ ] Broken internal links are eliminated before launch.
- [ ] External affiliate links use safe new-tab behavior where appropriate.
- [ ] Production smoke test confirms the homepage, categories, reviews, and purchase CTAs.

## Launch gate
The storefront is **not considered fully active for sales** until all published purchase CTAs point to verified affiliate destinations and the final link/UX/SEO review passes.
