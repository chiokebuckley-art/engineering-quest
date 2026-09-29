import test from 'node:test';import assert from 'node:assert/strict';
import {stoppingRun,stoppingContextMissions,stoppingRecord} from '../src/stopping-contexts.js';import {simulate,adapters} from '../src/models.js';import {scene} from '../src/visuals.js';import {missions,byId,regions,glossary} from '../src/content.js';import {createRun} from '../src/learning.js';import {beginTransfer,transferPlan,transferSatisfied,missionDesignSatisfied} from '../src/transfers.js';import {validateContent} from '../src/content-contract.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('Stopping contexts conserve motion/transfer energy and obey constant-deceleration endpoints',()=>{
 for(const speed of [1.5,2,3])for(let i=0;i<9;i++){const c=.1+i*.05,r=stoppingRun(c,speed);near(r.value,speed*r.duration/2);near(r.series.at(-1).x,r.value);near(r.series.at(-1).v,0);let x=-1,v=Infinity;for(const p of r.series){assert.ok(p.x>=x-1e-10);assert.ok(p.v<=v);near(p.kinetic+p.transferred,r.energy);near(r.mass*c*9.8*p.x,p.transferred);x=p.x;v=p.v;}}
 near(simulate('specimen-stop',.15).value,2.25/2.94);near(simulate('parcel-stop',.3).value,9/5.88);assert.throws(()=>simulate('specimen-stop',.2,{speed:0}));assert.throws(()=>simulate('parcel-stop',.2,{speed:2,extra:1}));
});
test('Both complete stopping missions have separate evidence, target solutions and fresh speed-specific transfers',()=>{
 const runs=stoppingContextMissions.map(createRun);runs[0].evidence.predict=true;assert.equal(runs[1].evidence.predict,undefined);
 for(const source of stoppingContextMissions){const m=byId[source.id],model=adapters[m.adapter];assert.equal(m.contextFamily,'stopping-zone');assert.match(m.review,/pending/);assert.ok(Array.from({length:9},(_,i)=>simulate(m.adapter,Number((.1+i*.05).toFixed(2)))).some(r=>missionDesignSatisfied(m,r)));
 for(const stage of ['transfer1','transfer2']){const r=createRun(m);r.stage=stage;beginTransfer(r,m);const plan=transferPlan(m,r);assert.equal(transferSatisfied(m,r),false);let solution;for(let x=model.min;x<=model.max+1e-8;x+=model.step){const t=simulate(m.adapter,Number(x.toFixed(2)),plan.options);if(t.value>=plan.target[0]&&t.value<=plan.target[1])solution=t;}assert.ok(solution);r.transferTrials[stage].push({...solution,options:{}});assert.equal(transferSatisfied(m,r),false);r.transferTrials[stage].push(solution);assert.equal(transferSatisfied(m,r),true);beginTransfer(r,m);assert.equal(transferSatisfied(m,r),false,'Later attempts require new evidence');}
 }
});
test('Transfer setup previews expose supplied speed or resistance without manufacturing recorded results',()=>{
 for(const id of ['museum-return-lane','harbor-parcel-lane','library-return','greenhouse-crates']){const m=byId[id],plan=transferPlan(m,{stage:'transfer2'}),preview=scene(m.adapter,plan.initial,null,0,plan.target,null,plan.options);assert.doesNotMatch(preview,/Stopping distance:/);if(plan.options.speed)assert.match(preview,new RegExp('Entry speed: '+plan.options.speed+' m/s'));else assert.match(preview,new RegExp('Lane resistance ratio: '+plan.options.resistance));}
 const m=byId['museum-return-lane'],r=simulate(m.adapter,.15);assert.match(scene(m.adapter,.15,r,1,m.target),/Stopping distance:/);r.series[10].x=.123456;assert.match(stoppingRecord(r),/0.123/);assert.equal(stoppingRecord(null),'');
});
test('Authored stopping transfer validation rejects unsupported speeds, wrong option keys and impossible bays',()=>{
 const check=m=>validateContent({missions:missions.map(x=>x.id===m.id?m:x),regions,adapters,glossary});assert.deepEqual(validateContent({missions,regions,adapters,glossary}),[]);
 for(const options of [{speed:0},{resistance:.2},{speed:2,unexpected:true}]){const m=structuredClone(byId['museum-return-lane']);m.transfers.transfer1.options=options;assert.ok(check(m).some(e=>e.includes('invalid lane')));}
 const bad=structuredClone(byId['harbor-parcel-lane']);bad.transfers.transfer2.target=[20,21];assert.ok(check(bad).some(e=>e.includes('no allowed setting')));
});
