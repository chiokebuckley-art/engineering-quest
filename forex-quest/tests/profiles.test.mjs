import test from 'node:test';
import assert from 'node:assert/strict';
import {profileStore,PROFILE_KEY} from '../profiles.js';
import {fresh} from '../engine.js';
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
test('naming legacy progress preserves it across reloads and isolates other players',()=>{
 const db=storage(),legacy=fresh();legacy.lessons=['original'];
 let p=profileStore(db,legacy);p.rename('Chioke');const original=p.current().id;
 p=profileStore(db,fresh());assert.equal(p.current().name,'Chioke');assert.deepEqual(p.load().lessons,['original']);
 p.add('Myla');assert.deepEqual(p.load().lessons,[]);const myla=p.current().id;
 const progress=p.load();progress.lessons.push('second');p.save(progress);
 p.switch(original);assert.deepEqual(p.load().lessons,['original']);p.switch(myla);assert.deepEqual(p.load().lessons,['second']);
 assert.deepEqual(legacy.lessons,['original']);
});
test('invalid names and failed storage writes leave active player intact',()=>{
 const db=storage(),p=profileStore(db,fresh());p.rename('Chioke');
 assert.throws(()=>p.add('  '));assert.throws(()=>p.add('chioke'));assert.throws(()=>p.rename('x'.repeat(41)));assert.throws(()=>p.switch('missing'));
 db.setItem=()=>{throw Error('Quota exceeded');};assert.throws(()=>p.add('Myla'));assert.throws(()=>p.rename('Other'));assert.equal(p.current().name,'Chioke');assert.equal(p.list().length,1);
});
test('malformed saved profiles are rejected without overwriting the stored data',()=>{
 const db=storage();db.setItem(PROFILE_KEY,'broken');assert.throws(()=>profileStore(db,fresh()));assert.equal(db.getItem(PROFILE_KEY),'broken');
});
