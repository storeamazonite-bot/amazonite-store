#!/usr/bin/env node
const ALLOWED = new Set(['docs/ai-team/']);
const FORBIDDEN = /(^|\/)(\.env|secrets?|credentials?|\.github\/workflows\/.*secrets?)/i;

function validate({ base = 'main', path, operation = 'create-or-update' }) {
  if (base !== 'main') return { ok:false, reason:'base_branch_must_be_main' };
  if (!path || !ALLOWED.has('docs/ai-team/')) return { ok:false, reason:'invalid_path' };
  if (!path.startsWith('docs/ai-team/') || FORBIDDEN.test(path)) return { ok:false, reason:'path_not_allowlisted' };
  if (!['create-or-update'].includes(operation)) return { ok:false, reason:'operation_not_allowlisted' };
  return { ok:true, gate:'safe-write', next:['branch-change','tests','pull-request','review','approval-before-merge'] };
}

const raw = process.argv[2];
if (!raw) { console.error('Usage: node scripts/ai-team/safe-write-gate.js <json>'); process.exit(2); }
const result = validate(JSON.parse(raw));
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.ok ? 0 : 1;
