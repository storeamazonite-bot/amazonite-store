# n8n schedule specification

Use three Schedule Trigger workflows (or one workflow with three branches) in the target n8n runtime:

- `06:00`: discover + filter products + write Google Sheets.
- `08:00`: read pending rows + Gemini Flash content generation + Groq fallback + update Sheets.
- `12:00`: read `content_ready` rows + publish + mark `published`.

For a truly zero-cost runtime, use n8n Community Edition self-hosted. n8n Cloud currently offers trials/plans, but not a permanently free production tier.

Credentials required at runtime:
- Google Sheets OAuth/service account
- Gemini API key
- Groq API key
- Affiliate credentials/tracking ID
- Store publishing API credentials
- Clarity project/analytics access where applicable

Do not put any of these secrets in Git.
