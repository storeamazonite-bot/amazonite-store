#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const targets=['index.html','products/index.html','reviews/haylou-s30.html','customer-care.html'];
const results=[];
for(const rel of targets){
 const file=path.join(root,rel); if(!fs.existsSync(file)){results.push({file:rel,status:'fail',reason:'missing'});continue;}
 const h=fs.readFileSync(file,'utf8');
 const viewport=/name=["']viewport["'][^>]*content=["'][^"']*width=device-width/i.test(h);
 const lang=/<html[^>]+lang=["'][^"']+/i.test(h);
 const title=/<title>[^<]+<\/title>/i.test(h);
 const images=[...h.matchAll(/<img\b[^>]*>/gi)];
 const imagesMissingAlt=images.filter(m=>!/\balt=["']/i.test(m[0])).length;
 const buttons=[...h.matchAll(/<button\b[^>]*>/gi)];
 const unlabeledButtons=buttons.filter(m=>!/(aria-label|>[^<]+<)/i.test(m[0])).length;
 const hasMain=/<main[\s>]/i.test(h);
 results.push({file:rel,viewport,lang,title,images:images.length,imagesMissingAlt,buttons:buttons.length,unlabeledButtons,hasMain,status:viewport&&lang&&title&&imagesMissingAlt===0&&unlabeledButtons===0&&hasMain?'pass':'review'});
}
console.log(JSON.stringify({gate:'mobile-accessibility',targets:results,decision:results.every(x=>x.status==='pass')?'pass':'review',note:'Static audit; visual/device testing still required before launch'},null,2));
