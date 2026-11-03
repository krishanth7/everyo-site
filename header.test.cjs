const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'everyo-corporate.js'),'utf8');
function setup({saved=null,dark=false,mobile=true,reduced=false,storageFails=false}={}) {
 const media={},timers=new Map();let next=1,stored=saved;
 const doc={activeElement:null};
 class Element {
  constructor(id=''){this.id=id;this.dataset={};this.attrs={};this.events={};this.parent=null;this.offsetHeight=64;this.classes=new Set();this.classList={add:c=>this.classes.add(c),contains:c=>this.classes.has(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}
  setAttribute(k,v){this.attrs[k]=String(v);} getAttribute(k){return this.attrs[k]??null;} removeAttribute(k){delete this.attrs[k];}
  addEventListener(k,f){(this.events[k]??=[]).push(f);} fire(k,e={}){for(const f of this.events[k]||[])f({target:this,...e});}
  focus(){doc.activeElement=this;} contains(e){for(;e;e=e.parent)if(e===this)return true;return false;}
  closest(s){return s==='a'&&this.attrs.href?this:null;} getBoundingClientRect(){return {top:1000};}
 }
 const root=new Element(),header=new Element(),theme=new Element('theme-toggle'),button=new Element('nav-toggle'),links=new Element('nav-links');
 links.dataset.open='false';links.parent=header;theme.parent=header;button.parent=header;
 const nav=['#top','https://github.com/krishanth7/EveryO/tree/main/docs','#why-everyo'].map(href=>{const x=new Element();x.attrs.href=href;x.parent=links;return x;});links.querySelectorAll=()=>nav;header.querySelector=()=>nav[0];
 const ids={'theme-toggle':theme,'nav-toggle':button,'nav-links':links,'top':new Element('top'),'why-everyo':new Element('why-everyo'),'how-it-works':new Element('how-it-works')};
 for(const id of ['site-search','site-search-input','search-results','search-status','search-open','search-close'])ids[id]=new Element(id);
 doc.documentElement=root;doc.querySelector=()=>header;doc.getElementById=id=>ids[id];doc.querySelectorAll=()=>[];doc.events={};doc.addEventListener=Element.prototype.addEventListener;doc.fire=Element.prototype.fire;
 const win=new Element();win.location={hash:''};win.scrollY=0;win.requestAnimationFrame=()=>1;win.setTimeout=(f)=>{const id=next++;timers.set(id,f);return id;};win.matchMedia=q=>{if(!media[q]){media[q]=new Element();media[q].matches=q.includes('1199')?mobile:q.includes('reduce')?reduced:dark;}return media[q];};
 const storage={getItem:()=>{if(storageFails)throw Error('denied');return stored;},setItem:(k,v)=>{if(storageFails)throw Error('denied');stored=v;}};
 vm.runInNewContext(source,{document:doc,window:win,localStorage:storage,clearTimeout:id=>timers.delete(id)});
 return {root,header,theme,button,links,nav,doc,win,media,ids,timers,stored:()=>stored,setStored:v=>stored=v,finish:()=>{for(const [id,f]of timers){timers.delete(id);f();}}};
}
test('system preference, explicit persistence, system changes, cross-tab clearing and denied storage',()=>{
 const x=setup({dark:true});assert.equal(x.root.dataset.theme,'dark');x.theme.fire('click');assert.equal(x.stored(),'light');assert.equal(x.theme.getAttribute('aria-pressed'),'false');
 x.media['(prefers-color-scheme: dark)'].matches=false;x.media['(prefers-color-scheme: dark)'].fire('change');assert.equal(x.root.dataset.theme,'light');
 x.setStored('dark');x.win.fire('storage',{key:'everyo-theme'});assert.equal(x.root.dataset.theme,'dark');x.setStored(null);x.win.fire('storage',{key:null});assert.equal(x.root.dataset.theme,'light');
 const y=setup({storageFails:true,dark:true});y.theme.fire('click');assert.equal(y.root.dataset.theme,'light');
 assert.equal(setup({saved:'dark',dark:false}).root.dataset.theme,'dark');
});
test('opening, Escape, inert closed links, focus return and rapid reversal',()=>{
 const x=setup();assert.equal(x.links.inert,true);x.button.fire('click');assert.equal(x.links.dataset.state,'opening');assert.equal(x.doc.activeElement,x.nav[0]);assert.equal(x.links.inert,false);assert.equal(x.root.classList.contains('mobile-menu-open'),true);
 x.doc.fire('keydown',{key:'Escape',preventDefault(){}});assert.equal(x.links.dataset.state,'closing');assert.equal(x.links.inert,true);assert.equal(x.doc.activeElement,x.button);
 x.button.fire('click');x.finish();assert.equal(x.links.dataset.state,'open');assert.equal(x.button.getAttribute('aria-expanded'),'true');
 x.button.fire('click');x.finish();assert.equal(x.links.dataset.state,'closed');assert.equal(x.root.classList.contains('mobile-menu-open'),false);
});
test('non-modal Tab departure, outside click, navigation and resize cleanup',()=>{
 const x=setup();x.button.fire('click');x.header.fire('focusout',{relatedTarget:new (x.button.constructor)()});assert.equal(x.links.dataset.open,'false');
 x.button.fire('click');x.doc.fire('click',{target:x.ids.top});assert.equal(x.links.dataset.open,'false');
 x.button.fire('click');x.links.fire('click',{target:x.nav[2]});assert.equal(x.links.dataset.open,'false');assert.equal(x.doc.activeElement,x.ids['why-everyo']);
 x.button.fire('click');x.media['(max-width: 1199px)'].matches=false;x.media['(max-width: 1199px)'].fire('change');assert.equal(x.links.inert,false);assert.equal(x.links.dataset.open,'false');
});
test('location history, reduced motion and duplicate initialization',()=>{
 const x=setup({reduced:true});x.button.fire('click');assert.equal(x.links.dataset.state,'open');x.button.fire('click');assert.equal(x.links.dataset.state,'closed');assert.equal(x.timers.size,0);
 x.win.location.hash='#why-everyo';x.win.fire('popstate');assert.equal(x.nav[2].getAttribute('aria-current'),'page');assert.equal(x.nav[0].getAttribute('aria-current'),null);
 x.win.location.hash='#top';x.win.fire('hashchange');assert.equal(x.nav[0].getAttribute('aria-current'),'page');
 const count=x.button.events.click.length;vm.runInNewContext(source,{document:x.doc,window:x.win});assert.equal(x.button.events.click.length,count);
});
