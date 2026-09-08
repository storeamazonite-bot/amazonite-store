import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const html = fs.readFileSync('index.html', 'utf8');
const baseline = fs.readFileSync('docs/baseline/AMAZONIT-ELECTRONIC-BASELINE.html', 'utf8');

const scriptStart = html.indexOf('<script>');
assert.ok(scriptStart >= 0, 'Secure integration script is missing.');
const visibleMarkup = html.slice(0, scriptStart).trimEnd() + '\n\n</body>\n</html>\n';

assert.equal(
  visibleMarkup,
  baseline,
  'The visible HTML/CSS baseline changed. Only the security integration script may differ.'
);

const sha256 = crypto.createHash('sha256').update(baseline).digest('hex');
assert.equal(sha256, '0b6789e5f0a1b81417466df72c9a65494976336ffec60fa984ac8f9c0e3c0346');

console.log('Latest Amazonite Electronic baseline integrity: PASS');
console.log(`Baseline SHA-256: ${sha256}`);
console.log('Covered: exact latest HTML/CSS/visible structure preserved; security script is isolated from the visual baseline.');
