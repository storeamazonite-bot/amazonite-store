# Amazonite AI Team Control Center

## What this stage is for

The Control Center gives Core one operational snapshot of the AI Team: agents, tools, routing, permissions, runtime activity, verification, and self-healing components.

It is an observability layer, not an unrestricted admin panel.

## Snapshot

Run:

```bash
node scripts/ai-team/control-center.js
```

The snapshot reports:

- agent totals and active agents
- tool totals and connected/available tools
- routing rules
- permission rules
- task/event activity
- presence of health, orchestration, verification, and self-healing runtimes
- launch guard status

## Design principles

1. Read-only by default.
2. No secrets are exposed.
3. Operational actions remain behind the existing permission and approval system.
4. Metrics become inputs to the continuous-improvement loop.
5. Launch readiness is a separate gate from AI Team health.
