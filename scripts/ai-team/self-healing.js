#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const docs = path.join(root, 'docs/ai-team');
const stateDir = path.join(root, '.amazonite-ai');
const eventsFile = path.join(stateDir, 'events.jsonl');
fs.mkdirSync(stateDir, { recursive: true });

const now = () => new Date().toISOString();
const append = value => fs.appendFileSync(eventsFile, JSON.stringify(value) + '\n');

const allowlist = new Set([
  'rerun-verification',
  'requeue-failed-task',
  'refresh-health-check'
]);

function classify(failure) {
  if (failure === 'verification_failed') return { class: 'verification', action: 'rerun-verification' };
  if (failure === 'task_failed') return { class: 'execution', action: 'requeue-failed-task' };
  if (failure === 'health_degraded') return { class: 'health', action: 'refresh-health-check' };
  return { class: 'unknown', action: null };
}

function plan(failure, taskId = null) {
  const diagnosis = classify(failure);
  const safe = diagnosis.action && allowlist.has(diagnosis.action);
  const result = {
    healing_id: `heal-${Date.now()}`,
    task_id: taskId,
    failure,
    diagnosis: diagnosis.class,
    proposed_action: diagnosis.action,
    mode: safe ? 'allowlisted-safe' : 'approval-required',
    created_at: now()
  };
  append({ event_id:`event-${Date.now()}`, event:'self_healing_plan', ...result });
  return result;
}

const [,, failure, taskId] = process.argv;
if (!failure) {
  console.error('Usage: node scripts/ai-team/self-healing.js <failure-type> [task-id]');
  process.exit(2);
}
console.log(JSON.stringify(plan(failure, taskId || null), null, 2));
