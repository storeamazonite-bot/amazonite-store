#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const files = [
  'index.html',
  'products/index.html',
  'reviews/haylou-s30.html',
  'customer-care.html'
];

const checks = [];
for (const rel of files) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    checks.push({ file: rel, status: 'fail', reason: 'missing_file' });
    continue;
  }
  const html = fs.readFileSync(full, 'utf8');
  const hasNav = /<nav[\s>]/i.test(html) || /class=["'][^"']*nav/i.test(html);
  const hasTitle = /<title>[^<]+<\/title>/i.test(html);
  const hasDisclosure = /affiliate|commission/i.test(html);
  checks.push({ file: rel, status: hasNav && hasTitle && hasDisclosure ? 'pass' : 'review', hasNav, hasTitle, hasDisclosure });
}

const review = fs.readFileSync(path.join(root, 'reviews/haylou-s30.html'), 'utf8');
const guarded = /coming soon|not active yet|verified affiliate link coming soon/i.test(review);
const internalPaths = (review.match(/href=["']([^"']+)["']/gi) || []).filter(x => !/^href=["']#/.test(x));

const result = {
  gate: 'pre-affiliate-conversion-ux',
  default_status: guarded ? 'pass_with_affiliate_block' : 'review',
  checks,
  review_cta_guarded: guarded,
  internal_link_references: internalPaths.length,
  rule: 'never expose an unverified affiliate destination'
};

console.log(JSON.stringify(result, null, 2));
