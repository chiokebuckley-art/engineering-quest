import {adapters,simulate,round} from './models.js';
const contexts={
 'library-return':[['Archive book carrier',.1,.15],['Reading-room delivery',.15,.25]],'greenhouse-crates':[['Pot carrier',.2,.3],['Nursery supplies',.3,.4]],
 'same-force-more-mass':[['Instrument carrier',1,3],['Supply carrier',3,6]],'momentum-through-collisions':[['Soft coupling',.25,.5],['Firmer coupling',.5,.75]],
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
 if(item&&m.band==='3–5'&&['force','collision'].includes(m.adapter)){
 const increase=context.inputs[1]>context.inputs[0];
 if(m.adapter==='force'&&['predict','compare','transfer1','transfer2'].includes(stage)){
 const f=context.inputs[1],strength=f>4?'stronger than':f<4?'weaker than':'equal to';
 const outcomes=['It starts moving right.','It starts moving left.','It stays at rest.'],correct=f>4?0:f<4?1:2;
 item=q(`${context.title}. Reset the cart to rest. In the second setup the rightward pull is ${strength} the leftward pull. What motion does this model predict?`,outcomes[correct],...outcomes.filter((_,i)=>i!==correct));
 }
 if(m.adapter==='collision'&&['predict','transfer1','transfer2'].includes(stage))item.prompt=`${context.title}. Use identical carts and barriers. The second cart enters ${increase?'faster':'slower'} than the first. Its energy transfer while stopping will be…`;
 if(stage==='explain')item.prompt=`${context.title}. Keep the cart and other conditions fixed and ${increase?'increase':'decrease'} ${m.adapter==='force'?'the rightward pull':'the entry speed'}. Which explanation fits this fair test?`;
 }

 if(item&&m.id==='same-force-more-mass'&&['predict','transfer1','transfer2','explain'].includes(stage)){const mass=context.inputs[1]>context.inputs[0]?'greater':'smaller';item.prompt=stage==='explain'?`${context.title}. Under the same net force and time interval, why does the cart with more mass have a smaller change in speed?`:`${context.title}. Both carts start at rest under the same net force for the same time. The second cart has ${mass} mass. Its change in speed is…`;}
 return item?{...item,itemId:context.id+'-'+stage,contextId:context.id,contextInputs:[...context.inputs]}:null;
}
export function itemIdentity(m,q){return JSON.stringify([m.id,m.version,q.itemId||null,q.prompt,q.options]);}
export function revealItem(run,m,q,now=Date.now()){const identity=itemIdentity(m,q);run.revealedItems??=[];if(!run.revealedItems.some(x=>x.identity===identity))run.revealedItems.push({identity,at:now});run.assistance[run.stage]=true;}
export function itemWasRevealed(run,m,q){return !!run.revealedItems?.some(x=>x.identity===itemIdentity(m,q))||!!run.assessmentHistory?.some(a=>a.assisted&&a.prompt===q.prompt&&JSON.stringify(a.options)===JSON.stringify(q.options));}
