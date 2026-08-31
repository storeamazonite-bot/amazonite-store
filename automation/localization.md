# Amazonite Store — English-first localization

Primary marketing languages for the initial target markets:

- United States: **American English (en-US)** — USD, US spelling and terminology.
- United Kingdom: **British English (en-GB)** — GBP, UK spelling and terminology.
- Canada: **Canadian English (en-CA)** — CAD, Canadian terminology. Keep an architecture path for French (fr-CA) because Canada is bilingual.

Do not use one generic English copy for all three markets. Content generation must receive a `market` value and adapt spelling, currency, terminology, offers, shipping expectations and calls-to-action. Localization is broader than translation and should reflect each market's buying expectations. citeturn0search0

Suggested product content fields:
- `title_en_us`, `description_en_us`, `affiliate_url_us`
- `title_en_gb`, `description_en_gb`, `affiliate_url_uk`
- `title_en_ca`, `description_en_ca`, `affiliate_url_ca`
- future: `title_fr_ca`, `description_fr_ca`, `affiliate_url_ca`

Examples of terminology:
- US: color, favorite, sneakers, apartment
- UK: colour, favourite, trainers, flat
- Canada: generally Canadian English; prefer neutral terminology where regional usage is uncertain.

The storefront should use locale-aware URLs or market selectors where supported, rather than silently mixing markets. Search engines benefit from clear regional/language signals such as localized URLs and hreflang. citeturn0search0turn0search3
