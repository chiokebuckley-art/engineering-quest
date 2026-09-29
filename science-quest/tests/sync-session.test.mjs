import {testLocks} from './sync-lock-helper.mjs';
const locks=testLocks(),createSyncSession=(storage,fetcher)=>makeSession(storage,fetcher,locks);
import test from 'node:test';import assert from 'node:assert/strict';import {createSyncSession as makeSession} from '../src/sync-session.js';import {applyPush} from '../cloud/protocol.js';import {makeProfile} from '../src/learning.js';
const memory=()=>{const map=new Map();return{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};};const p=makeProfile('Sync test'),snapshot={version:1,active:p.id,profiles:[p]},events=[{id:'trial-one',profile:p.id,type:'trial'}];
test('Lost response and page reload replay the same durable upload exactly once',async()=>{const disk=memory();let cloud=null,lose=true;const fetcher=async(url,options)=>{const result=await applyPush(cloud,JSON.parse(options.body));cloud=result.state;if(lose){lose=false;throw Error('Connection lost after commit');}return Response.json(result.body,{status:result.status});};const first=createSyncSession(disk,fetcher);await first.connect('https://example.org');const op=await first.queue(snapshot,events);await assert.rejects(()=>first.upload());assert.equal(first.status().pending,true);const reload=createSyncSession(disk,fetcher);const result=await reload.upload();assert.equal(result.replayed,true);assert.equal(cloud.revision,1);assert.equal(cloud.operations[0].id,op);assert.equal(cloud.events.length,1);assert.equal(reload.status().pending,false);assert.ok(!JSON.stringify(reload.status()).includes(reload.privateKey()));});
test('Conflicts preserve local and remote snapshots until explicit merged retry',async()=>{let cloud=(await applyPush(null,{operationId:crypto.randomUUID(),baseRevision:0,snapshot,events})).state;const client=createSyncSession(memory(),async(url,options)=>{const result=await applyPush(cloud,JSON.parse(options.body));cloud=result.state;return Response.json(result.body,{status:result.status});});await client.connect('https://example.org');await client.queue(snapshot,events);assert.equal((await client.upload()).conflict,true);await assert.rejects(async()=>await client.disconnect());await assert.rejects(async()=>await client.queue(snapshot,[]));await client.resolveWithMerged(snapshot,events);assert.equal(client.recovery()[0].remote.revision,1);assert.equal(client.recovery()[0].local.baseRevision,0);await client.upload();assert.equal(cloud.revision,2);assert.equal(cloud.events.length,1);await client.disconnect();assert.equal(client.status(),null);});
test('Local persistence failure prevents any network upload and concurrent operations are guarded',async()=>{let calls=0;const broken=createSyncSession({getItem:()=>null,setItem:()=>{throw Error('Quota');}},async()=>{calls++;});await assert.rejects(()=>broken.connect('https://example.org'));assert.equal(calls,0);const disk=memory();let release;const client=createSyncSession(disk,()=>new Promise(r=>release=r));await client.connect('https://example.org');await client.queue(snapshot,events);const pending=client.upload();await assert.rejects(()=>client.upload());await assert.rejects(async()=>await client.disconnect());release(Response.json({revision:1}));await pending;assert.equal(client.status().revision,1);});
import {reconcileCloud} from '../src/sync-merge.js';
test('Cloud reconciliation preserves differing explorer copies and rejects unsupported saves',()=>{const remote=structuredClone(snapshot);remote.profiles[0].name='New progress';const {merged}=reconcileCloud(snapshot,{snapshot:remote,events});assert.equal(merged.profiles.length,2);assert.equal(merged.profiles[0].name,'Sync test');assert.notEqual(merged.profiles[1].id,p.id);assert.equal(snapshot.profiles.length,1);assert.throws(()=>reconcileCloud(snapshot,{snapshot:{version:99},events:[]}));});

