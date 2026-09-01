#!/usr/bin/env node
const assert = require('assert');
const { execFileSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const run = (script, args) => JSON.parse(execFileSync('node', [path.join(root, script), ...args], { encoding: 'utf8' }));

// 1) Create a normal task through the runtime.
const task = run('scripts/ai-team/task-runner.js', ['create', 'research', 'Validate the current launch checklist']);
assert(task.task_id && task.status === 'queued');

// 2) Route the same work through the orchestrator.
const plan = run('scripts/ai-team/orchestrator.js', ['plan', 'research', 'Validate the current launch checklist']);
assert(plan.task.assigned_agent);
assert(plan.routing.tools.includes('web-research'));

// 3) Validate a safe integration request.
const gateway = run('scripts/ai-team/integration-gateway.js', [JSON.stringify({
  request_id: `e2e-${Date.now()}`,
  agent_id: plan.task.assigned_agent,
  capability: 'read',
  input: { query: 'Amazonite launch checklist' }
})]);
assert(gateway.valid === true);

// 4) Read operations must not inherit GitHub safe-write approval.
const execution = run('scripts/ai-team/adapter-executor.js', [JSON.stringify({
  request_id: gateway.request_id,
  agent_id: plan.task.assigned_agent,
  capability: 'read',
  input: { query: 'Amazonite launch checklist' }
})]);
assert(execution.status === 'accepted_for_execution');
assert(execution.verification_required === true);

// 5) GitHub adapter must remain read-only in this stage.
const github = run('scripts/ai-team/adapters/github.js', [JSON.stringify({
  operation: 'inspect_file',
  repository: 'storeamazonite-bot/amazonite-store',
  path: 'docs/ai-team/architecture-v1.md'
})]);
assert(github.status === 'ready_for_provider_execution');
assert(github.capability === 'read');

// 6) Safe-write capability must still require approval.
const blockedWrite = run('scripts/ai-team/adapter-executor.js', [JSON.stringify({
  request_id: `e2e-write-${Date.now()}`,
  agent_id: plan.task.assigned_agent,
  capability: 'safe-write',
  input: { operation: 'inspect_file' }
})]);
assert(blockedWrite.status === 'rejected');
assert(blockedWrite.reason === 'approval_required');

console.log(JSON.stringify({ status: 'PASS', stages: 6 }, null, 2));
