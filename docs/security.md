# Amazonite Store — Security Baseline

## Secrets
- Never commit `.env` or provider credentials.
- Production secrets belong in the deployment platform's secret store.
- Rotate credentials after suspected exposure.

## Application
- Validate all external input.
- Use parameterized queries/ORM safely.
- Apply authentication and RBAC to protected operations.
- Apply rate limits to public and sensitive endpoints.
- Do not expose provider secrets to browser code.

## Infrastructure
- Keep only required services and ports exposed.
- Prefer SSH keys over password authentication on managed servers.
- Keep operating system and dependencies patched.
- Use firewall controls and intrusion-prevention tooling where applicable.

## Data
- Enable database row-level policies where user isolation is required.
- Store the minimum personal data necessary.
- Maintain encrypted backups and periodically test restoration.

## Automation safety
- Workflows must be idempotent where practical.
- Sensitive actions require policy validation.
- Provide a kill switch for automation.
- Log failures without logging secrets.

## Incident response
Detect -> Contain -> Rotate credentials -> Restore/patch -> Verify -> Resume -> Document
