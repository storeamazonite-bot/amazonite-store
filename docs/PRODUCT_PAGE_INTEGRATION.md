# Product Page Integration

Use these attributes on product UI elements:

- Product container: `data-product-id="AE-001" data-product-view`
- Affiliate CTA: `data-product-id="AE-001" data-affiliate-link`
- Include `/assets/js/affiliate-tracking.js` once per page.

Example:

```html
<article data-product-id="AE-001" data-product-view>
  <a href="VERIFIED_AFFILIATE_URL" data-product-id="AE-001" data-affiliate-link target="_blank" rel="sponsored nofollow noopener">Check price</a>
</article>
<script src="/assets/js/affiliate-tracking.js" defer></script>
```

The affiliate URL must be the verified URL stored for that product. Do not hard-code a generic store affiliate URL for product monetization.

The current browser adapter stores a capped, privacy-safe event buffer in localStorage and emits a `amazonite:analytics` browser event. A server/analytics collector can subscribe later without changing product markup.
