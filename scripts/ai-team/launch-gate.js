#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'docs/launch/launch-readiness.json'), 'utf8'));

const checks = [];
function check(name, ok, detail) { checks.push({ name, status: ok ? 'PASS' : 'BLOCKED', detail }); }

// These checks intentionally use explicit evidence supplied to the launcher.
const evidence = {
  technical: process.env.LAUNCH_TECHNICAL === 'true',
  affiliate_approved: process.env.AFFILIATE_APPROVED === 'true',
  product_links_verified: process.env.PRODUCT_LINKS_VERIFIED === 'true',
  product_identity_verified: process.env.PRODUCT_IDENTITY_VERIFIED === 'true',
  store_source_verified: process.env.STORE_SOURCE_VERIFIED === 'true',
  conversion: process.env.CONVERSION_READY === 'true',
  operations: process.env.OPERATIONS_READY === 'true',
  main_protected: process.env.MAIN_PROTECTED === 'true',
  required_checks: process.env.REQUIRED_CHECKS === 'true',
  secrets_safe: process.env.SECRETS_SAFE !== 'false'
};

check('technical', evidence.technical, 'Technical launch evidence must be explicitly supplied.');
check('affiliate approval', evidence.affiliate_approved, 'Affiliate program approval is required.');
check('product affiliate URLs', evidence.product_links_verified, 'Every active product must have a verified affiliate URL.');
check('product identity mapping', evidence.product_identity_verified, 'Each affiliate URL must map to the intended product.');
check('store/source mapping', evidence.store_source_verified, 'Required when a store-level affiliate source is used.');
check('conversion', evidence.conversion, 'CTA and trust/conversion checks must pass.');
check('operations', evidence.operations, 'Monitoring, logging and recovery must be ready.');
check('main protection', evidence.main_protected, 'GitHub main protection must be confirmed.');
check('required checks', evidence.required_checks, 'Required CI checks must be enforced.');
check('secrets', evidence.secrets_safe, 'Secrets must not be embedded in source or launch evidence.');

const blocked = checks.filter(c => c.status === 'BLOCKED');
const result = { status: blocked.length ? 'BLOCKED' : 'READY', checks, blocked_count: blocked.length, generated_at: new Date().toISOString() };
console.log(JSON.stringify(result, null, 2));
process.exitCode = blocked.length ? 1 : 0;
