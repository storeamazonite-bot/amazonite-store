#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '../..');
const gateway = JSON.parse(fs.readFileSync(path.join(root, 'docs/ai-team/integration-gateway.json'), 'utf8'));
const state = path.join(root, '.amazonite-ai');
const events = path.join(state, 'events.jsonl');
fs.mkdirSync(state, { recursive: true });

const id = p => `${p}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const append = x => fs.appendFileSync(events, JSON.stringify(x) + '\n');

function execute(request) {
  const adapter = gateway.adapters.find(a => a.capabilities.includes(request.capability));
  if (!adapter) return reject(request, 'no_registered_adapter');
  if (!request.agent_id || !request.request_id || !request.capability) return reject(request, 'missing_required_fields');
  if (adapter.approval !== 'none' && !request.approval_token) return reject(request, 'approval_required');

  const execution_id = id('exec');
  const result = {
    execution_id,
    request_id: request.request_id,
    adapter: adapter.id,
    status: 'accepted_for_execution',
    output: { note: 'Adapter selected. Provider-specific execution is intentionally delegated to a registered adapter implementation.' },
    evidence: [],
    verification_required: true,
    executed_at: new Date().toISOString()
  };
  append({ event_id:id('event'), event:'adapter_execution', ...result });
  return result;
}

function reject(request, reason) {
  const result = { execution_id:id('exec'), request_id:request.request_id || null, status:'rejected', reason, verification_required:false, rejected_at:new Date().toISOString() };
  append({ event_id:id('event'), event:'adapter_rejected', ...result });
  return result;
}

const raw = process.argv[2];
if (!raw) { console.error('Usage: node scripts/ai-team/adapter-executor.js <json-request>'); process.exit(2); }
const result = execute(JSON.parse(raw));
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === 'rejected' ? 1 : 0;
