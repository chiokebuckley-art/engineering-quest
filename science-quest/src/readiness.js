import {skillState} from './learning.js';
/** Reading level is deliberately not an input to scientific tool readiness. */
export const advancedTools={
 ramp:{name:'Combined ramp and surface controls',requires:['rover-rescue','stopping-zone'],reason:'Changing both ramp height and lane resistance assumes you can interpret each relationship separately.'},
 energy:{name:'Storage and conversion controls',requires:['night-lab'],reason:'Changing storage and delivery efficiency assumes you can distinguish energy, power and conversion transfers.'}
};
export function toolReadiness(profile,adapter){const tool=advancedTools[adapter];if(!tool)return{ready:true,missing:[]};const missing=tool.requires.filter(id=>!['Demonstrated','Retained'].includes(skillState(profile.runs?.[id])));return{...tool,ready:missing.length===0,missing};}
export function validateLabOptions(profile,adapter,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))throw Error('Invalid lab configuration');
 if(adapter==='ramp'){
  if(Object.keys(options).some(k=>k!=='resistance')||(options.resistance!==undefined&&![.1,.2,.4].includes(options.resistance)))throw Error('Choose an available lane surface');
  if((options.resistance??.2)!==.2&&!toolReadiness(profile,adapter).ready)throw Error('Complete the ramp and stopping-lane preparation before combining their controls');
 }else if(adapter==='energy'){
  if(Object.keys(options).some(k=>!['storage','efficiency'].includes(k)))throw Error('Unsupported energy control');
  const storage=options.storage??800,efficiency=options.efficiency??.8;
  if(!Number.isFinite(storage)||storage<100||storage>2000||storage%100!==0||![.6,.8,1].includes(efficiency))throw Error('Use storage from 100 to 2000 Wh in steps of 100 and an available efficiency');
  if((storage!==800||efficiency!==.8)&&!toolReadiness(profile,adapter).ready)throw Error('Complete Night Lab before changing storage and conversion controls');
 }else if(Object.keys(options).length)throw Error('This lab has no extra controls');
 return options;
}
export function canRunLab(profile,lab){try{validateLabOptions(profile,lab.adapter,lab.options);return true;}catch{return false;}}
export function changeLabOption(profile,lab,key,value){const options={...lab.options,[key]:value};validateLabOptions(profile,lab.adapter,options);lab.options=options;return options;}
