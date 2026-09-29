import test from 'node:test';import assert from 'node:assert/strict';import {IDBFactory} from 'fake-indexeddb';
globalThis.indexedDB=new IDBFactory();globalThis.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{},length:0};
const a=await import('../src/storage.js?tab=a'),b=await import('../src/storage.js?tab=b');
const state=label=>({version:1,active:'one',profiles:[{id:'one',name:label,runs:{},inventions:[]}]});const conflict=e=>e.code==='SAVE_CONFLICT';
test('Two independent connections cannot both commit snapshots read from the same revision',async()=>{
 await a.openStore();await b.openStore();await a.loadSave();await b.loadSave();
 const results=await Promise.allSettled([a.persist(state('A'),{id:'a1',profile:'one',type:'trial'}),b.persist(state('B'),{id:'b1',profile:'one',type:'trial'})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected'&&conflict(r.reason)).length,1);
 const winner=results[0].status==='fulfilled'?a:b,loser=winner===a?b:a,winId=winner===a?'a1':'b1',loseId=winner===a?'b1':'a1';assert.deepEqual((await loser.getEvents()).map(e=>e.id),[winId]);assert.deepEqual(new Set((await loser.getBackupEvents()).map(e=>e.id)),new Set([loseId]));
 await loser.loadSave();await assert.rejects(loser.persist(state('Still stale')),conflict);await assert.rejects(loser.importEvents([{id:'bad-import',profile:'one'}]),conflict);await assert.rejects(loser.replaceSaveWithEvents(state('Overwrite'),[]),conflict);await assert.rejects(loser.deleteProfileEvents('one'),conflict);await assert.rejects(loser.archiveUnreadableSave(),conflict);assert.deepEqual((await winner.getEvents()).map(e=>e.id),[winId]);
 await loser.openStore();const current=await loser.loadSave();current.profiles[0].name+=' plus reconciled';await loser.replaceSaveWithEvents(current,[{id:loseId,profile:'one',type:'trial'}]);assert.equal((await loser.getEvents()).length,2);await assert.rejects(winner.persist(state('Old winner')),conflict);
});
test('Event-only writes advance the guard and stale profile-event deletion cannot remove new evidence',async()=>{
 await a.openStore();await b.openStore();await a.loadSave();await b.loadSave();await a.importEvents([{id:'new-evidence',profile:'one',type:'trial'}]);await assert.rejects(b.deleteProfileEvents('one'),conflict);assert.ok((await a.getEvents()).some(e=>e.id==='new-evidence'));
});
test('Snapshot comparison detects older writers that do not advance the revision metadata',async()=>{
 await a.openStore();await a.loadSave();const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('science-quest',2);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put(state('Legacy tab'),'current');await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();await assert.rejects(a.persist(state('Stale modern tab')),conflict);assert.equal((await a.loadSave()).profiles[0].name,'Legacy tab');
});
test('An aborted duplicate-event transaction rolls back snapshot and revision and does not poison later reads or writes',async()=>{
 await a.openStore();const before=await a.loadSave();const id=(await a.getEvents())[0].id;await assert.rejects(a.persist(state('Must roll back'),{id,profile:'one',type:'duplicate'}));assert.deepEqual(await a.loadSave(),before);await a.persist(state('After retry'),{id:'after-retry',profile:'one',type:'trial'});assert.equal((await a.loadSave()).profiles[0].name,'After retry');
});
test('Profile removal commits its snapshot and evidence deletion together and stale removal preserves both',async()=>{
 await a.openStore();await a.loadSave();const initial=state('One');initial.profiles.push({id:'two',name:'Two',runs:{},inventions:[]});await a.replaceSaveWithEvents(initial,[{id:'two-evidence',profile:'two',type:'trial'}]);await b.openStore();await b.loadSave();
 const next=structuredClone(initial);next.profiles=next.profiles.filter(p=>p.id==='two');next.active='two';await a.replaceSaveWithEvents(next,[],'one');assert.deepEqual((await a.loadSave()).profiles.map(p=>p.id),['two']);assert.deepEqual((await a.getEvents()).map(e=>e.profile),['two']);
 const stale=structuredClone(initial);stale.profiles=stale.profiles.filter(p=>p.id==='one');await assert.rejects(b.replaceSaveWithEvents(stale,[],'two'),conflict);assert.deepEqual((await a.getEvents()).map(e=>e.profile),['two']);assert.deepEqual((await a.loadSave()).profiles.map(p=>p.id),['two']);
});
