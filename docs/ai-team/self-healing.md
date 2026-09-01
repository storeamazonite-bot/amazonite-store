# Self-Healing Controller

## What this stage is for

Self-healing turns verified failures into controlled recovery actions. It does **not** give an AI unrestricted permission to modify the system.

## Flow

`Failure → Classification → Safe-action check → Recovery plan → Verification → Record`

## Initial allowlist

- `rerun-verification`
- `requeue-failed-task`
- `refresh-health-check`

These actions are recovery/diagnostic operations rather than arbitrary code changes.

## Approval boundary

Unknown failures, destructive changes, production-impacting changes, financial actions, secret operations, security-sensitive actions, and legal/compliance actions are `approval-required`.

## Failure classes

- `verification` — expected outcome was not proven.
- `execution` — task failed during execution.
- `health` — an AI Team contract or component is degraded.
- `unknown` — no trusted recovery rule exists.

Unknown failures must not be guessed around; they return to Core for diagnosis and, where needed, human approval.
