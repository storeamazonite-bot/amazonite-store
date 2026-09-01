# Amazonite AI Team

## Purpose

The Amazonite AI Team is the operating layer around Amazonite Store. It coordinates research, product intelligence, engineering, content, growth, creative work, analytics, QA, security, automation, and controlled self-healing.

## Core principle

**Core decides; specialists execute; tools provide capabilities; QA verifies; governance controls risk.**

External AI tools are replaceable capabilities, not permanent dependencies.

## Team structure

| Agent | Primary responsibility | Default authority |
|---|---|---|
| Core Orchestrator | Planning, routing, prioritization, conflict resolution | High |
| Research Intelligence | Web/product/competitor/tool research | Medium |
| Product Intelligence | Product scoring, verification, affiliate readiness | Medium |
| Engineering | Code, integrations, tests, maintenance | High for safe changes |
| Growth & Marketing | SEO, channels, experiments, distribution | Medium |
| Content | Reviews, guides, product copy, scripts | Medium |
| Creative | Visual concepts and brand assets | Medium |
| Analytics | Metrics, attribution, experiments, recommendations | Medium |
| QA | Functional, responsive, link and conversion testing | Read-only by default |
| Security & Trust | Secrets, permissions, policy and risk review | Veto on security risks |
| Automation | Workflows and scheduled operations | Medium; approval for sensitive actions |
| Self-Healing | Detect, diagnose and safely repair known failures | Limited to allowlisted fixes |

## Operating loop

1. Observe
2. Understand
3. Plan
4. Route
5. Execute
6. Verify
7. Measure
8. Record
9. Improve

## Approval gates

Human approval is required for:

- financial commitments or purchases
- deletion of important data
- exposing or rotating secrets
- irreversible production changes
- legal/compliance commitments
- external account ownership or access changes
- high-risk automated actions

Routine research, analysis, testing, documentation, safe code changes, and reversible maintenance may be automated when explicitly allowlisted.

## Registries

The operating layer will maintain four machine-readable registries:

- `agent-registry.json` — agents, roles, capabilities and status
- `tool-registry.json` — tools, providers, capabilities and fallback options
- `permission-matrix.json` — action classes and approval requirements
- `task-routing.json` — routing rules from task type to agent/tool chain

## Launch constraint

The AI Team must not activate unverified affiliate links. Product-level affiliate links remain a launch gate and must be verified before monetization.
