#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '../..');
const docs = path.join(root, 'docs/ai-team');
const stateDir = path.join(root, '.amazonite-ai');
const queueFile = path.join(stateDir, 'task-queue.jsonl');
const eventsFile = path.join(stateDir, 'events.jsonl');

fs.mkdirSync(stateDir, { recursive: true });

const readJson = name => JSON.parse(fs.readFileSync(path.join(docs, name), 'utf8'));
const now = () => new Date().toISOString();
const id = prefix => `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

function route(type) {
  const routing = readJson('task-routing.json');
  return routing.routes.find(r => r.task === type) || { task: type, agents: [routing.default_agent], tools: [] };
}

function append(file, value) {
  fs.appendFileSync(file, JSON.stringify(value) + '\n');
}

function create(type, request, priority = 'normal') {
  const routing = route(type);
  const approval = routing.approval || 'none';
  const task = {
    task_id: id('task'), type, priority, request,
    assigned_agent: routing.agents?.[0] || null,
    required_tools: routing.tools || [], approval,
    status: approval !== 'none' ? 'blocked' : 'queued',
    created_at: now(), updated_at: now()
  };
  append(queueFile, task);
  append(eventsFile, { event_id:id('event'), event:'task_created', task_id:task.task_id, status:task.status, at:now() });
  return task;
}

function main() {
  const [,, command, type, ...parts] = process.argv;
  if (command !== 'create' || !type || !parts.length) {
    console.error('Usage: node scripts/ai-team/task-runner.js create <task-type> <request>');
    process.exit(2);
  }
  console.log(JSON.stringify(create(type, parts.join(' ')), null, 2));
}

main();
