# Pre-Affiliate Conversion UX Gate

## Purpose
Keep the store useful and trustworthy before verified affiliate offers are active, without sending visitors to unverified destinations.

## Required behavior
- Product pages must provide useful editorial content even when no affiliate offer is active.
- Buying CTAs remain visibly unavailable until the exact affiliate destination is verified.
- Visitors should have clear paths back to the catalog and relevant categories.
- Reviews should explain trade-offs rather than presenting affiliate claims as independent facts.
- Affiliate disclosure must remain visible where relevant.
- No generic seller URL may be substituted for a missing product-level affiliate URL.

## Post-approval transition
When a product has a verified affiliate URL, the CTA may become active only after product identity, destination, and verification timestamp are recorded.

## Audit evidence
Run `node scripts/ai-team/preaffiliate-ux-audit.js` from the repository root. A guarded review CTA is required while affiliate verification is incomplete.
