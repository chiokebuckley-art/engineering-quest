import test from 'node:test';import assert from 'node:assert/strict';
import {createEnergyCapstone,evaluateCapstone,searchCapstone,bestCapstone,testEnergyCapstone,enumerateEnergyCapstone,finishEnergyCapstone,editEnergyCapstone,validateEnergyCapstone,supportEnergyCapstone,capstoneCases} from '../src/energy-capstone.js';
const plan=(storage=1200,power=120,converter='standard',schedule='together')=>({storage,power,converter,schedule});
function prepare(s){const good=searchCapstone(s.stage).filter(r=>r.feasible);for(const d of [plan(800,80),good[0].design,good[1].design]){s.draft=d;testEnergyCapstone(s);}enumerateEnergyCapstone(s);s.choice=good.find(r=>r.cost===bestCapstone(s.stage)).key;s.reason='joint';s.limits='bounded';}
test('Capstone energy ledgers conserve work and transfer energy; peak shifts change required power',()=>{
 for(let stage=0;stage<2;stage++)for(const row of searchCapstone(stage)){
 const r=evaluateCapstone(row.design,stage),other=evaluateCapstone({...row.design,schedule:row.design.schedule==='together'?'staggered':'together'},stage);
 assert.equal(r.nominal.demand,other.nominal.demand);assert.equal(r.nominal.demand,stage?680:600);
 for(const ledger of [r.nominal,r.worst]){assert.ok(Math.abs(ledger.delivered+ledger.loss-row.design.storage)<1e-7);assert.ok(Math.abs(ledger.ledger.reduce((sum,x)=>sum+x.served,0)+ledger.remaining-ledger.delivered)<1e-7);assert.ok(ledger.remaining>=0);}
 }
 const simultaneous=evaluateCapstone(plan(1200,100),0),staggered=evaluateCapstone(plan(1200,100,'standard','staggered'),0);
 assert.ok(simultaneous.worst.value>0);assert.equal(simultaneous.feasible,false,'positive energy margin does not remove peak power constraint');assert.equal(staggered.feasible,true);
});
test('Exhaustive finite search has reference optima and the original optimum fails the revised mass brief',()=>{
 assert.equal(searchCapstone(0).length,80);assert.equal(new Set(searchCapstone(0).map(r=>r.key)).size,80);assert.equal(bestCapstone(0),220);assert.equal(bestCapstone(1),280);
 assert.equal(evaluateCapstone(plan(),0).feasible,true);const old=evaluateCapstone(plan(),1);assert.equal(old.feasible,false);assert.ok(old.failures.includes('Mass limit'));
 assert.equal(evaluateCapstone(plan(1200,120,'efficient'),1).feasible,true);assert.throws(()=>evaluateCapstone(plan(900),0));
});
test('Completion requires diverse tests, a complete comparison, an optimal feasible choice and both explanations',()=>{
 const s=createEnergyCapstone();assert.throws(()=>finishEnergyCapstone(s));assert.throws(()=>enumerateEnergyCapstone(s));prepare(s);
 const cheapest=searchCapstone(0).find(r=>r.feasible&&r.cost===220);s.choice=searchCapstone(0).find(r=>r.feasible&&r.cost>220).key;assert.throws(()=>finishEnergyCapstone(s),/lower-cost/);s.choice=cheapest.key;s.reason='largest';assert.throws(()=>finishEnergyCapstone(s),/Explain/);s.reason='joint';finishEnergyCapstone(s);assert.equal(s.complete,false);assert.equal(s.stage,1);assert.throws(()=>finishEnergyCapstone(s));prepare(s);finishEnergyCapstone(s);assert.equal(s.complete,true);assert.equal(s.decisions.length,2);validateEnergyCapstone(JSON.parse(JSON.stringify(s)));assert.throws(()=>editEnergyCapstone(s,'notes','late'));
});
test('Backups reject fabricated trial, search and completion evidence while retaining help provenance',()=>{
 const s=createEnergyCapstone();supportEnergyCapstone(s);prepare(s);finishEnergyCapstone(s);prepare(s);finishEnergyCapstone(s);assert.ok(s.decisions.every(d=>d.assisted));validateEnergyCapstone(s);
 for(const alter of [x=>x.trials[0].result.cost++,x=>x.searches[0].rows.pop(),x=>x.decisions[0].choice='1200/80/standard/together',x=>x.assisted=false,x=>x.trials=[],x=>x.stage=1]){const bad=structuredClone(s);alter(bad);assert.throws(()=>validateEnergyCapstone(bad));}
 assert.throws(()=>validateEnergyCapstone({...createEnergyCapstone(),stage:2,complete:true}));
});
