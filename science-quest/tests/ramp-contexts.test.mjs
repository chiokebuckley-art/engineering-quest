import test from 'node:test';
import assert from 'node:assert/strict';
import {missions,byId,regions,glossary} from '../src/content.js';
import {adapters,simulate} from '../src/models.js';
import {createRun} from '../src/learning.js';
import {beginTransfer,transferPlan,transferSatisfied,missionDesignSatisfied} from '../src/transfers.js';
import {validateContent} from '../src/content-contract.js';
import {scene} from '../src/visuals.js';
const variants=['library-return','greenhouse-crates'].map(id=>byId[id]);
test('Named routes change lane physics and preserve independent save identities',()=>{
 const runs=variants.map(createRun);assert.notEqual(variants[0].id,variants[1].id);runs[0].evidence.predict=true;assert.equal(runs[1].evidence.predict,undefined);
 assert.equal(simulate('library-ramp',.2).value,2);assert.equal(simulate('greenhouse-ramp',.2).value,.5);
 for(const m of variants){assert.equal(m.contextFamily,'rover-rescue');assert.match(m.review,/pending/);assert.ok(m.lesson);assert.ok(missionDesignSatisfied(m,simulate(m.adapter,m.id==='library-return'?.2:.4)));assert.equal(missionDesignSatisfied({...m,maxInput:.15},simulate(m.adapter,m.id==='library-return'?.2:.4)),false);}
});
test('Four executed variant transfers need fresh trials with the exact lane and both constraints',()=>{
 for(const m of variants)for(const stage of ['transfer1','transfer2']){
 const r=createRun(m);r.stage=stage;beginTransfer(r,m);const plan=transferPlan(m,r);assert.equal(transferSatisfied(m,r),false);assert.match(plan.question.contextId,new RegExp(m.id));
 const model=adapters[m.adapter];let solution;for(let x=model.min;x<=model.max+1e-7;x+=model.step){x=Number(x.toFixed(6));const t=simulate(m.adapter,x,plan.options);if(t.value>=plan.target[0]&&t.value<=plan.target[1]&&x<=plan.maxInput)solution=t;}
 assert.ok(solution,m.id+' '+stage);r.transferTrials[stage].push({...solution,options:{}});assert.equal(transferSatisfied(m,r),false,'A baseline/other-lane result is not transfer evidence');r.transferTrials[stage].push({...solution,input:.5});assert.equal(transferSatisfied(m,r),false,'Target alone is insufficient above the height cap');r.transferTrials[stage].push(solution);assert.equal(transferSatisfied(m,r),true);beginTransfer(r,m);assert.equal(transferSatisfied(m,r),false,'Review requires a fresh test');
 }
});
test('Content validation rejects impossible simultaneous constraints and malformed transfer briefs',()=>{
 const check=m=>validateContent({missions:missions.map(x=>x.id===m.id?m:x),regions,adapters,glossary});
 assert.deepEqual(validateContent({missions,regions,adapters,glossary}),[]);
 const m=structuredClone(variants[0]);m.maxInput=.1;assert.ok(check(m).some(x=>x.includes('all constraints')));
 const bad=structuredClone(variants[1]);bad.transfers.transfer2.maxInput=.1;assert.ok(check(bad).some(x=>x.includes('transfer2: no allowed')));bad.transfers.transfer2.options.resistance=0;assert.ok(check(bad).some(x=>x.includes('invalid lane')));
});
test('Cargo scenes show distinct objects and remain untested until a run',()=>{
 for(const m of variants){const preview=scene(m.adapter,m.initial,null,0,m.target);assert.match(preview,new RegExp(adapters[m.adapter].label));assert.doesNotMatch(preview,/Stopping distance:/);assert.match(preview,/DELIVERY BAY/);const result=simulate(m.adapter,m.initial);assert.match(scene(m.adapter,m.initial,result,1,m.target),/Stopping distance:/);}
 assert.match(scene('library-ramp',.2,null),/#7250a0/);assert.match(scene('greenhouse-ramp',.2,null),/#367a46/);
});
