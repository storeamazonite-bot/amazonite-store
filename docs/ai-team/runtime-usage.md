# AI Team Runtime Usage

The first runtime is intentionally deterministic: it reads the routing and permission registries and produces an auditable execution plan.

Example:

```bash
node scripts/ai-team/orchestrator.js plan code-change "Fix a broken product CTA"
```

The output contains:

- task ID
- selected agent
- required tools
- approval requirement
- routing rule
- current permission map

This layer does not execute arbitrary external actions. Execution adapters will be added behind explicit tool and permission boundaries.
