#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const docs = path.join(root, 'docs/ai-team');
const state = path.join(root, '.amazonite-ai');

const read = name => JSON.parse(fs.readFileSync(path.join(docs, name), 'utf8'));
const exists = file => { try { return fs.statSync(file).isFile(); } catch { return false; } };
const countJsonl = file => exists(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).length : 0;

const agents = read('agent-registry.json').agents;
const tools = read('tool-registry.json').tools;
const routes = read('task-routing.json').routes;
const permissions = read('permission-matrix.json').actions;

const snapshot = {
  generated_at: new Date().toISOString(),
  system: 'amazonite-ai-team',
  summary: {
    agents_total: agents.length,
    agents_active: agents.filter(a => a.status === 'active').length,
    tools_total: tools.length,
    tools_connected_or_available: tools.filter(t => ['connected','available'].includes(t.status)).length,
    routes_total: routes.length,
    permission_rules: Object.keys(permissions).length,
    task_events: countJsonl(path.join(state, 'events.jsonl')),
    queued_tasks_log: countJsonl(path.join(state, 'task-queue.jsonl'))
  },
  components: {
    health_monitor: exists(path.join(root, 'scripts/ai-team/health-check.js')) ? 'present' : 'missing',
    orchestrator: exists(path.join(root, 'scripts/ai-team/orchestrator.js')) ? 'present' : 'missing',
    verifier: exists(path.join(root, 'scripts/ai-team/verify.js')) ? 'present' : 'missing',
    self_healing: exists(path.join(root, 'scripts/ai-team/self-healing.js')) ? 'present' : 'missing'
  },
  launch_guard: 'affiliate links must be verified before activation'
};

console.log(JSON.stringify(snapshot, null, 2));
