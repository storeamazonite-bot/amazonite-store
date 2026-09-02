#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const file=path.join(root,'assets/analytics.js');
if(!fs.existsSync(file)) { console.error('analytics.js missing'); process.exit(1); }
const h=fs.readFileSync(file,'utf8');
const required=['page_view','product_view','cta_view','affiliate_click','affiliate_blocked'];
const missing=required.filter(x=>!h.includes("'"+x+"'"));
const forbidden=['email','phone','password','payment','full_url','user_name'];
const forbiddenFound=forbidden.filter(x=>new RegExp('\\b'+x+'\\b','i').test(h));
const rawDestination=/window\.location|document\.location|location\.href/i.test(h);
const decision=missing.length===0&&forbiddenFound.length===0&&!rawDestination?'pass':'fail';
console.log(JSON.stringify({gate:'analytics-event-privacy',required_events:required,missing,forbidden_found:forbiddenFound,raw_destination_access:rawDestination,decision},null,2));
process.exit(decision==='pass'?0:1);
