# Amazonite Store — Architecture Baseline

## Principles
- Security by design
- Automation first
- Data-driven product selection
- Provider adapters to avoid vendor lock-in
- Human approval for irreversible/high-risk actions

## Planned layers
1. Edge: DNS/TLS/security controls
2. Web: Next.js application
3. API: validated server-side business logic
4. Data: PostgreSQL/Supabase
5. Automation: n8n
6. Intelligence: product scoring and market signals
7. Affiliate: provider adapters and link validation
8. Analytics: events, conversions, and performance

## Product flow
Source -> Validate -> Normalize -> Store -> Score -> Review/Test -> Publish -> Track -> Learn

## Security gates
Secrets -> Authentication -> Authorization -> Input validation -> Rate limiting -> Audit logging -> Backup/recovery

## Initial operating mode
Product Intelligence starts in shadow mode: it may collect, score, and report candidates, but it must not perform irreversible publishing or financial actions without an explicit policy gate.
