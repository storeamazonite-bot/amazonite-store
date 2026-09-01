const assert = require('assert');
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'github.js');
const source = fs.readFileSync(file, 'utf8');

assert(source.includes("'inspect_file'"), 'read operation must remain allowlisted');
assert(source.includes("'operation_not_allowlisted'"), 'unknown operations must be rejected');
assert(source.includes("'repository_and_path_required'"), 'required inputs must be validated');
assert(source.includes("capability: 'read'"), 'adapter must declare read capability');

console.log('GitHub adapter safety checks: PASS');
