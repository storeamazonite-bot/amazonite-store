# Amazonite AI Operating Layer — Architecture v1

## Runtime flow

```text
Incoming Task
    ↓
Core Orchestrator
    ↓
Task Queue / Router
    ↓
Agent + Tool Selection
    ↓
Execution
    ↓
Evidence + Result
    ↓
QA / Security Gates
    ↓
Memory Write
    ↓
Metric / Outcome
    ↓
Continuous Improvement
```

## Components

### 1. Core Orchestrator
Owns task decomposition, routing, priorities, conflict resolution, and approval gates.

### 2. Task Queue
Provides a durable contract for queued, running, blocked, verification, completed, and failed work. See `task-queue.schema.json`.

### 3. Agent Registry
Defines who can perform each class of work and the authority level available to that agent.

### 4. Tool Registry
Defines capabilities, provider status, and fallback strategy. Tools are replaceable.

### 5. Shared Memory
Stores reusable decisions, verified facts, task outcomes, experiments, incidents, and tool observations.

### 6. Verification Gates
QA verifies functional outcomes; Security can veto risky operations; sensitive actions require human approval.

### 7. Improvement Loop
Results and metrics feed future routing, tool selection, and experiments. No uncontrolled self-modification is permitted.

## Initial implementation strategy

Start with repository-native JSON/Markdown contracts and deterministic routing. Add a runtime queue and persistence layer only after the contracts are stable. Integrate MCP and workflow automation behind the tool gateway rather than coupling agents directly to providers.

## Launch principle

Amazonite Store remains launch-blocked until product data and affiliate links are verified and the end-to-end conversion path passes QA.
