# Execution Adapter Layer

## What this stage is for

The adapter layer is the controlled bridge between an AI agent's plan and a real external action. It prevents agents from calling providers directly and gives Amazonite one place to enforce permissions, validation, logging, retries, and verification.

## Adapter contract

Each adapter should expose:

1. `capability` — what it can do.
2. `input_schema` — accepted arguments.
3. `permission_class` — required authority.
4. `execute()` — the smallest possible external action.
5. `result_schema` — structured output.
6. `evidence` — references proving what happened.
7. `rollback` — when a safe rollback exists.
8. `verification` — how success is checked.

## First adapter families

- `github-read` — repository inspection.
- `github-write-safe` — allowlisted reversible repository changes.
- `web-research` — source retrieval and verification.
- `automation` — scheduled/conditional workflows.
- `affiliate-verification` — validate product-to-affiliate mapping before activation.

## Safety boundary

Adapters never receive raw secrets through task payloads. Secrets belong in the execution environment. Financial, destructive, irreversible, security-sensitive, or legal actions require an approval gate before the adapter can execute.

## Execution lifecycle

`planned → authorized → executing → result-recorded → verification → completed/failed`

Retries must be bounded and idempotency should be preferred for repeatable actions.
