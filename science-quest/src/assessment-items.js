import {adapters,simulate,round} from './models.js';
const contexts={
 'first-move':[['Library cart',1,2],['Greenhouse cart',2,4]],'which-way':[['West loading dock',-1,1],['East sorting dock',1,-1]],
 'keep-it-fair':[['Matched supply carts',1,3],['One-cart comparison',2,5]],'tug-together':[['Balanced bridge team',4,6],['Opposite dock team',4,2]],
 'stronger-side':[['Right-side tow crew',5,7],['Left-side tow crew',1,3]],'stopping-zone':[['Short service lane',.15,.3],['Long service lane',.2,.4]],
 'rover-rescue':[['Seed delivery ramp',.15,.25],['Tool delivery ramp',.2,.4]],'gentle-delivery':[['Soft seed cushion',.5,1.5],['Instrument cushion',1,2.5]],
 'choose-a-brake':[['Sorting brake lane',.25,.5],['Workshop brake lane',.15,.35]],'cargo-budget':[['Low-ramp delivery',.1,.25],['Limited-parts delivery',.15,.3]],
 'new-trolley':[['Long-route trolley',.3,.5],['Short-route trolley',.1,.2]],'restore-route':[['Workshop connector',.2,.35],['Nursery connector',.15,.4]]
};
const q=(prompt,correct,...wrong)=>({prompt,options:[correct,...wrong],correct:0});
export function assessmentContexts(m){return [{id:m.id+'-original',title:m.title,story:m.story},...(contexts[m.id]||[]).map(([title,a,b],i)=>({id:m.id+'-context-'+(i+1),title,inputs:[a,b],story:`${title}: compare ${adapters[m.adapter].control} settings ${a} and ${b} ${adapters[m.adapter].unit}. Other model conditions stay fixed.`}))];}
export function equivalentItem(m,stage,attempt){if(!contexts[m.id]||attempt<1)return null;const list=assessmentContexts(m).slice(1),context=list[(attempt-1)%list.length],a=adapters[m.adapter],x=simulate(m.adapter,context.inputs[0]),y=simulate(m.adapter,context.inputs[1]);const relation=y.value>x.value?'greater than':y.value<x.value?'less than':'equal to',opposite=relation==='greater than'?'less than':'greater than';let item;
 if(['predict','transfer1','transfer2'].includes(stage))item=q(`${context.title}. With all other conditions fixed, change ${a.control} from ${context.inputs[0]} to ${context.inputs[1]} ${a.unit}. Predict the second ${a.output.toLowerCase()}.`,`${relation} the first.`,`${opposite} the first.`,relation==='equal to'?'It is impossible to compare under the specified model.':'equal to the first.');
 else if(stage==='build')item=q(`${context.title}. How can you test whether ${a.control} caused the change?`,`Use the same setup and change only ${a.control}.`,`Change ${a.control} and the object together.`,`Change all conditions between trials.`);
 else if(stage==='compare')item=q(`${context.title}. The first measurement is ${round(x.value,4)} ${a.outUnit}; the second is ${round(y.value,4)} ${a.outUnit}. Which comparison matches these recorded values?`,`${relation} the first.`,`${opposite} the first.`,relation==='equal to'?'The numbers cannot be compared.':'equal to the first.');
 else if(stage==='explain')item=q(`${context.title}. These controlled trials change ${a.control} from ${context.inputs[0]} to ${context.inputs[1]} ${a.unit}. Which explanation respects the model?`,m.questions.explain.options[m.questions.explain.correct],...m.questions.explain.options.filter((_,i)=>i!==m.questions.explain.correct));
 return item?{...item,itemId:context.id+'-'+stage,contextId:context.id,contextInputs:[...context.inputs]}:null;
}
export function itemIdentity(m,q){return JSON.stringify([m.id,m.version,q.itemId||null,q.prompt,q.options]);}
export function revealItem(run,m,q,now=Date.now()){const identity=itemIdentity(m,q);run.revealedItems??=[];if(!run.revealedItems.some(x=>x.identity===identity))run.revealedItems.push({identity,at:now});run.assistance[run.stage]=true;}
export function itemWasRevealed(run,m,q){return !!run.revealedItems?.some(x=>x.identity===itemIdentity(m,q))||!!run.assessmentHistory?.some(a=>a.assisted&&a.prompt===q.prompt&&JSON.stringify(a.options)===JSON.stringify(q.options));}
