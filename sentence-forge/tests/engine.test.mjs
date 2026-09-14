import test from 'node:test';
import assert from 'node:assert/strict';
import {MISSIONS,DISTRICTS,WORDS} from '../content.js';
import {newSave,newProfile,validateSave,matches,record,noteMiss,finishAssisted,mastery,repairQueue,completeRepair,rng,shuffle,choosePractice} from '../engine.js';
test('Every production order is answerable and every district has real content',()=>{
 assert.equal(new Set(MISSIONS.map(q=>q.id)).size,MISSIONS.length);
 for(let d of DISTRICTS)assert.ok(MISSIONS.filter(q=>q.district===d.id).length>=7,d.id);
 for(let q of MISSIONS){assert.ok(q.options[q.answer],q.id);assert.equal(new Set(q.options).size,q.options.length,q.id);assert.ok(q.explain&&q.hint,q.id);if(q.type!=='choice')assert.ok(matches(q,q.tokens),q.id);assert.ok(!q.solutions||!matches(q,[...q.tokens].reverse()),q.id);}
 assert.ok(WORDS.some(w=>w.word==='of'));assert.ok(WORDS.length>200);
});
test('Reversing actor and object or changing only placement does not pass the intended order',()=>{
 let q=MISSIONS.find(q=>q.title==='A different job');assert.ok(matches(q,['Ian','follows','the','dog','.']));assert.equal(matches(q,['The','dog','follows','Ian','.']),false);
});
test('Assisted completion is separate from independent mastery and repetition alone has a ceiling',()=>{
 let p=newProfile(),q=MISSIONS[0];finishAssisted(p,q);assert.ok(p.completed.includes(q.id));assert.equal(p.records[q.skill],undefined);
 for(let i=0;i<10;i++)record(p,q,true,{ms:90000});assert.ok(mastery(p.records[q.skill])<90);
 let variants=MISSIONS.filter(x=>x.skill===q.skill);for(let v of variants)record(p,v,true,{ms:90000});assert.equal(mastery(p.records[q.skill]),100);
});
test('A careful accurate reader and a fast accurate reader earn identical comprehension mastery',()=>{
 let slow=newProfile(),fast=newProfile();let qs=MISSIONS.filter(q=>q.skill==='core.action');for(let i=0;i<12;i++){record(slow,qs[i%qs.length],true,{ms:180000});record(fast,qs[i%qs.length],true,{ms:500});}assert.equal(mastery(slow.records['core.action']),mastery(fast.records['core.action']));
});
test('Misses deduplicate active cards; repair queue has an original, three distinct variations and a distinct twist',()=>{
 let p=newProfile(),q=MISSIONS[0];record(p,q,false,{now:100});record(p,q,false,{now:200});assert.equal(p.notebook.length,1);assert.equal(p.notebook[0].lapses,1);
 for(let question of MISSIONS){let queue=repairQueue({qid:question.id},rng(42));assert.equal(queue.length,5,question.id);assert.equal(new Set(queue.map(q=>q.id)).size,5,question.id);assert.equal(queue[0].id,question.id);}
});
test('Three spaced clean repairs clear a card and a lapse resets the sequence',()=>{
 let e={clean:0};completeRepair(e,true,100);assert.equal(e.clean,1);assert.equal(e.dueAt,100+3*86400000);completeRepair(e,true,e.dueAt);assert.equal(e.clean,2);completeRepair(e,true,e.dueAt);assert.ok(e.clearedAt);
 let f={clean:2};completeRepair(f,false,100);assert.equal(f.clean,0);assert.equal(f.dueAt,600100);
});
test('Save round trip preserves separate profiles and rejects damaged or injected state',()=>{
 let s=newSave();record(s.profiles[0],MISSIONS[0],true);s.profiles.push(newProfile('Myla'));assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
 let invalid=structuredClone(s);invalid.profiles[0].records[MISSIONS[0].skill].history=['yes'];assert.throws(()=>validateSave(invalid));invalid=structuredClone(s);invalid.profiles[0].notebook=[{qid:'missing',clean:0,dueAt:0,lapses:0}];assert.throws(()=>validateSave(invalid));
});
test('Seeded duel order is repeatable and practice can be restricted to a district and task type',()=>{
 assert.deepEqual(shuffle(MISSIONS,rng(23)).map(q=>q.id),shuffle(MISSIONS,rng(23)).map(q=>q.id));let p=newProfile();for(let i=0;i<30;i++){let q=choosePractice(p,{district:'relation',kind:'choice'});assert.equal(q.district,'relation');assert.equal(q.type,'choice');}
});

test("Supported misses enter repair without changing independent mastery",()=>{let p=newProfile(),q=MISSIONS[0];noteMiss(p,q);assert.equal(p.records[q.skill],undefined);assert.equal(p.notebook[0].qid,q.id);});
