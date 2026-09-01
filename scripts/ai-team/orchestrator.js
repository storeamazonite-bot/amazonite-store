#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const docs = path.join(root, 'docs/ai-team');

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(docs, name), 'utf8'));
}

function route(type) {
  const routing = readJson('task-routing.json');
  const found = routing.routes.find(r => r.task === type);
  return found || { task: type, agents: [routing.default_agent], tools: [], gate: 'default' };
}

function createTask(type, request, priority = 'normal') {
  const r = route(type);
  return {
    task_id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    priority,
    request,
    context_refs: [],
    assigned_agent: r.agents[0] || null,
    required_tools: r.tools || [],
    approval: r.approval || 'none',
    status: r.approval ? 'blocked' : 'queued',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function plan(type, request, priority) {
  const task = createTask(type, request, priority);
  const routing = route(type);
  return {
    task,
    routing,
    permissions: readJson('permission-matrix.json').actions
  };
}

const [,, command, type, ...requestParts] = process.argv;
if (command !== 'plan' || !type || requestParts.length === 0) {
  console.error('Usage: node scripts/ai-team/orchestrator.js plan <task-type> <request>');
  process.exit(2);
}

console.log(JSON.stringify(plan(type, requestParts.join(' ')), null, 2));
