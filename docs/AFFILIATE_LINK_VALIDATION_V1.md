# Amazonite Affiliate Link Validation V1

## Purpose
Prevent unverified or unsafe affiliate destinations from being treated as launch-ready.

## Rules
- URL must be syntactically valid.
- HTTPS is required.
- V1 recognizes AliExpress destinations only.
- Accepted host patterns: `aliexpress.com`, `*.aliexpress.com`, `aliexpress.us`, `*.aliexpress.us`, and `s.click.aliexpress.com`.
- The validator does not rewrite, cloak, shorten, or append tracking parameters.
- A `READY` result means the URL passes structural/domain checks; it does **not** prove that the affiliate commission tracking is active.
- `REVIEW` means manual verification is required.
- `INVALID` means the supplied value is not a usable URL.

## Launch principle
Only links confirmed through the approved AliExpress affiliate workflow should be published as affiliate destinations. Structural validation is a gate, not a substitute for affiliate-network verification.
