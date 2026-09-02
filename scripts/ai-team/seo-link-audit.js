#!/usr/bin/env node
const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'../..');
const required=['sitemap.xml','robots.txt','index.html','products/index.html'];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f)));
const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8');
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const checks={required_files:missing.length===0,robots_points_to_sitemap:/Sitemap:\s*https:\/\/amazonite-store\.vercel\.app\/sitemap\.xml/i.test(robots),sitemap_has_urls:/(<url>\s*<loc>)/i.test(sitemap)};
const pass=Object.values(checks).every(Boolean);
console.log(JSON.stringify({status:pass?'PASS':'FAIL',checks,missing},null,2));
process.exitCode=pass?0:1;
