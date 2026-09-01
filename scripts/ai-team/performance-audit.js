#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const pages=['index.html','products/index.html','reviews/haylou-s30.html','customer-care.html'];
const out=[];
for(const rel of pages){
 const f=path.join(root,rel); if(!fs.existsSync(f)){out.push({file:rel,status:'fail',reason:'missing'});continue;}
 const h=fs.readFileSync(f,'utf8');
 const scripts=[...h.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)].map(x=>x[1]);
 const images=[...h.matchAll(/<img\b[^>]*>/gi)];
 const externalScripts=scripts.filter(x=>/^https?:\/\//i.test(x));
 const blockingScripts=scripts.filter(x=>!(/\b(?:async|defer)\b/i.test(h.slice(Math.max(0,h.indexOf(x)-100),h.indexOf(x)+x.length+100))));
 out.push({file:rel,scriptCount:scripts.length,externalScriptCount:externalScripts.length,imageCount:images.length,blockingScriptCount:blockingScripts.length,hasPreconnect:/rel=["']preconnect["']/i.test(h),status:externalScripts.length<=1?'pass':'review'});
}
const css=path.join(root,'assets/style.css');
const cssSize=fs.existsSync(css)?fs.statSync(css).size:0;
console.log(JSON.stringify({gate:'performance-readiness',pages:out,styleBytes:cssSize,decision:out.every(x=>x.status==='pass')?'pass':'review',note:'Static audit only; real Lighthouse/Core Web Vitals testing requires a deployed URL and real browser/device measurement.'},null,2));
