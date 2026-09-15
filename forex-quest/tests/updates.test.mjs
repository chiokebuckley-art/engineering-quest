import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../updates.js',import.meta.url),'utf8');
const workerSource=await readFile(new URL('../sw.js',import.meta.url),'utf8');
const emitter=()=>({events:{},addEventListener(k,f){(this.events[k]??=[]).push(f);},emit(k){for(const f of this.events[k]??[])f();}});
function setup({waiting=true,controller=true,save=true,fail=false}={}){
 const elements=[],messages=[];let reloads=0,checks=0,saves=0;
 const worker={...emitter(),state:'installing',postMessage:m=>messages.push(m)};
 const reg={...emitter(),waiting:waiting?worker:null,installing:worker,update:async()=>{checks++;if(fail)throw Error('offline');}};
 const sw={...emitter(),controller:controller?{}:null,register:async()=>reg};
 const doc={...emitter(),visibilityState:'visible',body:{prepend:e=>elements.push(e)},createElement:()=>({children:[],setAttribute(){},append(...e){this.children.push(...e);}})};
 const ctx=vm.createContext({navigator:{serviceWorker:sw,onLine:true},document:doc,window:emitter(),location:{reload(){reloads++;}},Date,setTimeout(){},setInterval(){}});
 vm.runInContext(source.replace('export async function','async function')+'\nglobalThis.start=startUpdates;',ctx);
 return {ctx,reg,sw,worker,elements,messages,get reloads(){return reloads;},get checks(){return checks;},get saves(){return saves;},async start(){await ctx.start({beforeReload:()=>{saves++;return save;}});await Promise.resolve();}};
}
test('ready update waits for tap, saves first, activates, and reloads once',async()=>{
 const h=setup();await h.start();const bar=h.elements[0],button=bar.children[1];assert.equal(bar.hidden,false);assert.equal(h.reloads,0);
 button.onclick();assert.equal(h.saves,1);assert.equal(h.messages[0].type,'ACTIVATE_UPDATE');assert.equal(h.reloads,0);
 h.sw.emit('controllerchange');h.sw.emit('controllerchange');assert.equal(h.reloads,1);
});
test('save failure blocks update and provides backup guidance',async()=>{
 const h=setup({save:false});await h.start();h.elements[0].children[1].onclick();assert.equal(h.messages.length,0);assert.match(h.elements[0].children[0].textContent,/backup/);
});
test('first install does not prompt or reload; another tab update prompts without reload',async()=>{
 const h=setup({waiting:false,controller:false});await h.start();h.sw.emit('controllerchange');assert.equal(h.elements[0].hidden,true);assert.equal(h.reloads,0);
 const other=setup({waiting:false});await other.start();other.sw.emit('controllerchange');assert.equal(other.elements[0].hidden,false);assert.equal(other.reloads,0);other.elements[0].children[1].onclick();assert.equal(other.reloads,1);
});
test('background checks, reconnection and updatefound do not touch lesson DOM',async()=>{
 const h=setup({waiting:false,fail:true});await h.start();assert.equal(h.elements.length,1);assert.equal(h.elements[0].hidden,true);
 const before=h.checks;h.ctx.window.emit('online');await Promise.resolve();assert.ok(h.checks>before);
 h.reg.emit('updatefound');h.reg.waiting=h.worker;h.worker.state='installed';h.worker.emit('statechange');assert.equal(h.elements[0].hidden,false);assert.equal(h.reloads,0);
});
test('worker stages cache without auto-activation, serves cached release and cleans only game caches',async()=>{
 const events={},deleted=[];let skipped=0,requests=[],claimed=0,network=0;
 const cache={addAll:async r=>{requests=r;},match:async()=>new Response('cached release')};
 const ctx=vm.createContext({Request,Response,URL,fetch:async()=>{network++;return new Response('network');},caches:{open:async()=>cache,keys:async()=>['other-app','forex-quest-v2.0.2','forex-quest-v2.0.3'],delete:async k=>deleted.push(k)},self:{registration:{scope:'https://example.org/forex-quest/'},addEventListener:(k,f)=>events[k]=f,skipWaiting:async()=>{skipped++;},clients:{claim:async()=>{claimed++;}}}});
 vm.runInContext(workerSource,ctx);let pending;
 events.install({waitUntil:p=>pending=p});await pending;assert.equal(skipped,0);assert.ok(requests.some(r=>r.url.endsWith('/updates.js')));assert.ok(requests.every(r=>r.cache==='reload'));
 events.message({data:{type:'ACTIVATE_UPDATE'},waitUntil:p=>pending=p});await pending;assert.equal(skipped,1);
 events.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,['forex-quest-v2.0.2']);assert.equal(claimed,1);
 events.fetch({request:new Request('https://example.org/forex-quest/app.js'),respondWith:p=>pending=p});assert.equal(await (await pending).text(),'cached release');assert.equal(network,0);
});
