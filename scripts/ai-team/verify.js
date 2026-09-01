#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const docs = path.join(root, 'docs/ai-team');

const required = [
  'agent-registry.json',
  'tool-registry.json',
  'permission-matrix.json',
  'task-routing.json',
  'memory-schema.json',
  'task-queue.schema.json',
  'agent-message-protocol.md',
  'architecture-v1.md'
];

function checkFile(name) {
  const file = path.join(docs, name);
  try {
    const stat = fs.statSync(file);
    return { check: `contract:${name}`, ok: stat.isFile() && stat.size > 0 };
  } catch {
    return { check: `contract:${name}`, ok: false };
  }
}

function verify() {
  const checks = required.map(checkFile);
  const failed = checks.filter(c => !c.ok);
  return {
    verification_id: `verify-${Date.now()}`,
    target: 'amazonite-ai-team-contracts',
    status: failed.length ? 'FAIL' : 'PASS',
    checks,
    failed_count: failed.length,
    verified_at: new Date().toISOString()
  };
}

const result = verify();
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === 'PASS' ? 0 : 1;
