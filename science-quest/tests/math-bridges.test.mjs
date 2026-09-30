import test from 'node:test';import assert from 'node:assert/strict';
import {mathBridges,createMathBridge,chooseMath,checkMath,nextMath,validateMathBridges,bridgeForMission} from '../src/math-bridges.js';
import {validateSave,makeProfile} from '../src/learning.js';
test('Each bridge requires checked examples and survives a saved checkpoint without science credit',()=>{for(const id of Object.keys(mathBridges)){const p=makeProfile(),s=createMathBridge();p.mathBridges={[id]:s};assert.throws(()=>nextMath(s,id));for(let j=0;j<4;j++){chooseMath(s,id,mathBridges[id].items[s.step].correct);checkMath(s,id);nextMath(s,id);assert.equal(validateSave({version:1,profiles:[p],active:p.id}).profiles[0].mathBridges[id],s);}assert.equal(s.complete,true);assert.equal(s.history.length,4);assert.deepEqual(p.runs,{});assert.deepEqual(p.inventions,[]);assert.equal(p.world,undefined);assert.equal(validateMathBridges(JSON.parse(JSON.stringify(p.mathBridges)))[id].complete,true);}});
test('Wrong responses and worked help stay assisted and cannot become an independent completion through import',()=>{const id='budgets',s=createMathBridge();chooseMath(s,id,(mathBridges[id].items[s.step].correct+1)%3);checkMath(s,id);assert.equal(s.feedback.ok,false);assert.equal(s.history[0].assisted,true);chooseMath(s,id,mathBridges[id].items[s.step].correct);checkMath(s,id);assert.equal(s.answers[0].assisted,true);nextMath(s,id);checkMath(s,id,true);chooseMath(s,id,mathBridges[id].items[s.step].correct);checkMath(s,id);assert.equal(s.answers[1].assisted,true);const forged=structuredClone(s);forged.answers[0].assisted=false;assert.throws(()=>validateMathBridges({[id]:forged}));assert.throws(()=>validateMathBridges({unknown:s}));assert.throws(()=>validateMathBridges({speed:{...s,complete:true}}));});
test('Reference calculations and appropriate mission bridges are explicit',()=>{assert.equal(6/3,2);assert.equal(.5*2*3**2,9);assert.equal(1200*.75-60*10-100,200);assert.equal(bridgeForMission({band:'3–5',adapter:'ramp'}),'tables');assert.equal(bridgeForMission({band:'9–12',adapter:'energy'}),'budgets');assert.equal(bridgeForMission({band:'9–12',adapter:'heredity'}),'tables');assert.equal(bridgeForMission({band:'9–12',adapter:'collision'}),'relationships');});

test('Help or an incorrect recheck after a correct response preserves assistance and valid recovery',()=>{
 for(const useHelp of [true,false]){
  const id='tables',s=createMathBridge(),correct=mathBridges[id].items[0].correct;
  chooseMath(s,id,correct);checkMath(s,id);
  if(useHelp)checkMath(s,id,true);else{chooseMath(s,id,(correct+1)%3);checkMath(s,id);}
  assert.equal(s.answers[0].assisted,true);assert.equal(validateMathBridges({tables:s}).tables,s);
  chooseMath(s,id,correct);checkMath(s,id);nextMath(s,id);
  const removed=structuredClone(s);removed.revealed=[];removed.answers[0].assisted=false;
  if(!useHelp)assert.throws(()=>validateMathBridges({tables:removed}));
 }
 assert.ok(new Set(Object.values(mathBridges).flatMap(b=>b.items.map(i=>i.correct))).size>1);
});
