# Agent Communication Protocol

## Objective

Agents communicate through structured task envelopes so work is traceable, routable, verifiable, and resumable.

## Task envelope

```json
{
  "task_id": "unique-id",
  "parent_task_id": null,
  "type": "task-type",
  "priority": "normal",
  "request": "clear objective",
  "context_refs": [],
  "constraints": [],
  "assigned_agent": "agent-id",
  "required_tools": [],
  "approval": "none",
  "status": "queued"
}
```

## Result envelope

```json
{
  "task_id": "unique-id",
  "agent": "agent-id",
  "status": "completed",
  "summary": "result",
  "evidence_refs": [],
  "changes": [],
  "risks": [],
  "follow_up": [],
  "memory_write": null
}
```

## Rules

1. Every task has a unique ID.
2. Agents state what they know versus what they inferred.
3. Important claims include evidence references.
4. Agents do not silently override another agent's decision; conflicts return to Core.
5. QA can reject a result that lacks verification.
6. Security can block unsafe actions.
7. Sensitive operations stop at an approval gate.
8. Failed tasks return a diagnosis and recommended next route.
9. Completed work is recorded in shared memory when it is reusable.
10. Agents must not place secrets in task envelopes, logs, or memory.
