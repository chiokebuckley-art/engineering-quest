import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
test('Cached navigation supports mission query links and refreshes every installed asset',async()=>{
 const handlers={},scope='https://example.com/science-quest/';
 const pages=new Map([['./index.html','GAME'],['./coverage/index.html','COVERAGE']]);
 let installs=[];
 // A worker resolves relative Request URLs against its own location.
 class WorkerRequest extends Request {constructor(url,options){super(new URL(url,scope),options);}}
 vm.runInNewContext(await fs.readFile(new URL('../sw.js',import.meta.url),'utf8'),{
  URL,Request:WorkerRequest,
  self:{registration:{scope},addEventListener:(name,fn)=>handlers[name]=fn},
  caches:{open:async()=>({match:async key=>pages.get(key),addAll:async files=>installs=[...files]})},
  fetch:async()=>{throw Error('Offline');}
 });
 let install;handlers.install({waitUntil:p=>install=p});await install;
 assert.ok(installs.every(request=>request.cache==='reload'));
 const urls=installs.map(request=>request.url);
 for(const file of ['coverage/coverage.js','src/coverage.js','src/world-experiment.js','src/world-experiment-3d.js'])assert.ok(urls.includes(scope+file));
 async function request(path){let pending;handlers.fetch({request:{method:'GET',url:scope+path,mode:'navigate'},respondWith:p=>pending=p});return pending;}
 assert.equal(await request('?mission=rover-rescue'),'GAME');
 assert.equal(await request('index.html?mission=first-move'),'GAME');
 assert.equal(await request('coverage/'),'COVERAGE');
 await assert.rejects(request('missing/'),/Offline/);
});
