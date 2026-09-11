import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const source = await fs.readFile(new URL('../assets/affiliate-tracker.js', import.meta.url), 'utf8');

assert.doesNotMatch(source, /amazonite-premium-ui/);
assert.doesNotMatch(source, /function injectStyle\(/);
assert.doesNotMatch(source, /function buildBrand\(/);
assert.match(source, /window\.AmazoniteTracker/);
assert.match(source, /function buildAssistant\(/);

console.log('Legacy overlay guard: PASS');
