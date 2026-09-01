#!/usr/bin/env node
const ALLOWLIST = [/^docs\/ai-team\//, /^scripts\/ai-team\//, /^\.github\/workflows\/amazonite-ai-/];
const FORBIDDEN = [/^\.env/, /secret/i, /credential/i, /token/i, /private.?key/i];

function validate(input) {
  if (!input || !input.branch || input.branch === 'main') throw new Error('default_branch_write_forbidden');
  if (!input.path || !ALLOWLIST.some(re => re.test(input.path))) throw new Error('path_not_allowlisted');
  if (FORBIDDEN.some(re => re.test(input.path))) throw new Error('sensitive_path_forbidden');
  if (!['create','update'].includes(input.operation)) throw new Error('operation_not_allowlisted');
  if (typeof input.content !== 'string') throw new Error('content_required');
  return { capability:'safe-write', operation:input.operation, branch:input.branch, path:input.path, status:'validated' };
}

const raw = process.argv[2];
if (!raw) { console.error('Usage: node scripts/ai-team/adapters/github-safe-write.js <json-input>'); process.exit(2); }
try { console.log(JSON.stringify(validate(JSON.parse(raw)), null, 2)); }
catch (e) { console.error(JSON.stringify({ status:'rejected', error:e.message }, null, 2)); process.exit(1); }
