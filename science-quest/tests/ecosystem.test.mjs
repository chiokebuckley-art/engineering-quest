import test from 'node:test';import assert from 'node:assert/strict';
import {carbonCycle,foodWebEnergy,initialCarbon,carbonPools} from '../src/ecosystem-models.js';import {simulate} from '../src/models.js';import {scene} from '../src/visuals.js';import {ecosystemRecord} from '../src/ecosystem-view.js';import {byId} from '../src/content.js';
test('Every carbon transfer balances both endpoints and all pools remain nonnegative across the allowed rates',()=>{
 for(const grazing of [.05,.1,.15,.2,.25])for(const decay of [.05,.1,.15,.2,.25]){
 const r=carbonCycle({grazing,decay});assert.deepEqual(r.records[0].pools,initialCarbon);assert.equal(r.records.length,7);
 for(let i=1;i<r.records.length;i++){const row=r.records[i],prev=r.records[i-1];assert.ok(Math.abs(row.total-200)<1e-8);for(const pool of Object.keys(carbonPools)){const change=row.flows.reduce((sum,f)=>sum+(f.to===pool?f.amount:0)-(f.from===pool?f.amount:0),0);assert.ok(Math.abs(prev.pools[pool]+change-row.pools[pool])<1e-8,pool);assert.ok(row.pools[pool]>=0);}assert.ok(row.flows.every(f=>f.amount>=0));}
 }
 assert.throws(()=>carbonCycle({grazing:NaN}));assert.throws(()=>carbonCycle({decay:1}));
});
test('Reference step uses beginning pools, and both controlled comparisons match the taught direction',()=>{
 const first=carbonCycle({grazing:.1,decay:.15}).records[1];assert.ok(Math.abs(first.pools.plants-59.3)<1e-9);assert.ok(Math.abs(first.pools.decomposers-5)<1e-9);assert.equal(first.flows.find(f=>f.process==='Photosynthesis').amount,9.5);
 for(const adapter of ['ecosystem-grazing','ecosystem-decay']){let previous=Infinity;for(const x of [5,10,15,20,25]){const r=simulate(adapter,x);assert.ok(r.value<previous);previous=r.value;assert.ok(Math.abs(r.total-200)<1e-8);}}
});
test('Food-web energy has a complete final account and does not count intermediate transfers twice',()=>{
 const r=foodWebEnergy(1000);assert.deepEqual(r.stores,{plants:500,grazers:40,predators:10,detritus:320,thermal:130});assert.equal(r.total,1000);assert.equal(r.value,10);
 for(const x of [500,1000,1500,2000,2500]){const r=simulate('ecosystem-energy',x);assert.equal(r.total,x);assert.equal(r.value,x*.01);assert.ok(Object.values(r.stores).every(v=>v>=0));assert.ok(r.stores.detritus>0);assert.ok(r.stores.thermal>0);}
 assert.throws(()=>foodWebEnergy(-1));assert.throws(()=>foodWebEnergy(Infinity));
});
test('Native scenes preserve untested state and render the saved carbon and energy evidence',()=>{
 for(const id of ['matter-through-a-food-web','decomposers-return-carbon','energy-through-a-food-web']){
 const m=byId[id],preview=scene(m.adapter,m.initial,null,0);assert.match(preview,/Untested starting account/);assert.doesNotMatch(preview,new RegExp(m.adapter==='ecosystem-energy'?'retained in predators:':'after six steps:'));
 const r=simulate(m.adapter,m.initial);assert.match(scene(m.adapter,m.initial,r,1),/role="img"/);const record=ecosystemRecord(r,m.adapter);assert.match(record,/Food-web/);assert.match(record,/<table/);assert.ok(m.lesson);assert.match(m.review,/pending/);
 }
 const historical=simulate('ecosystem-grazing',10);historical.records[0].pools.plants=61.234;assert.match(ecosystemRecord(historical,'ecosystem-grazing'),/61.234/,'Records render saved data rather than silently recomputing it.');assert.equal(ecosystemRecord(null,'ecosystem-grazing'),'');
});
