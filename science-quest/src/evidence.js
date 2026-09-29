import {categoryForStage} from './controller.js';
export function recordAttempt(run,mission,question,choice,now=Date.now()){
 if(!question||!Number.isInteger(choice)||choice<0||choice>=question.options.length)throw Error('Choose a valid answer first.');
 const attempt={id:crypto.randomUUID(),at:now,mission:mission.id,contentVersion:mission.version,model:mission.adapter,stage:run.stage,category:categoryForStage(run.stage),variant:run.attempts?.[run.stage]||0,itemId:question.itemId||null,contextId:question.contextId||null,prompt:question.prompt,options:[...question.options],selected:choice,answer:question.options[choice],correct:choice===question.correct,assisted:!!run.assistance?.[run.stage],retentionReview:!!run.reviewing,trialIds:[...(run.compareSelection||[])],transferTrialIds:(run.transferTrials?.[run.stage]||[]).map(t=>t.id),predictionNote:run.predictionNote||'',explanationNote:run.notes||''};
 run.assessmentHistory??=[];run.assessmentHistory.push(attempt);return attempt;
}
export function addAdultFeedback(run,{reviewer,note,nextStep},now=Date.now()){
 if(!reviewer?.trim()||!note?.trim()||!['discuss','practice','extend'].includes(nextStep))throw Error('Add your name, feedback and a next step.');
 const review={id:crypto.randomUUID(),at:now,reviewer:reviewer.trim().slice(0,80),note:note.trim().slice(0,2000),nextStep,attemptIds:(run.assessmentHistory||[]).map(a=>a.id),predictionNote:run.predictionNote||'',explanationNote:run.notes||''};run.adultFeedback??=[];run.adultFeedback.push(review);return review;
}
