# Safe Write Policy

## Purpose

Allow Amazonite agents to make small, reversible repository changes without granting direct unrestricted write access to the default branch.

## Required flow

`plan → create branch → apply allowlisted change → run tests → open PR → review/approval → merge`

## Initial allowlist

Safe writes may create or update files under `docs/ai-team/`, `scripts/ai-team/`, and test/workflow paths explicitly registered by Core.

The adapter must reject:

- direct writes to `main`
- deletion of important files
- changes to secrets or credential stores
- permission/governance changes
- production deployment configuration
- destructive repository operations

## Merge rule

The adapter may prepare a pull request, but merge remains a separate approval-controlled operation.

## Verification

Every safe-write PR should pass applicable automated checks before merge. A failed check blocks the merge path and returns the task to diagnosis.
