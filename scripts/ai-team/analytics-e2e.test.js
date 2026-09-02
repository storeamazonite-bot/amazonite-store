#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const analytics=fs.readFileSync(path.join(root,'assets/analytics.js'),'utf8');
const required=['page_view','product_view','cta_view','affiliate_click','affiliate_blocked'];
const apiMethods=['pageView','productView','ctaView','affiliateClick','affiliateBlocked'];
const missingEvents=required.filter(e=>!analytics.includes("'"+e+"'"));
const missingMethods=apiMethods.filter(m=>!analytics.includes(m+':'));
const guarded=!/affiliateClick[\s\S]{0,500}unverified/i.test(analytics) || analytics.includes("'verified_affiliate'");
const noSensitiveFields=!/email|phone|password|payment|full_url/i.test(analytics);
const result={gate:'analytics-conversion-e2e-contract',missing_events:missingEvents,missing_api_methods:missingMethods,verified_destination_contract:guarded,no_sensitive_fields:noSensitiveFields,decision:missingEvents.length===0&&missingMethods.length===0&&guarded&&noSensitiveFields?'pass':'fail'};
console.log(JSON.stringify(result,null,2));
process.exit(result.decision==='pass'?0:1);
