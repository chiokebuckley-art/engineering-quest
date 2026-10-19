export const VERSION=1,STORE_KEY='electricity.progress.v1';
export const lessonIds=['L01.01','L01.02','L01.03','L01.04','L01.05','L01.06','L02.01','L02.02','L02.03','L02.04','L02.05','L03.01'];
export const uid=()=>crypto.randomUUID();
export function newProfile(name='Learner'){return {id:uid(),name:name.trim().slice(0,40)||'Learner',lessons:[],progress:{},notes:{},created:Date.now()};}
export function newStore(){const p=newProfile();return {version:VERSION,active:p.id,profiles:[p],reducedMotion:false};}
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
export function validStore(x){
 if(!obj(x)||x.version!==1||!Array.isArray(x.profiles)||!x.profiles.length||x.profiles.length>20)return false;
 const ids=new Set();for(const p of x.profiles){
 if(!obj(p)||typeof p.id!=='string'||!/^[\w-]{1,100}$/.test(p.id)||ids.has(p.id)||typeof p.name!=='string'||p.name.length>55||!Array.isArray(p.lessons)||!p.lessons.every(id=>lessonIds.includes(id))||!obj(p.progress)||!obj(p.notes))return false;
 ids.add(p.id);
 for(const [id,n] of Object.entries(p.notes))if(!lessonIds.includes(id)||typeof n!=='string'||n.length>5000)return false;
 for(const [id,v] of Object.entries(p.progress)){
 if(!lessonIds.includes(id)||!obj(v)||!Array.isArray(v.events)||v.events.length>5000||!Number.isInteger(v.step)||v.step<0||v.step>4)return false;
 for(const e of v.events)if(!obj(e)||typeof e.item!=='string'||e.item.length>70||!Number.isFinite(e.at)||typeof e.correct!=='boolean'||typeof e.assisted!=='boolean'||(e.choice!==undefined&&(!Number.isInteger(e.choice)||e.choice<0||e.choice>9)))return false;
 if(v.reviewAt!==undefined&&!Number.isFinite(v.reviewAt))return false;
 if(v.reviewLevel!==undefined&&(!Number.isInteger(v.reviewLevel)||v.reviewLevel<0||v.reviewLevel>4))return false;
 if(v.rubric!==undefined&&(!Array.isArray(v.rubric)||!v.rubric.every(n=>n===0||n===1)))return false;
 if(v.assistedItems!==undefined&&(!Array.isArray(v.assistedItems)||!v.assistedItems.every(n=>Number.isInteger(n)&&n>=0&&n<5)))return false;
 if(v.reflection!==undefined&&(typeof v.reflection!=='string'||v.reflection.length>5000))return false;
 }
 }return ids.has(x.active);
}
export function parseStore(raw){const x=JSON.parse(raw,(k,v)=>['__proto__','prototype','constructor'].includes(k)?undefined:v);if(!validStore(x))throw Error('This file is not a valid Electricity backup.');return x;}
export function progressFor(p,id){return p.progress[id]||{step:0,events:[]};}
export function recordAnswer(progress,item,correct,{hint=false,at=Date.now(),choice}={}){
 const prior=progress.events.some(e=>e.item===item);const event={item,correct,assisted:hint||prior,at,...(choice!==undefined?{choice}:{})};
 return {...progress,events:[...progress.events,event].slice(-5000)};
}
export function evidence(p,id){const v=progressFor(p,id);const independent=new Set(v.events.filter(e=>e.correct&&!e.assisted).map(e=>e.item));return {correct:independent.size,attempts:v.events.length,needsPractice:v.events.some(e=>!e.correct),completed:p.lessons.includes(id),reviewAt:v.reviewAt||0};}
export function finishLesson(p,id,at=Date.now()) {const v=progressFor(p,id);return {...p,lessons:[...new Set([...p.lessons,id])],progress:{...p.progress,[id]:{...v,step:4,reviewAt:v.reviewAt||at+86400000,completedAt:v.completedAt??at}}};}
export function reviewNext(p,id,success,at=Date.now()){const v=progressFor(p,id);if(!v.reviewAt||v.reviewAt>at)return p;const level=success?Math.min((v.reviewLevel||0)+1,4):0;return {...p,progress:{...p.progress,[id]:{...v,reviewLevel:level,reviewAt:at+[1,3,7,14,30][level]*86400000}}};}
export function seriesLED({voltage=3.3,resistance=220,closed=true,reversed=false}={}){
 if(!Number.isFinite(voltage)||voltage<0||!Number.isFinite(resistance)||resistance<=0)throw Error('Use a positive resistance and a nonnegative voltage.');
 const current=closed&&!reversed?Math.max(0,voltage-1.8)/resistance:0;
 return {current,ledVoltage:current>0?1.8:0,resistorVoltage:current*resistance,power:current*current*resistance,model:'Fixed 1.8 V forward drop; no reverse-breakdown model'};
}
export function ohms(v,r){if(!Number.isFinite(v)||!Number.isFinite(r)||r<=0)throw Error('Resistance must be positive.');return {current:v/r,power:v*v/r};}
export function sameStrip(a,b){const parse=s=>/^(\d{1,2})([a-j])$/.exec(s);const x=parse(a),y=parse(b);return !!(x&&y&&x[1]===y[1]&&(x[2]<='e')===(y[2]<='e'));}
export const voltageBetween=(red,black)=>red-black;
export function meterBound(reading,resolution=0.01,percent=0.5,counts=2){return Math.abs(reading)*percent/100+counts*resolution;}
export const slope=(x1,y1,x2,y2)=>x2===x1?null:(y2-y1)/(x2-x1);
export const netCharge=(protons,electrons)=>protons-electrons;
export const convert=(value,from,to)=>value*({base:1,milli:.001,micro:.000001,kilo:1000,mega:1000000}[from])/({base:1,milli:.001,micro:.000001,kilo:1000,mega:1000000}[to]);
