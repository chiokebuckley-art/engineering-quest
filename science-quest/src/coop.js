/** Shared-device science sessions. Contributions are individual; group completion is not mastery. */
import {simulate} from './models.js';import {fairPair} from './learning.js';
export const COOP_ROLES=['Designer','Builder','Tester','Explainer'];
export function rolesFor(session){return COOP_ROLES.map((role,i)=>({role,profile:session.roster[(i+session.round)%session.roster.length]}));}
export function createCoopSession(roster,mission,knownProfiles){
 if(roster.length<2||roster.length>4||new Set(roster).size!==roster.length||roster.some(id=>!knownProfiles.some(p=>p.id===id)))throw Error('Choose two to four different explorers.');
 return{id:crypto.randomUUID(),mission:mission.id,contentVersion:mission.version,model:mission.adapter,roster:[...roster],round:0,stage:'predict',turn:0,input:mission.initial,trials:[],answers:{predict:{},explain:{}},help:{predict:{},explain:{}},history:[],createdAt:Date.now()};
}
export function currentCoopActor(s){return ['predict','explain'].includes(s.stage)?s.roster[s.turn]:null;}
export function recordCoopAnswer(s,mission,actor,choice,profiles){
 if(actor!==currentCoopActor(s))throw Error('Pass the device to the current explorer.');
 const phase=s.stage,q=mission.questions[phase];if(!q||!Number.isInteger(choice)||!q.options[choice])throw Error('Choose a valid response.');
 const assisted=!!s.help[phase][actor],record={id:crypto.randomUUID(),session:s.id,round:s.round,mission:mission.id,contentVersion:mission.version,model:s.model,profile:actor,phase,choice,correct:choice===q.correct,assisted,question:q.prompt,answer:q.options[choice],trialIds:s.trials.map(t=>t.id),at:Date.now()};
 s.answers[phase][actor]=record;const p=profiles.find(p=>p.id===actor);if(!p)throw Error('Explorer is missing.');p.coopEvidence??=[];p.coopEvidence.push(record);
 s.turn++;if(s.turn===s.roster.length){s.turn=0;s.stage=phase==='predict'?'experiment':'complete';}
 return record;
}
export function markCoopHelp(s,actor){if(actor!==currentCoopActor(s))throw Error('The hint belongs to the current explorer.');s.help[s.stage][actor]=true;}
export function runCoopTrial(s,actor){
 if(s.stage!=='experiment')throw Error('Collect each explorer’s prediction first.');
 if(rolesFor(s).find(x=>x.role==='Tester').profile!==actor)throw Error('The assigned tester runs this trial.');
 const result={...simulate(s.model,s.input),id:crypto.randomUUID(),at:Date.now(),tester:actor};s.trials.push(result);return result;
}
export function explainTogether(s){if(s.stage!=='experiment'||!fairPair(s.trials))throw Error('Run two trials that change one setting before explaining.');s.stage='explain';s.turn=0;}
export function nextCoopRound(s,mission){
 if(s.stage!=='complete')throw Error('Each explorer must record an explanation first.');
 s.history.push({round:s.round,mission:s.mission,model:s.model,trials:structuredClone(s.trials),answers:structuredClone(s.answers)});
 s.round++;s.stage='predict';s.turn=0;s.input=mission.initial;s.trials=[];s.answers={predict:{},explain:{}};s.help={predict:{},explain:{}};
}
export function validateCoopSession(s,missionIds,profileIds){
 return !!s&&typeof s.id==='string'&&missionIds.has(s.mission)&&Array.isArray(s.roster)&&s.roster.length>=2&&s.roster.length<=4&&new Set(s.roster).size===s.roster.length&&s.roster.every(id=>profileIds.has(id))&&['predict','experiment','explain','complete'].includes(s.stage)&&Number.isInteger(s.turn)&&s.turn>=0&&s.turn<s.roster.length&&Array.isArray(s.trials)&&s.answers?.predict&&s.answers?.explain&&s.help?.predict&&s.help?.explain&&Array.isArray(s.history);
}
