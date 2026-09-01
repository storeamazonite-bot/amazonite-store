#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '../..');
const gateway = JSON.parse(fs.readFileSync(path.join(root, 'docs/ai-team/integration-gateway.json'), 'utf8'));

const required = gateway.request_contract.required;
const secretKeys = /token|password|secret|api[_-]?key|private[_-]?key/i;

function validate(request) {
  const missing = required.filter(k => request[k] === undefined || request[k] === null || request[k] === '');
  const serialized = JSON.stringify(request);
  const secretRisk = Object.keys(request.input || {}).some(k => secretKeys.test(k));
  const adapter = gateway.adapters.find(a => a.capabilities.includes(request.capability));
  return {
    request_id: request.request_id || `req-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    valid: missing.length === 0 && !secretRisk && !!adapter,
    missing,
    secret_risk: secretRisk,
    adapter: adapter?.id || null,
    message: secretRisk ? 'Rejected: credentials/secrets must stay in the execution environment.' : (missing.length ? 'Rejected: required fields missing.' : (!adapter ? 'Rejected: capability has no registered adapter.' : 'Accepted for policy evaluation.'))
  };
}

const raw = process.argv[2];
if (!raw) {
  console.error('Usage: node scripts/ai-team/integration-gateway.js <json-request>');
  process.exit(2);
}

const result = validate(JSON.parse(raw));
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.valid ? 0 : 1;
