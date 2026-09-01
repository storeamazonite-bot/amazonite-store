#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'docs/ai-team/integration-gateway.json'), 'utf8'));

function validate(input) {
  if (!input || typeof input !== 'object') throw new Error('invalid_input');
  if (!input.operation) throw new Error('operation_required');
  const allowed = ['inspect_file'];
  if (!allowed.includes(input.operation)) throw new Error('operation_not_allowlisted');
  if (!input.repository || !input.path) throw new Error('repository_and_path_required');
  return { ok: true, adapter: 'github', operation: input.operation, repository: input.repository, path: input.path };
}

function plan(input) {
  const checked = validate(input);
  return {
    status: 'ready_for_provider_execution',
    capability: 'read',
    ...checked,
    provider_call: 'GitHub repository file read',
    verification: 'compare returned content with expected file/path and record evidence'
  };
}

const raw = process.argv[2];
if (!raw) { console.error('Usage: node scripts/ai-team/adapters/github.js <json-input>'); process.exit(2); }
try { console.log(JSON.stringify(plan(JSON.parse(raw)), null, 2)); }
catch (error) { console.error(JSON.stringify({ status:'rejected', error:error.message }, null, 2)); process.exit(1); }
