import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd());
const checks = [
  ['agent-registry', 'docs/ai-team/agent-registry.json'],
  ['tool-registry', 'docs/ai-team/tool-registry.json'],
  ['task-router', 'docs/ai-team/task-routing.json'],
  ['memory-schema', 'docs/ai-team/memory-schema.json'],
  ['permission-matrix', 'docs/ai-team/permission-matrix.json'],
  ['task-queue-schema', 'docs/ai-team/task-queue.schema.json'],
  ['task-runtime', 'ai-team/runtime/task-runtime.mjs']
];

const results = [];
for (const [name, relative] of checks) {
  try {
    await fs.access(path.join(root, relative));
    results.push({ name, status: 'pass' });
  } catch (error) {
    results.push({ name, status: 'fail', error: error.code || error.message });
  }
}

const passed = results.filter(r => r.status === 'pass').length;
const report = { checked_at: new Date().toISOString(), status: passed === results.length ? 'healthy' : 'degraded', passed, total: results.length, checks: results };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'healthy') process.exitCode = 1;
