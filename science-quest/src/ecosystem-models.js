/** Fictional compartment budgets. Carbon amounts are not organism counts or energy. */
export const carbonPools={air:'Air CO₂ carbon',plants:'Plants',grazers:'Herbivores',predators:'Predators',detritus:'Dead matter & waste',decomposers:'Decomposers'};
export const initialCarbon={air:95,plants:60,grazers:20,predators:10,detritus:10,decomposers:5};
export function carbonCycle({grazing=.1,decay=.15}={}){
 if(![grazing,decay].every(x=>Number.isFinite(x)&&x>=.05&&x<=.25))throw Error('Invalid carbon transfer fraction.');
 let pools={...initialCarbon};const records=[{step:0,pools:{...pools},total:200,flows:[]}];
 for(let step=1;step<=6;step++){
  const next={...pools},flows=[];
  const move=(from,to,amount,process)=>{next[from]-=amount;next[to]+=amount;flows.push({from,to,amount,process});};
  move('air','plants',.1*pools.air,'Photosynthesis');
  const eaten=grazing*pools.plants;move('plants','grazers',.3*eaten,'Herbivore growth');move('plants','air',.4*eaten,'Herbivore respiration from food');move('plants','detritus',.3*eaten,'Herbivore waste');
  const prey=.2*pools.grazers;move('grazers','predators',.3*prey,'Predator growth');move('grazers','air',.4*prey,'Predator respiration from food');move('grazers','detritus',.3*prey,'Predator waste');
  for(const [pool,respiration,death]of [['plants',.05,.02],['grazers',.1,.03],['predators',.1,.03],['decomposers',.1,.02]]){move(pool,'air',respiration*pools[pool],'Respiration');move(pool,'detritus',death*pools[pool],'Death / litter');}
  const decomposed=decay*pools.detritus;move('detritus','decomposers',.4*decomposed,'Decomposer growth');move('detritus','air',.6*decomposed,'Decomposer respiration from food');
  pools=next;records.push({step,pools:{...pools},total:Object.values(pools).reduce((a,b)=>a+b,0),flows});
 }
 return{records,pools,total:records.at(-1).total,grazing,decay,duration:6,timeUnit:'model step'};
}
/** One allocation pass: all energy ends in retained chemical stores, detritus or thermal transfer. */
export function foodWebEnergy(producer){if(!Number.isFinite(producer)||producer<0)throw Error('Invalid chemical-energy supply.');
 const grazerIntake=.5*producer,grazerWaste=.6*grazerIntake,grazerAssimilated=.4*grazerIntake,grazerHeat=.6*grazerAssimilated,grazerProduction=.4*grazerAssimilated;
 const predatorIntake=.5*grazerProduction,predatorWaste=.5*predatorIntake,predatorAssimilated=.5*predatorIntake,predatorHeat=.5*predatorAssimilated;
 const stores={plants:producer-grazerIntake,grazers:grazerProduction-predatorIntake,predators:predatorAssimilated-predatorHeat,detritus:grazerWaste+predatorWaste,thermal:grazerHeat+predatorHeat};
 const flows=[['Plants → herbivores',grazerIntake],['Herbivore waste → detritus',grazerWaste],['Herbivore assimilation',grazerAssimilated],['Herbivore respiration → thermal',grazerHeat],['Herbivore production',grazerProduction],['Herbivores → predators',predatorIntake],['Predator waste → detritus',predatorWaste],['Predator assimilation',predatorAssimilated],['Predator respiration → thermal',predatorHeat]];
 return{value:stores.predators,producer,stores,flows,total:Object.values(stores).reduce((a,b)=>a+b,0),duration:1,series:[{t:0,x:0},{t:1,x:stores.predators}],timeUnit:'allocation pass'};
}
const carbonCommon={unit:'%',min:5,max:25,step:5,initial:10,outUnit:'carbon units',fixed:'Start: air 95, plants 60, herbivores 20, predators 10, dead matter 10, decomposers 5 · six steps · sufficient light, water and oxygen',limits:'Closed carbon budget with invented transfer fractions and arbitrary carbon units; not organism counts, energy units or a real ecosystem forecast. Fractions use start-of-step pools and all transfers occur together. Only carbon is tracked; energy, water, oxygen, migration and nutrient limitation are omitted. Light energy enters from outside this carbon accounting.',law:'Each transfer = its fraction × the source pool at the start of the step. Next pool = previous pool + incoming carbon − outgoing carbon. Sum of all six pools stays 200.'};
export const ecosystemAdapters={
 'ecosystem-grazing':{...carbonCommon,label:'Food-web carbon cycle',input:'Plant carbon consumed per step',control:'grazing fraction',output:'Plant carbon after six steps',fixed:carbonCommon.fixed+' · detritus processing fixed at 15%',run:percent=>{const r=carbonCycle({grazing:percent/100});return{...r,value:r.pools.plants,series:r.records.map(row=>({t:row.step,x:row.pools.plants}))};}},
 'ecosystem-decay':{...carbonCommon,label:'Decomposer carbon pathway',input:'Detritus carbon processed per step',control:'decomposition fraction',output:'Detritus carbon after six steps',fixed:carbonCommon.fixed+' · grazing fixed at 10%',run:percent=>{const r=carbonCycle({decay:percent/100});return{...r,value:r.pools.detritus,series:r.records.map(row=>({t:row.step,x:row.pools.detritus}))};}},
 'ecosystem-energy':{label:'Food-web energy account',input:'Initial plant chemical energy',unit:'J',min:500,max:2500,step:500,initial:1000,output:'Chemical energy retained in predators',outUnit:'J',control:'initial plant chemical energy',fixed:'Herbivores eat 50% of plant energy and assimilate 40% of intake; 60% of assimilation becomes thermal transfer. Predators eat 50% of herbivore production, assimilate 50%, and transfer 50% of assimilation thermally.',limits:'One idealized allocation pass with fictional fractions, not universal trophic efficiencies. Begins with energy already stored chemically in plants; photosynthesis input and plant respiration are outside this account. Waste retains chemical energy in detritus. Later decomposition and subsequent respiration are not computed. Carbon mass cannot be inferred from this joule ledger.',law:'Intake splits into unassimilated waste and assimilation. Assimilation splits into thermal transfer and production. Final plant, herbivore, predator and detritus chemical stores plus thermal transfer equal the initial plant energy.',run:foodWebEnergy}
};
