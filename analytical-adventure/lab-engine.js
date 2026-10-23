import {LESSONS,getLesson,REMEDIATION} from './lab-content.js';
import {output,close,ruleFits,candidate} from './lab-models.js';
export const DAY=86400000;
export const skillKeys=['observation','detection','classification','mechanism','prediction','experiment','counterexample','transfer','retention'];
export const DEFAULT_CRITERIA={independent:2,transfer:1,retention:1,minDelayDays:1,intervals:[1,3,7,14]};
export function diagnosePrediction(l,value,x,c){if(l.model==='exponential'&&close(value,l.a*x))return 'addition-instead-of-repeated-multiplication';if(l.model==='square'&&close(value,2*x))return 'perimeter-instead-of-area';if(l.model==='inverse'&&close(value,l.a*x))return 'direct-instead-of-inverse';if(l.model==='linear'&&close(value,l.a*x))return 'omitted-starting-amount';if(l.model==='mixture'&&close(value,100*x/c))return 'solvent-instead-of-total-mass';if(l.model==='capacity'&&close(value,x))return 'ignored-bottleneck';return 'input-output-units-or-rule-gap';}
export function emptyLab(){return {version:1,attempts:[],active:null,reviews:{},criteria:structuredClone(DEFAULT_CRITERIA),duration:20,fatigue:'ready',daily:null};}
export function validateLab(lab){
 if(!lab||lab.version!==1||!Array.isArray(lab.attempts)||!lab.reviews||!lab.criteria)throw Error('Unsupported Relationship Lab save.');
 if(![5,10,15,20,25].includes(lab.duration))throw Error('Invalid session duration.');
 for(const key of ['independent','transfer','retention','minDelayDays'])if(!Number.isInteger(lab.criteria[key])||lab.criteria[key]<1||lab.criteria[key]>60)throw Error('Invalid mastery criteria.');
 if(!Array.isArray(lab.criteria.intervals)||lab.criteria.intervals.some(v=>!Number.isFinite(v)||v<1))throw Error('Invalid review intervals.');
 for(const a of [...lab.attempts,...(lab.drafts||[]),...(lab.active?[lab.active]:[])]){
  if(typeof a.id!=='string'||!LESSONS.some(l=>l.id===a.lesson)||!['guided','independent','transfer','retention','baseline'].includes(a.mode)||!['source','transfer'].includes(a.context)||!Number.isInteger(a.stage)||a.stage<0||a.stage>8||!Array.isArray(a.records)||!Array.isArray(a.samples)||!a.scores)throw Error('Invalid Relationship Lab records.');
  if(![a.input,a.control,a.target,a.seed,a.hints,a.startedAt,a.lastActive,a.activeMs].every(Number.isFinite)||a.samples.some(p=>![p.x,p.y,p.c].every(Number.isFinite)))throw Error('Invalid simulation state.');
  if(a.prediction&&![a.prediction.value,a.prediction.input,a.prediction.control].every(Number.isFinite))throw Error('Invalid lab prediction.');
 }
 return lab;
}
export function startAttempt(lab,id,mode='guided',now=Date.now()){
 if(lab.active?.lesson===id&&lab.active.mode===mode)return lab.active;
 lab.drafts=lab.drafts||[];
 if(lab.active){lab.drafts=lab.drafts.filter(a=>a.id!==lab.active.id);lab.drafts.push(structuredClone(lab.active));}
 const draft=lab.drafts.find(a=>a.lesson===id&&a.mode===mode);
 if(draft){lab.active=draft;lab.drafts=lab.drafts.filter(a=>a.id!==draft.id);return draft;}
 const l=getLesson(id);const n=lab.attempts.filter(a=>a.lesson===id).length;
 const transfer=mode==='transfer'||l.level===6;const context=transfer&&l.level!==6?{...l,...l.transfer,title:l.transfer.title,range:l.range}:l;
 const seed=n+1;
 const target=l.model==='necessary'?seed%2:mode==='guided'?5:5+seed%4;
 const probe=(transfer?'transfer':'source')+':'+target+':'+context.control;
 const attempt={id:crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join(''),lesson:id,mode,context:transfer?'transfer':'source',probe,seed,startedAt:now,lastActive:now,activeMs:0,stage:0,samples:[],records:[],scores:{},hints:0,corrective:false,confidence:'tentative',target,control:context.control,input:1,rule:null,prediction:null,observation:null,activity:null,finishedAt:null,reflection:'',transferOrigin:l.id};
 lab.active=attempt;return attempt;
}
export function contextFor(a){const l=getLesson(a.lesson);return a.context==='transfer'&&l.level!==6?{...l,...l.transfer,range:l.range}:l;}
export function tick(a,now=Date.now()){a.activeMs+=Math.max(0,Math.min(60000,now-a.lastActive));a.lastActive=now;}
export function record(a,skill,correct,response,now=Date.now(),misconception=null){tick(a,now);a.records.push({at:now,skill,correct,independent:isIndependent(a),response:structuredClone(response),hints:a.hints,confidence:a.confidence,elapsedMs:a.activeMs,misconception:correct?null:misconception||skill});if(a.scores[skill]!==false)a.scores[skill]=!!correct;if(!correct)a.corrective=true;return !!correct;}
export function sample(a,x=a.input,c=a.control){if(a.prediction!==null&&a.observation===null)throw Error('Run the committed test before exploring again.');const l=contextFor(a);const p={x,c,y:output(l.model,x,c,l.a,l.b)};a.samples.push(p);a.input=x;a.control=c;return p;}
export function useHint(a){a.hints++;a.records.push({at:Date.now(),skill:'support',correct:false,response:'worked example / reasoning hint',hints:a.hints});}
export function identify(a,rule){const l=contextFor(a);if(a.samples.length<(l.model==='necessary'?2:3)||new Set(a.samples.map(p=>p.x)).size<(l.model==='necessary'?2:3))throw Error('Inspect at least three distinct inputs first.');const ok=ruleFits(l,rule,a.samples);record(a,'detection',ok,rule);if(ok)a.rule=structuredClone(rule);return ok;}
export function commit(a,value,plan,assumption){if(a.prediction!==null)throw Error('Prediction already committed.');if(!Number.isFinite(value))throw Error('Enter a finite prediction.');if(!a.rule)throw Error('Construct a tested rule first.');a.prediction={value,plan,assumption,at:Date.now(),input:a.target,control:a.control};a.stage=6;}
export function reviseRule(a){if(a.observation===null)throw Error('Run the committed test before revising.');a.testHistory=a.testHistory||[];a.testHistory.push({prediction:structuredClone(a.prediction),observation:a.observation,rule:structuredClone(a.rule)});a.records.push({at:Date.now(),skill:'revision',correct:true,response:'Proposed a revised rule after a completed test',hints:a.hints});a.rule=null;a.prediction=null;a.observation=null;a.stage=2;}
export function runPrediction(a){if(!a.prediction)throw Error('Commit a prediction first.');if(a.observation!==null)return a.observation;const l=contextFor(a),testX=a.prediction.plan==='none'?a.input:a.target,testControl=a.prediction.plan==='both'?a.prediction.control+1:a.prediction.control,actual=output(l.model,testX,testControl,l.a,l.b);a.observation=actual;a.executedTest={input:testX,control:testControl};record(a,'prediction',close(a.prediction.value,actual)&&close(a.prediction.value,candidate(a.rule.model,a.target,a.prediction.control,a.rule.a,a.rule.b)),{...a.prediction,actual,testX,testControl},Date.now(),diagnosePrediction(l,a.prediction.value,a.target,a.prediction.control));record(a,'experiment',a.prediction.plan==='input-only'&&a.prediction.assumption==='fixed',{plan:a.prediction.plan,assumption:a.prediction.assumption});a.stage=7;return actual;}
export function isIndependent(a){return a.mode!=='guided'&&a.mode!=='baseline'&&a.hints===0&&!a.corrective;}
export function success(a){return ['observation','detection','classification','mechanism','prediction','experiment','counterexample'].every(k=>a.scores[k]===true);}
export function finishAttempt(lab,now=Date.now()){
 const a=lab.active;if(!a||a.stage!==8||a.observation===null)throw Error('Finish the reasoning stages first.');tick(a,now);a.finishedAt=now;
 const previous=lab.attempts.filter(t=>t.lesson===a.lesson&&t.finishedAt&&success(t));
 if(a.context==='transfer')record(a,'transfer',success(a)&&isIndependent(a),{context:a.context,probe:a.probe},now);
 const latest=previous.at(-1);a.delayMs=latest?now-latest.finishedAt:0;
 if(a.mode==='retention')record(a,'retention',success(a)&&isIndependent(a)&&!!latest&&a.startedAt-latest.finishedAt>=lab.criteria.minDelayDays*DAY,{delayMs:latest?a.startedAt-latest.finishedAt:0},now);
 lab.attempts.push(structuredClone(a));const streak=previous.filter(t=>isIndependent(t)&&success(t)).length;const interval=lab.criteria.intervals[Math.min(streak,lab.criteria.intervals.length-1)];lab.reviews[a.lesson]=now+(success(a)?interval:1)*DAY;lab.active=null;return a;
}
export function mastery(lab,id){const list=lab.attempts.filter(a=>a.lesson===id&&a.finishedAt);const distinct=new Map(list.filter(a=>isIndependent(a)&&success(a)).map(a=>[a.probe,a]));const values=[...distinct.values()];const independent=values.length;const transfer=values.filter(a=>a.scores.transfer).length;const retention=values.filter(a=>a.scores.retention).length;return {independent,transfer,retention,status:independent>=lab.criteria.independent&&transfer>=lab.criteria.transfer&&retention>=lab.criteria.retention?'retained mastery':independent>=lab.criteria.independent&&transfer>=lab.criteria.transfer?'retention pending':values.length?'building independent evidence':list.length?'guided foundation':'not assessed'};}
export function nextRecommendation(lab,now=Date.now()){
 const due=LESSONS.find(l=>lab.reviews[l.id]&&lab.reviews[l.id]<=now);if(due)return {lesson:due.id,mode:'retention',why:'A delayed review is due. Try a fresh probe without opening the example.'};
 const last=lab.attempts.at(-1);if(last){const gap=skillKeys.find(k=>last.scores[k]===false);if(gap){const [id,why]=REMEDIATION[gap];return {lesson:id,mode:'guided',why};}}
 if(last&&success(last)){
  const evidence=mastery(lab,last.lesson);
  if(evidence.independent<lab.criteria.independent)return {lesson:last.lesson,mode:'independent',why:'Fade the guidance: test a fresh input independently before advancing.'};
  if(evidence.transfer<lab.criteria.transfer)return {lesson:last.lesson,mode:'transfer',why:'Apply the structure in a different domain without its relationship name.'};
 }
 const foundational=LESSONS.find(l=>!lab.attempts.some(a=>a.lesson===l.id&&success(a)));if(foundational)return {lesson:foundational.id,mode:'guided',why:'Build the next foundation through observation and testing.'};
 const next=LESSONS.find(l=>mastery(lab,l.id).independent<lab.criteria.independent);return {lesson:next?.id||'t-chemical',mode:next?'independent':'transfer',why:'Add evidence from a fresh independent investigation.'};
}
export function skillSummary(lab){return skillKeys.map(skill=>{const rows=lab.attempts.flatMap(a=>a.records.filter(r=>r.skill===skill).map(r=>({...r,independent:r.independent??isIndependent(a)})));const independent=rows.filter(r=>r.independent),hinted=rows.filter(r=>!r.independent);return {skill,n:rows.length,correct:rows.filter(r=>r.correct).length,independent:independent.length,independentCorrect:independent.filter(r=>r.correct).length,supported:hinted.length,supportedCorrect:hinted.filter(r=>r.correct).length};});}
export function dailyPlan(lab,now=Date.now()){
 const date=new Intl.DateTimeFormat('en-CA').format(new Date(now));if(lab.daily?.date===date)return lab.daily;
 const next=nextRecommendation(lab,now),old=lab.attempts.filter(a=>success(a)).at(-1);const warm=old?.lesson||'attributes';
 const queue=[{lesson:warm,mode:!old?'guided':now-old.finishedAt>=DAY?'retention':'independent',role:'Retrieval warm-up'},{...next,role:'Focused discovery'},{lesson:next.lesson,mode:'independent',role:'Independent prediction'},{lesson:next.lesson,mode:'transfer',role:'New-domain transfer'}];
 lab.daily={date,queue:lab.fatigue==='tired'||lab.duration<=10?queue.slice(0,2):queue,index:0,reflection:''};return lab.daily;
}
export function baselinePlan(){return ['attributes','proportion','confound'];}
