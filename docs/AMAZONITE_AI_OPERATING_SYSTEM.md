# Amazonite Store — AI Operating System

## Mission
Amazonite Store is a consumer-facing affiliate e-commerce store. It does not recruit or register affiliate marketers.

## Operating model
1. Discover promising products and categories.
2. Verify product identity, availability, destination URL and affiliate URL before publication.
3. Publish useful buying content and product pages.
4. Measure clicks and downstream performance where the available affiliate/reporting data supports it.
5. Detect stale, unavailable or invalid products/links.
6. Replace weak products and continuously test better candidates.
7. Improve UX, SEO, conversion and content quality without inventing claims, reviews or social proof.

## Affiliate-link rule
Every monetized product must have its own verified AliExpress affiliate URL. A generic store-wide affiliate URL is intentionally not used as the product monetization mechanism.

## Governance
- Architecture and implementation decisions are documented before material changes.
- Production changes must preserve the product registry contract.
- API keys, secrets and private credentials must never be committed to the repository.
- Product facts, prices, availability and commission rates are treated as time-sensitive and must be refreshed from an authoritative source before being presented as current.
- No autonomous action may create financial, legal or account commitments without explicit owner approval.

## AI/tool roles
- Stark AI Developer: specifications, architecture governance, acceptance criteria and engineering QA.
- Product Design: UX research, ideation, audits and design QA.
- GitHub: source control, review and release history.
- Automations: scheduled checks and operational alerts where connected.
- Web/research capabilities: current market and product research.

## Continuous improvement loop
`Discover -> Verify -> Publish -> Measure -> Diagnose -> Improve/Replace -> Verify again`

## Definition of "smart"
The store is considered smart when its product catalog, link health, content, UX and analytics can be updated through repeatable rules and monitored workflows, rather than relying on one-time manual edits.
