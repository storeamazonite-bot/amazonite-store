# First Controlled Autonomous Workflow

## Workflow: Site Health → Diagnosis → Safe Remediation

### Trigger

A scheduled health check or a reported store error.

### Steps

1. Core creates a `health-check` task.
2. Health Monitor checks configured components and returns evidence.
3. If healthy, record the observation and finish.
4. If unhealthy, Core creates a diagnosis task.
5. Engineering receives only the minimum context required.
6. Engineering proposes a reversible, allowlisted fix.
7. QA verifies the fix and regression surface.
8. If verification passes, the safe change may proceed through the normal deployment path.
9. If verification fails, stop and create a remediation task.
10. Record the incident, fix, verification result, and follow-up in memory.

## Never automatic

This workflow must stop for secrets, financial actions, destructive data changes, irreversible production changes, legal/compliance commitments, or security risks.

## Success criteria

- every run has a task ID
- every failure has evidence
- every remediation has a verification result
- no secret is written to logs or memory
- no unverified affiliate link is activated
- repeated incidents become reusable incident knowledge
