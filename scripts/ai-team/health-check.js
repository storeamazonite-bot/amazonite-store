#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const checks = [
  ['agent-registry.json', 'docs/ai-team/agent-registry.json'],
  ['tool-registry.json', 'docs/ai-team/tool-registry.json'],
  ['permission-matrix.json', 'docs/ai-team/permission-matrix.json'],
  ['task-routing.json', 'docs/ai-team/task-routing.json'],
  ['memory-schema.json', 'docs/ai-team/memory-schema.json'],
  ['task-queue.schema.json', 'docs/ai-team/task-queue.schema.json'],
  ['architecture-v1.md', 'docs/ai-team/architecture-v1.md'],
  ['agent-message-protocol.md', 'docs/ai-team/agent-message-protocol.md']
];

const results = checks.map(([name, relative]) => {
  const file = path.join(root, relative);
  try {
    const stat = fs.statSync(file);
    return { name, path: relative, ok: stat.isFile() && stat.size > 0 };
  } catch {
    return { name, path: relative, ok: false };
  }
});

const failed = results.filter(r => !r.ok);
const report = {
  service: 'amazonite-ai-team',
  checked_at: new Date().toISOString(),
  status: failed.length ? 'degraded' : 'healthy',
  checks: results,
  failed_count: failed.length
};

console.log(JSON.stringify(report, null, 2));
process.exitCode = failed.length ? 1 : 0;
