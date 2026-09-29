import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
import {climateRecords,climateSource,climateQuestions,climateExpected,climateMean,climateWindow,createClimateData,editClimateData,checkClimateData,advanceClimateData,helpClimateData,climateIndependent,validateClimateData,assessClimateData,climateReady} from '../src/climate-data.js';
function answer(s){const response={...Object.fromEntries(Object.entries(climateExpected(s.step)).map(([k,v])=>[k,String(v)])),...Object.fromEntries(Object.entries(climateQuestions[s.step]||{}).map(([k,q])=>[k,q.correct]))};for(const [k,v]of Object.entries(response))editClimateData(s,k,v);return response;}
test('Every included year exactly matches the archived NASA annual column and checksum',async()=>{
 const raw=await fs.readFile(new URL('../data/climate/gistemp-global-2026-09-29.csv',import.meta.url));assert.equal(createHash('sha256').update(raw).digest('hex'),climateSource.sha256);
 const lines=raw.toString('utf8').trim().split(/\r?\n/),headers=lines[1].split(','),annual=headers.indexOf('J-D');assert.ok(annual>12);const rows=lines.slice(2).map(l=>l.split(','));
 const expected=rows.filter(r=>Number(r[0])<=2025&&r.slice(1,13).every(v=>v.trim()!==''&&Number.isFinite(Number(v)))).map(r=>[Number(r[0]),Number(r[annual])]);assert.deepEqual(climateRecords,expected);assert.equal(climateRecords.length,146);climateRecords.forEach(([year,value],i)=>{assert.equal(year,1880+i);assert.ok(Number.isFinite(value));});assert.equal(climateRecords.at(-1)[0],2025);assert.match(climateSource.baseline,/1951/);
});
test('Decade means and short-window signed change use all selected source values',()=>{
 assert.ok(Math.abs(climateMean(1980,1989)-.247)<1e-10);assert.ok(Math.abs(climateMean(2010,2019)-.807)<1e-10);assert.ok(Math.abs(climateExpected(1).difference-.56)<1e-10);assert.ok(Math.abs(climateExpected(2).shortChange+.16)<1e-10);assert.equal(climateWindow(1980,1989).length,10);assert.throws(()=>climateWindow(2020,2026));assert.throws(()=>climateWindow(1980,1979));
 assert.equal(assessClimateData(1,{early:'.25',recent:'.81',difference:'.56'}).correct,true);assert.equal(assessClimateData(1,{early:'',recent:'.807',difference:'.56'}).correct,false);assert.equal(assessClimateData(2,{shortChange:'.16',pattern:'coexist'}).correct,false);
});
test('All four checked responses are required and changing a checked draft invalidates advancement',()=>{
 const s=createClimateData();assert.throws(()=>advanceClimateData(s));for(let step=0;step<4;step++){answer(s);checkClimateData(s);assert.equal(climateReady(s),true);editClimateData(s,'notes','Evidence '+step);assert.equal(climateReady(s),false);assert.throws(()=>advanceClimateData(s));checkClimateData(s);advanceClimateData(s);}assert.equal(climateIndependent(s),true);validateClimateData(JSON.parse(JSON.stringify(s)));assert.throws(()=>editClimateData(s,'notes','late'));
});
test('Source provenance, helped status, mathematical scoring and ordered stage evidence survive backup checks',()=>{
 const s=createClimateData();helpClimateData(s);for(let i=0;i<4;i++){answer(s);checkClimateData(s);advanceClimateData(s);}assert.equal(climateIndependent(s),false);assert.equal(s.attempts[0].assisted,true);validateClimateData(s);
 for(const alter of [x=>x.sourceHash='wrong',x=>x.attempts[1].draft.difference='99',x=>x.helped=[],x=>x.attempts.reverse(),x=>x.attempts.pop(),x=>x.drafts[2].shortChange='0']){const bad=structuredClone(s);alter(bad);assert.throws(()=>validateClimateData(bad));}
 assert.throws(()=>validateClimateData({...createClimateData(),step:3,complete:true}));
});
