import test from 'node:test';import assert from 'node:assert/strict';
import {simulate} from '../src/models.js';import {scene} from '../src/visuals.js';import {chemistryCourseAdapters} from '../src/chemistry-course-models.js';import {chemistryCourseRecord} from '../src/chemistry-course-view.js';import {chemistryCourseMissions} from '../src/chemistry-course-content.js';
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
test('Neutral ground-state shell accounts cover all first 18 atoms and the period boundary',()=>{
 const expected=[[1],[2],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,8],[2,8,1],[2,8,2],[2,8,3],[2,8,4],[2,8,5],[2,8,6],[2,8,7],[2,8,8]];
 expected.forEach((shells,i)=>{const r=simulate('valence-shells',i+1);assert.deepEqual(r.shells,shells);assert.equal(r.electrons,r.protons);assert.equal(r.shells.reduce((a,b)=>a+b),i+1);assert.equal(r.value,shells.at(-1));});assert.equal(simulate('valence-shells',11).configuration,'1s2 2s2 2p6 3s1');assert.throws(()=>simulate('valence-shells',19));
});
test('Molar limiting-reactant recovery conserves H and O atoms and all mass, including uncollected water',()=>{
 for(let h=.5;h<=4;h+=.5){const r=simulate('molar-recovery',h);close(2*h,2*r.hydrogenLeft+2*r.waterMoles);close(2,2*r.oxygenLeft+r.waterMoles);close(r.initialMass,r.finalMass);close(r.recovered+r.uncollected,r.theoretical);close(r.recovered/r.theoretical,.8);assert.ok(r.hydrogenLeft>=0&&r.oxygenLeft>=0);assert.ok(r.hydrogenLeft===0||r.oxygenLeft===0);}
 close(simulate('molar-recovery',1).value,14.4);close(simulate('molar-recovery',3).value,28.8);assert.equal(simulate('molar-recovery',2).value,simulate('molar-recovery',4).value);
});
test('First-order rate conserves isomer amount, has constant interval fractions and the expected half-life',()=>{
 for(const k of [.05,.1,.15,.2,.25]){const r=simulate('first-order-rate',k);close(100*Math.exp(-k*r.halfLife),50);for(let i=0;i<r.records.length;i++){const row=r.records[i];close(row.a+row.b,100);if(i)close(row.a/r.records[i-1].a,Math.exp(-k));}close(r.value,100*Math.exp(-10*k));}assert.ok(simulate('first-order-rate',.2).value<simulate('first-order-rate',.05).value);
});
test('Shared rate changes preserve equilibrium composition and balance nonzero opposing rates',()=>{
 for(const m of [.5,1,1.5,2,2.5]){const r=simulate('reversible-catalyst',m);close(r.equilibriumB,200/3);close(r.equilibriumA,100/3);close(r.equilibriumRatio,2);close(r.forward*r.equilibriumA,r.reverse*r.equilibriumB);assert.ok(r.equilibriumRate>0);for(const row of r.records){close(row.a+row.b,100);assert.ok(row.b<r.equilibriumB);assert.ok(row.forwardRate>row.reverseRate);}assert.equal(r.records[0].a,100);assert.equal(r.records[0].b,0);}
 assert.ok(simulate('reversible-catalyst',2).value>simulate('reversible-catalyst',.5).value);
});
test('Neutralization is stable on both sides of equivalence and preserves water ion product and charge balance',()=>{
 let previous=-Infinity;for(let v=0;v<=40;v+=5){const r=simulate('strong-neutralization',v);assert.ok(r.value>previous);previous=r.value;assert.ok(r.hydrogen>0&&r.hydroxide>0);close(r.hydrogen*r.hydroxide,1e-14,1e-27);close(r.hydrogen-r.hydroxide,r.excess,1e-14);close(r.totalLitres,(20+v)/1000);}
 close(simulate('strong-neutralization',20).value,7);close(simulate('strong-neutralization',0).value,1,1e-10);close(simulate('strong-neutralization',40).value,12.52287874528,1e-9);const text=chemistryCourseRecord(simulate('strong-neutralization',20),'strong-neutralization');assert.match(text,/1.0000e-7/);
});
test('All new chemistry scenes keep results hidden until tested and display saved accounting evidence',()=>{
 for(const m of chemistryCourseMissions){const a=chemistryCourseAdapters[m.adapter],preview=scene(m.adapter,a.initial,null);assert.match(preview,/Untested chemistry setup/);assert.doesNotMatch(preview,/Chemistry calculation record|Final pH:|Final mass account/);const r=simulate(m.adapter,a.initial);assert.match(scene(m.adapter,a.initial,r,1),/role="img"/);assert.match(chemistryCourseRecord(r,m.adapter),/Chemistry calculation record/);assert.match(chemistryCourseRecord(r,m.adapter),/<table/);}
 const r=simulate('first-order-rate',.1);r.records[1].a=91.2345;assert.match(chemistryCourseRecord(r,'first-order-rate'),/91.2345/);assert.equal(chemistryCourseRecord(null,'first-order-rate'),'');
});
