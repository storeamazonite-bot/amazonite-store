#!/usr/bin/env node
'use strict';

const https = require('https');

const baseUrl = process.env.AMAZONITE_BASE_URL || 'https://amazonite-store.vercel.app';
const routes = (process.env.AMAZONITE_CRITICAL_ROUTES || '/;/products/;/dashboard/;/reviews/haylou-s30.html;/customer-care.html')
  .split(';').filter(Boolean);

function check(route) {
  return new Promise((resolve) => {
    const url = new URL(route, baseUrl);
    const started = Date.now();
    const req = https.get(url, { timeout: 10000, headers: { 'User-Agent': 'Amazonite-Uptime-Monitor/1.0' } }, (res) => {
      res.resume();
      resolve({ route, status: res.statusCode, latency_ms: Date.now() - started, ok: res.statusCode >= 200 && res.statusCode < 400 });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', (error) => resolve({ route, status: null, latency_ms: Date.now() - started, ok: false, error: error.message }));
  });
}

(async () => {
  const results = [];
  for (const route of routes) results.push(await check(route));
  const failed = results.filter(r => !r.ok);
  console.log(JSON.stringify({ monitor: 'live-critical-routes', base_url: baseUrl, checked_at: new Date().toISOString(), results, decision: failed.length ? 'fail' : 'pass' }, null, 2));
  process.exit(failed.length ? 1 : 0);
})();
