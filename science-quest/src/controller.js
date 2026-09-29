/** Durable mission checkpoints. Rendering state must not be the only copy of an answer. */
import {CATEGORIES,fairPair} from './learning.js';
export const STEP_ORDER=['notice','predict','build','test','compare','explain','transfer1','transfer2','done'];
export const categoryForStage=stage=>({build:'fair',compare:'interpret'}[stage]||stage);
export function checkpoint(run){
  if(!run.checkpoint||run.checkpoint.stage!==run.stage)run.checkpoint={stage:run.stage,choice:null,feedback:null};
  return run.checkpoint;
}
export function enterStage(run,stage){
  if(!STEP_ORDER.includes(stage))throw Error('Unknown mission step');
  run.stage=stage;run.checkpoint={stage,choice:null,feedback:null};return run.checkpoint;
}
export function chooseAnswer(run,value){
  if(!Number.isInteger(value)||value<0)throw Error('Invalid answer choice');
  const c=checkpoint(run);c.choice=value;c.feedback=null;return c;
}
export function storeFeedback(run,feedback){
  if(typeof feedback?.ok!=='boolean'||typeof feedback.text!=='string')throw Error('Invalid response');
  checkpoint(run).feedback={...feedback};
}
export function advanceRun(run,now=Date.now()){
  const c=checkpoint(run);
  if(run.stage!=='notice'&&!c.feedback?.ok)throw Error('Check your idea before continuing.');
  if(run.reviewing||run.retrying){run.reviewing=false;run.retrying=false;enterStage(run,'done');return;}
  run.answers[run.stage]=c.choice;
  const next={notice:'predict',predict:'build',build:'test',compare:'explain',explain:'transfer1',transfer1:'transfer2',transfer2:'done'}[run.stage];
  if(!next)throw Error('This step needs its experiment before continuing.');
  if(next==='done'){run.completed=true;run.completedAt??=now;}
  enterStage(run,next);
}
export function beginRetry(run){
  const missing=CATEGORIES.find(k=>!run.evidence[k]);if(!missing)return false;
  const stage={fair:'build',interpret:'compare'}[missing]||missing;
  run.attempts[stage]=(run.attempts[stage]||0)+1;run.assistance[stage]=false;run.retrying=true;
  enterStage(run,stage);return true;
}
export function beginReview(run){
  if(!CATEGORIES.every(k=>run.evidence[k]))throw Error('Complete the independent checks before a retention review.');
  run.reviewing=true;run.attempts.transfer2=(run.attempts.transfer2||0)+1;run.assistance.transfer2=false;
  enterStage(run,'transfer2');
}
export function selectedTrials(run){
  const ids=run.compareSelection||[];
  return ids.map(id=>run.trials.find(t=>t.id===id)).filter(Boolean);
}
export function toggleTrialSelection(run,id){
  if(!run.trials.some(t=>t.id===id))throw Error('Trial not found.');
  const chosen=run.compareSelection||[];
  if(chosen.includes(id))run.compareSelection=chosen.filter(x=>x!==id);
  else{if(chosen.length>=2)throw Error('Unselect a trial before choosing another.');run.compareSelection=[...chosen,id];}
}
export function hasSelectedFairPair(run){const pair=selectedTrials(run);return pair.length===2&&fairPair(pair);}
export function migrateRun(run){
  // Additive migration preserves previously earned evidence, trials and inventions.
  run.version??=1;run.attempts??={};run.answers??={};run.assistance??={};run.evidence??={};run.hintHistory??=[];
  run.trialIds=run.trials.map((t,i)=>{t.id??=`legacy-${run.mission}-${i}`;return t.id;});
  if(!run.compareSelection&&['compare','explain','transfer1','transfer2','done'].includes(run.stage)){
    const a=run.trials.find(t=>run.trials.some(u=>u.id!==t.id&&fairPair([t,u])));
    const b=a&&run.trials.find(t=>t.id!==a.id&&fairPair([a,t]));
    run.compareSelection=a&&b?[a.id,b.id]:[];
  }
  checkpoint(run);return run;
}
