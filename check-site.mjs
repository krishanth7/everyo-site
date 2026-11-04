import {readFileSync,existsSync} from 'node:fs';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('.',import.meta.url));
const files=['index.html','documentation.html','features.html','examples.html','community.html'];
const docs=new Map(files.map(name=>{const text=readFileSync(root+name,'utf8');return [name,{text,ids:[...text.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1])}];}));
let checked=0;
for(const [name,{text,ids}]of docs){
 assert.equal(ids.length,new Set(ids).size,name+': duplicate IDs');assert.equal((text.match(/<h1\b/g)||[]).length,1,name+': one H1');
 assert.equal((text.match(/aria-current="page"/g)||[]).length,1,name+': one current page');
 for(const [,id]of text.matchAll(/aria-controls="([^"]+)"/g))assert.ok(ids.includes(id),name+': control '+id);
 for(const [,href]of text.matchAll(/href="([^"]+)"/g)){
  const url=new URL(href,'https://example.test/everyo-site/'+name);if(url.origin!=='https://example.test')continue;
  const file=url.pathname.split('/').pop()||'index.html';
  if(docs.has(file)){if(url.hash)assert.ok(docs.get(file).ids.includes(url.hash.slice(1)),name+': '+href);checked++;}
  else assert.ok(existsSync(root+file),name+': missing local file '+href);
 }
 for(const [,src]of text.matchAll(/<script[^>]+src="([^"]+)"/g))assert.ok(existsSync(root+src.split('?')[0]),name+': missing script '+src);
 assert.match(text,/<link rel="canonical"/);assert.match(text,/<meta name="robots"/);
}
assert.equal((docs.get('index.html').text.match(/<section\b/g)||[]).length,8,'Overview requires eight sections');
const css=readFileSync(root+'everyo-overview.css','utf8');assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/overflow-x:auto/);
assert.equal((readFileSync(root+'sitemap.xml','utf8').match(/<loc>/g)||[]).length,5);
console.log(`PASS: 5 pages; ${checked} internal links; unique IDs; one H1/current page each; eight Overview sections; local scripts/styles; metadata; reduced motion; five sitemap URLs.`);