test('Two tabs share one lock through a delayed upload; losing contenders preserve the pending operation',async()=>{
 const disk=memory(),manager=testLocks();let release,calls=0;
 const fetcher=()=>{calls++;return new Promise(resolve=>release=resolve);};
 const a=makeSession(disk,fetcher,manager),b=makeSession(disk,fetcher,manager);
 await a.connect('https://example.org');const operation=await a.queue(snapshot,events),before=disk.getItem('science-quest.cloud-session.v1');
 const flight=a.upload();await assert.rejects(()=>b.upload(),/another.*tab is busy/i);await assert.rejects(()=>b.disconnect(),/another.*tab is busy/i);await assert.rejects(()=>b.resolveWithMerged(snapshot,events),/another.*tab is busy/i);
 assert.equal(disk.getItem('science-quest.cloud-session.v1'),before);assert.equal(calls,1);assert.equal(JSON.parse(before).pending.operationId,operation);
 release(Response.json({revision:1}));await flight;assert.equal(b.status().pending,false);assert.equal(b.status().revision,1);
 await b.queue(snapshot,events);assert.equal(a.status().pending,true);
});
test('Failed requests release the cross-tab lock while preserving exact retry payloads',async()=>{
 const disk=memory(),manager=testLocks();let fail=true;const payloads=[];
 const fetcher=async(url,options)=>{payloads.push(options.body);if(fail){fail=false;throw Error('Offline');}return Response.json({revision:1});};
 const a=makeSession(disk,fetcher,manager),b=makeSession(disk,fetcher,manager);await a.connect('https://example.org');await a.queue(snapshot,events);
 await assert.rejects(()=>a.upload(),/Offline/);assert.equal(b.status().pending,true);await b.upload();assert.equal(payloads[0],payloads[1]);assert.equal(a.status().pending,false);
});
test('Whole import/merge transactions exclude other sync tabs and revoke their scoped facade',async()=>{
 const disk=memory(),manager=testLocks(),a=makeSession(disk,async()=>Response.json({revision:0}),manager),b=makeSession(disk,fetch,manager);
 await a.connect('https://example.org');let resume,scoped;const paused=new Promise(r=>resume=r);
 const action=a.transaction(async tx=>{scoped=tx;await tx.inspect();await paused;tx.queue(snapshot,events);});
 await assert.rejects(()=>b.disconnect(),/another.*tab is busy/i);resume();await action;assert.equal(b.status().pending,true);assert.throws(()=>scoped.disconnect(),/transaction has ended/);
});
test('Browsers without atomic coordination retain local records and send no requests',async()=>{
 const disk=memory();let calls=0;const manager=testLocks(),working=makeSession(disk,fetch,manager);await working.connect('https://example.org');await working.queue(snapshot,events);const before=disk.getItem('science-quest.cloud-session.v1');
 const unsupported=makeSession(disk,async()=>{calls++;},null);assert.equal(unsupported.status().pending,true);assert.ok(unsupported.privateKey());
 for(const action of [()=>unsupported.upload(),()=>unsupported.disconnect(),()=>unsupported.deleteCloud(),()=>unsupported.transaction(()=>{})])await assert.rejects(action,/Web Locks/);
 assert.equal(calls,0);assert.equal(disk.getItem('science-quest.cloud-session.v1'),before);
});
test('A stale network response cannot overwrite a record changed by an older uncoordinated tab',async()=>{
 const disk=memory();let release;const client=makeSession(disk,()=>new Promise(r=>release=r),testLocks());await client.connect('https://example.org');await client.queue(snapshot,events);const flight=client.upload();
 const changed=JSON.parse(disk.getItem('science-quest.cloud-session.v1'));changed.url='https://other.example.org';const replacement=JSON.stringify(changed);disk.setItem('science-quest.cloud-session.v1',replacement);
 release(Response.json({revision:1}));await assert.rejects(()=>flight,/changed in another tab/);assert.equal(disk.getItem('science-quest.cloud-session.v1'),replacement);
});
test('An unawaited scoped request still holds the lock until completion and cannot overlap another mutation',async()=>{
 const disk=memory(),manager=testLocks();let release,scoped;
 const a=makeSession(disk,()=>new Promise(r=>release=r),manager),b=makeSession(disk,fetch,manager);await a.connect('https://example.org');await a.queue(snapshot,events);
 const transaction=a.transaction(tx=>{scoped=tx;tx.upload();assert.throws(()=>tx.disconnect(),/current sync request/);});
 await assert.rejects(()=>b.upload(),/another.*tab is busy/i);release(Response.json({revision:1}));await transaction;assert.equal(b.status().revision,1);assert.throws(()=>scoped.queue(snapshot,events),/transaction has ended/);await b.disconnect();
});
