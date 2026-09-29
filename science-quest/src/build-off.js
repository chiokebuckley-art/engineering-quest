import {simulate} from './models.js';
export const buildOffSurfaces=[.2,.4,.1];
export function buildOffTrial(round,input){
 if(!Number.isInteger(round)||round<0||round>2)throw Error('Unknown design round');
 const result=simulate('ramp',input,{resistance:buildOffSurfaces[round]});
 return{round,height:input,resistance:buildOffSurfaces[round],distance:result.value,energy:result.energy,passes:Math.abs(result.value-1)<.051};
}
export function compareBuildOff(designs){
 if(!Array.isArray(designs)||designs.length!==3||new Set(designs.map(d=>d.round)).size!==3)throw Error('Test all three delivery designs first');
 const checked=designs.map(d=>{const result=buildOffTrial(d.round,d.height);if(!result.passes)throw Error('Each design must reach the same delivery bay');return result;});
 const minimum=Math.min(...checked.map(d=>d.energy));return{designs:checked,best:checked.filter(d=>Math.abs(d.energy-minimum)<1e-9).map(d=>d.round),minimum,maximum:Math.max(...checked.map(d=>d.energy))};
}
export function checkBuildOff(designs,choice,explanation){const comparison=compareBuildOff(designs);return{correct:comparison.best.includes(choice)&&explanation===0,...comparison};}
export function validateBuildOffRecord(record){
 if(!record||typeof record.id!=='string'||!Number.isFinite(record.at)||typeof record.scored!=='boolean'||record.score!==400)throw Error('Invalid Build-Off record');
 const checked=checkBuildOff(record.designs,record.choice,record.explanation);
 if(!checked.correct||record.designs.some((d,i)=>['distance','energy','resistance'].some(k=>d[k]!==checked.designs[i][k])))throw Error('Invalid Build-Off evidence');
 return record;
}
