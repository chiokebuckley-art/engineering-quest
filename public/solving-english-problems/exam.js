// Placement exam engine: pure functions, no DOM. Adaptive per area — two items at a tier; both right
// climbs a tier, otherwise the area stops. Level = highest tier fully passed (0–3). Nothing here writes
// mastery into the three modules: the exam only recommends where to start.
import { AREAS, ITEMS, TIERS } from './exam-content.js';
export const PER_TIER=2;
export const AUDIENCES=[
 {id:'child',title:'A young beginner',blurb:'Kindergarten to grade 2, or just starting to read. Grown-ups can read the questions aloud.'},
 {id:'student',title:'A student',blurb:'Grades 3 to 12. Building school English, one skill at a time.'},
 {id:'adult',title:'An adult',blurb:'Rebuilding foundations or filling gaps, with the full reference tools.'},
];
/** mulberry32: a seed reproduces the same exam, so tests and retakes are predictable. */
export function createRng(seed){let s=seed>>>0;return ()=>{s=(s+0x6d2b79f5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function shuffle(list,random=Math.random){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const areaIds=AREAS.map(a=>a.id);
export function newExam({audience='student',seed=Date.now()}={}){
 if(!AUDIENCES.some(a=>a.id===audience))throw Error('Unknown audience');
 const state={version:1,audience,seed,areaIndex:0,tier:1,asked:[],answers:[],done:false,startedAt:null,finishedAt:null};
 state.current=pick(state);return state;
}
function pick(state){
 const area=areaIds[state.areaIndex];if(!area)return null;
 const random=createRng(state.seed+state.asked.length*7919+state.tier*104729);
 const pool=ITEMS.filter(i=>i.area===area&&i.tier===state.tier&&!state.asked.includes(i.id));
 if(!pool.length)return null;
 const item=pool[Math.floor(random()*pool.length)];
 return {id:item.id,area,tier:state.tier,prompt:item.prompt,read:item.read,options:shuffle(item.options,random),answer:item.options[0],why:item.why};
}
/** Tally of right answers at the current tier for the current area. */
function tierCount(state,area,tier){return state.answers.filter(a=>a.area===area&&a.tier===tier);}
export function answer(state,option){
 if(state.done||!state.current)return state;
 const q=state.current;const correct=option===q.answer;
 const next={...state,asked:[...state.asked,q.id],answers:[...state.answers,{id:q.id,area:q.area,tier:q.tier,correct,picked:option}],startedAt:state.startedAt||Date.now()};
 const done=tierCount(next,q.area,q.tier);
 if(done.length>=PER_TIER||!correct){
  const passed=done.length>=PER_TIER&&done.every(a=>a.correct);
  if(passed&&next.tier<TIERS)next.tier+=1;else{next.areaIndex+=1;next.tier=1;}
 }
 next.current=pick(next);
 if(!next.current){next.done=true;next.finishedAt=Date.now();}
 return next;
}
/** Per-area level 0–3 (highest tier with both items right) and whether the next tier was half right. */
export function levels(state){
 const out={};
 for(const area of areaIds){
  let level=0,partial=false;
  for(let t=1;t<=TIERS;t++){const r=tierCount(state,area,t);if(r.length===PER_TIER&&r.every(a=>a.correct))level=t;else{partial=r.some(a=>a.correct)&&r.length>0;break;}}
  out[area]={level,partial};
 }
 return out;
}
export const LEVEL_NAMES=['Start at the beginning','Foundations in place','Growing','Strong'];
export function summarize(state){
 const lv=levels(state);
 const perArea=AREAS.map(a=>({...a,level:lv[a.id].level,partial:lv[a.id].partial,asked:state.answers.filter(x=>x.area===a.id).length,right:state.answers.filter(x=>x.area===a.id&&x.correct).length,label:LEVEL_NAMES[lv[a.id].level]}));
 const weakest=[...perArea].sort((a,b)=>a.level-b.level||areaIds.indexOf(a.id)-areaIds.indexOf(b.id))[0];
 return {audience:state.audience,answered:state.answers.length,correct:state.answers.filter(a=>a.correct).length,perArea,weakest:weakest?.id||null,levels:Object.fromEntries(perArea.map(a=>[a.id,a.level])),at:state.finishedAt||Date.now()};
}
/** Progress through the exam as a 0–1 estimate (areas finished plus tiers climbed). */
export function progress(state){if(state.done)return 1;return Math.min(.99,(state.areaIndex+(state.tier-1)/TIERS)/areaIds.length);}
export function validateExam(x){
 if(!x||x.version!==1||!AUDIENCES.some(a=>a.id===x.audience)||!Number.isFinite(x.seed)||!Array.isArray(x.answers)||x.answers.length>AREAS.length*TIERS*PER_TIER)throw Error('Not a saved exam.');
 for(const a of x.answers){if(!ITEMS.some(i=>i.id===a.id&&i.area===a.area&&i.tier===a.tier)||typeof a.correct!=='boolean')throw Error('The saved exam has an invalid answer.');}
 return x;
}
