const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'github-safe-write.js'), 'utf8');
assert(source.includes("input.branch === 'main'"), 'direct main writes must be rejected');
assert(source.includes('path_not_allowlisted'), 'unapproved paths must be rejected');
assert(source.includes('sensitive_path_forbidden'), 'sensitive paths must be rejected');
assert(source.includes("['create','update']"), 'only create/update are allowed');
console.log('GitHub safe-write policy checks: PASS');
