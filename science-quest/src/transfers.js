import {energyTransfer} from './energy-transfers.js';
/** Executed transfer contexts for the reference ramp investigation. */
import {insideBay} from './models.js';
export function transferPlan(mission,run){
  if(mission.transfers?.[run.stage]){const entry=mission.transfers[run.stage],contextId=`${mission.id}-${run.stage}-executed-v1`;return{...entry,adapter:mission.adapter,contextId,question:{...entry.question,itemId:contextId+'-explain',contextId}};}
  const energy=energyTransfer(mission,run.stage);if(energy)return energy;
  if(!['rover-rescue','new-trolley'].includes(mission.id))return null;
  if(run.stage==='transfer1')return{adapter:'ramp',title:'New trolley delivery',story:'A different supply trolley needs a farther loading bay. Use the same ideal model and surface. Build and test your design, then explain the evidence.',target:[1.95,2.05],initial:.15};
  if(run.stage==='transfer2')return{adapter:'ramp',title:'Sorting-ramp transfer',story:'Seed packets now travel in a small sorting trolley. The receiving tray is only one metre beyond the ramp exit. Test a new ramp setting for this closer destination.',target:[.95,1.05],initial:.45};
  return null;
}
export function beginTransfer(run,mission){const plan=transferPlan(mission,run);if(!plan)return;run.input=plan.initial;run.transferTrials??={};run.transferTrials[run.stage]??=[];run.transferAttemptStart??={};run.transferAttemptStart[run.stage]=run.transferTrials[run.stage].length;}
export function transferTrials(run){return run.transferTrials?.[run.stage]||[];}
export function transferSatisfied(mission,run){const plan=transferPlan(mission,run);if(!plan)return true;const trials=transferTrials(run).slice(run.transferAttemptStart?.[run.stage]||0);return trials.some(t=>t.model===plan.adapter&&JSON.stringify(t.options||{})===JSON.stringify(plan.options||{})&&insideBay(t.value,...plan.target)&&(!plan.requireFeasible||t.feasible===true)&&(!plan.maxInput||t.input<=plan.maxInput));}

export function missionDesignSatisfied(mission,trial){return (!mission.target||insideBay(trial.value,...mission.target))&&(mission.maxInput==null||trial.input<=mission.maxInput);}
