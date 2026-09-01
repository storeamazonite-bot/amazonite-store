# Amazonite Core Orchestrator — v1

## Mission

Turn an incoming objective into a controlled, traceable execution plan across the Amazonite AI Team.

## Pipeline

1. Accept task.
2. Normalize task type and priority.
3. Load routing rule.
4. Select agent chain and required tools.
5. Evaluate permission/approval requirements.
6. Queue or block the task.
7. Execute the assigned step.
8. Require evidence and a structured result.
9. Send result to QA and/or Security when required.
10. Write reusable outcome to memory.
11. Measure outcome when a metric exists.
12. Close task or create a follow-up task.

## Deterministic safeguards

- Unknown task types go to Core for manual routing.
- Missing required tools block execution rather than guessing.
- Unverified affiliate links cannot be activated.
- Security veto blocks risky operations.
- Human approval blocks financial, irreversible, legal, secret-handling, or other explicitly sensitive actions.
- Failed verification creates a remediation task instead of declaring success.
- No agent may modify its own permissions, governance rules, or approval requirements.

## Agent handoff

Each handoff must include a task envelope and context references. Each completed step returns a result envelope with evidence, changes, risks, and follow-up actions.

## Tool selection

Prefer the smallest reliable tool chain. Prefer connected/native capabilities when they satisfy the task. Evaluate external tools when they materially improve capability, reliability, quality, privacy, latency, or cost.

## Self-improvement boundary

The orchestrator may propose improvements to routing, prompts, workflows, tool selection, and documentation. Changes to governance, permissions, secrets, or irreversible production behavior require an explicit approval path.

## Launch gate

The orchestrator treats `launch-readiness` as a multi-agent verification task. It cannot return GO while any critical gate is failed or an affiliate destination remains unverified.
