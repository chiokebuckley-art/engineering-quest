import {MISSIONS,BY_ID,DISTRICTS} from './content.js';
export const VERSION=1;
export const INTERVALS=[600000,86400000,3*86400000,7*86400000,14*86400000,30*86400000];
export const REPAIR_INTERVALS=[0,3*86400000,7*86400000];
export const normalize=s=>String(s).replace(/[’]/g,"'").replace(/\s+([.,!?;:])/g,'$1').replace(/\s+/g,' ').trim().toLowerCase();
export const textOf=tokens=>tokens.join(' ').replace(/\s+([.,!?;:])/g,'$1');
export function matches(q,tokens){return q.solutions?.some(s=>normalize(s)===normalize(textOf(tokens)))||false;}
export function rng(seed=Date.now()){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function shuffle(items,random=Math.random){let a=[...items];for(let i=a.length-1;i>0;i--){let j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function newProfile(name='Apprentice',now=Date.now()){return{id:`p-${now}-${Math.floor(Math.random()*1e6)}`,name:name.trim().slice(0,30)||'Apprentice',xp:0,gears:0,completed:[],lessons:[],records:{},notebook:[],bests:{},createdAt:now,settings:{sound:true,motion:true,read:false}};}
export function newSave(){let p=newProfile();return{version:VERSION,active:p.id,profiles:[p]};}
export function band(m){return m>=90?'Mastered':m>=70?'Competent':m>=40?'Developing':'Learning';}
export function mastery(rec){if(!rec?.history?.length)return 0;let sum=0,w=0;rec.history.forEach((x,i)=>{let k=.85**(rec.history.length-1-i);sum+=Number(x)*k;w+=k;});let confidence=Math.min(1,(rec.attempts||0)/6);let transfer=Math.min(1,(rec.seen||[]).length/3);return Math.round(sum/w*(40+40*confidence+20*transfer));}
export function districtStats(p,id){let qs=MISSIONS.filter(q=>q.district===id),skills=[...new Set(qs.map(q=>q.skill))];return{done:qs.filter(q=>p.completed.includes(q.id)).length,total:qs.length,mastery:Math.round(skills.reduce((n,s)=>n+mastery(p.records[s]),0)/skills.length)};}
export function record(p,q,correct,{now=Date.now(),ms=0,mode='campaign',assisted=false}={}) {
 let r=p.records[q.skill]||{attempts:0,correct:0,history:[],seen:[],times:[],dueAt:now,rung:0};
 r={...r,attempts:r.attempts+1,correct:r.correct+(correct?1:0),history:[...r.history,correct].slice(-12),seen:[...new Set([...r.seen,q.id])],times:correct?[...r.times,Math.max(0,ms)].slice(-8):r.times,lastAt:now};
 r.rung=correct?Math.min(INTERVALS.length-1,r.rung+1):0;r.dueAt=now+INTERVALS[r.rung];p.records[q.skill]=r;
 if(correct){p.xp+=assisted?5:20;p.gears+=assisted?1:5;if(mode==='campaign'&&!p.completed.includes(q.id))p.completed.push(q.id);}
 else noteMiss(p,q,now);
 return r;
}
export function noteMiss(p,q,now=Date.now()){let entry=p.notebook.find(e=>e.qid===q.id&&!e.clearedAt);if(entry){entry.clean=0;entry.lapses++;entry.dueAt=now;}else p.notebook.push({qid:q.id,skill:q.skill,clean:0,lapses:0,dueAt:now,createdAt:now});}
export function finishAssisted(p,q,mode='campaign'){p.xp+=5;p.gears+=1;if(mode==='campaign'&&!p.completed.includes(q.id))p.completed.push(q.id);}
export function nextCampaign(p,district){const pool=MISSIONS.filter(q=>!district||q.district===district);return pool.find(q=>!p.completed.includes(q.id))||pool[0];}
export function choosePractice(p,{district='all',kind='all',random=Math.random,exclude=[]}={}) {
 let pool=MISSIONS.filter(q=>(district==='all'||q.district===district)&&(kind==='all'||(kind==='choice'?q.type==='choice':q.type!=='choice'))&&!exclude.includes(q.id));
 if(!pool.length)pool=MISSIONS.filter(q=>(district==='all'||q.district===district)&&(kind==='all'||(kind==='choice'?q.type==='choice':q.type!=='choice')));
 if(!pool.length)return null;
 const weights=pool.map(q=>1+(100-mastery(p.records[q.skill]))/25+(!p.records[q.skill]?2:0)+(p.records[q.skill]?.dueAt<Date.now()?3:0));let pick=random()*weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<pool.length;i++){pick-=weights[i];if(pick<=0)return pool[i];}return pool.at(-1);
}
export function repairQueue(entry,random=Math.random){let q=BY_ID[entry.qid];if(!q)return[];let candidates=MISSIONS.filter(v=>v.id!==q.id&&v.skill===q.skill);if(candidates.length<3)candidates=[...candidates,...MISSIONS.filter(v=>v.id!==q.id&&v.district===q.district&&!candidates.includes(v))];let variations=shuffle(candidates,random).slice(0,3);let twist=shuffle(MISSIONS.filter(v=>v.district===q.district&&v.id!==q.id&&!variations.includes(v)),random)[0];return[q,...variations,...(twist?[twist]:[])];}
export function completeRepair(entry,clean,now=Date.now()){if(!clean){entry.clean=0;entry.dueAt=now+600000;return;}entry.clean++;if(entry.clean>=3)entry.clearedAt=now;else entry.dueAt=now+REPAIR_INTERVALS[entry.clean];}
export function validateSave(data){
 if(!data||data.version!==VERSION||!Array.isArray(data.profiles)||data.profiles.length<1||data.profiles.length>20)throw Error('This is not a supported Sentence Forge save.');
 let ids=new Set();let profiles=data.profiles.map(p=>{
  if(!p||typeof p.id!=='string'||p.id.length>100||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>30)throw Error('A profile is invalid.');ids.add(p.id);
  if(!Number.isFinite(p.xp)||p.xp<0||!Number.isFinite(p.gears)||p.gears<0)throw Error('Progress values are invalid.');
  if(!Array.isArray(p.completed)||p.completed.some(id=>!BY_ID[id])||!Array.isArray(p.lessons)||p.lessons.some(id=>!DISTRICTS.some(d=>d.id===id)))throw Error('The save contains unknown lessons or orders.');
  if(!p.records||typeof p.records!=='object'||Array.isArray(p.records)||!Array.isArray(p.notebook)||p.notebook.length>2000)throw Error('The progress history is invalid.');
  let records={};for(const [key,r] of Object.entries(p.records)){
   if(!MISSIONS.some(q=>q.skill===key)||!r||!Number.isInteger(r.attempts)||r.attempts<0||!Number.isInteger(r.correct)||r.correct<0||r.correct>r.attempts||!Array.isArray(r.history)||r.history.length>12||r.history.some(x=>typeof x!=='boolean')||!Array.isArray(r.seen)||r.seen.some(x=>!BY_ID[x])||!Array.isArray(r.times)||r.times.length>8||r.times.some(x=>!Number.isFinite(x)||x<0)||!Number.isFinite(r.dueAt)||!Number.isInteger(r.rung)||r.rung<0||r.rung>=INTERVALS.length)throw Error('A mastery record is invalid.');
   records[key]={attempts:r.attempts,correct:r.correct,history:[...r.history],seen:[...new Set(r.seen)],times:[...r.times],dueAt:r.dueAt,rung:r.rung,lastAt:Number(r.lastAt)||0};
  }
  let notebook=p.notebook.map(e=>{if(!e||!BY_ID[e.qid]||!Number.isInteger(e.clean)||e.clean<0||e.clean>3||!Number.isFinite(e.dueAt)||!Number.isFinite(e.lapses)||e.lapses<0)throw Error('A repair card is invalid.');return{qid:e.qid,skill:BY_ID[e.qid].skill,clean:e.clean,lapses:e.lapses,dueAt:e.dueAt,createdAt:Number(e.createdAt)||0,clearedAt:Number(e.clearedAt)||0};});
  let bests={};if(p.bests&&typeof p.bests==='object')for(let[k,v]of Object.entries(p.bests)){if(k.length<120&&Number.isFinite(v)&&v>=0)bests[k]=v;}
  return{id:p.id,name:p.name.trim(),xp:p.xp,gears:p.gears,completed:[...new Set(p.completed)],lessons:[...new Set(p.lessons)],records,notebook,bests,createdAt:Number(p.createdAt)||Date.now(),settings:{sound:p.settings?.sound!==false,motion:p.settings?.motion!==false,read:p.settings?.read===true}};
 });if(!ids.has(data.active))throw Error('Active profile was not found.');return{version:VERSION,active:data.active,profiles};
}
