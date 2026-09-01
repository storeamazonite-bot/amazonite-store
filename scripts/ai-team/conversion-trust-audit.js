#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const targets=['index.html','products/index.html','reviews/haylou-s30.html','customer-care.html'];
const checks=[];
for(const rel of targets){
 const f=path.join(root,rel); if(!fs.existsSync(f)){checks.push({file:rel,status:'fail',reason:'missing'});continue;}
 const h=fs.readFileSync(f,'utf8');
 checks.push({file:rel,
  title=!!h.match(/<title>[^<]+<\/title>/i),
  cta=!!h.match(/class=["'][^"']*(?:btn|cta|text-link)/i),
  trust=!!h.match(/pros|cons|disclosure|affiliate|transparent|honest|trust/i),
  navigation=!!h.match(/href=["'][^"']*(?:index|products|categories|reviews|customer-care)/i)});
}
const review=fs.readFileSync(path.join(root,'reviews/haylou-s30.html'),'utf8');
const blocked=/coming soon|not active yet|verified affiliate link coming soon/i.test(review);
const forbiddenGeneric=/aliexpress\.com|aliexpress/i.test(review)&&!/verified affiliate/i.test(review);
console.log(JSON.stringify({gate:'conversion-trust',checks,affiliate_cta_guarded:blocked,generic_affiliate_destination_detected:forbiddenGeneric,decision:blocked&&!forbiddenGeneric?'pass_with_conversion_block':'review'},null,2));
