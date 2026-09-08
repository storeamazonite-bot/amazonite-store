import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const html = fs.readFileSync('index.html', 'utf8');
const baseline = fs.readFileSync('docs/baseline/AMAZONIT-ELECTRONIC-BASELINE.html', 'utf8');

const scriptStart = html.indexOf('<script>');
assert.ok(scriptStart >= 0, 'Secure integration script is missing.');
const visibleMarkup = html.slice(0, scriptStart).trimEnd() + '\n</body>\n</html>\n';

assert.equal(
  visibleMarkup,
  baseline,
  'The visible HTML/CSS baseline changed. Only the security integration script may differ.'
);

const sha256 = crypto.createHash('sha256').update(baseline).digest('hex');
assert.equal(sha256, '33b611767ca4a94161f4a3ff8fb204e00b8e53bb62ebf0c7595e9d406633cc87');

console.log('Latest Amazonite Electronic baseline integrity: PASS');
console.log(`Baseline SHA-256: ${sha256}`);
console.log('Covered: exact latest HTML/CSS/visible structure preserved; security script is isolated from the visual baseline.');
