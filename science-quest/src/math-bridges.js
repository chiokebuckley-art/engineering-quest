/** Optional math practice; never awards science mastery or world restoration. */
let authoredItem = 0;
const positions = [0,2,1,2,1,0,2,1,2,1,0,2,1,2,0,1];
const item=(prompt,answer,wrong1,wrong2,worked)=>{
 const correct=positions[authoredItem++],options=[wrong1,wrong2];
 options.splice(correct,0,answer);
 return {prompt,options,correct,worked};
};
export const mathBridges={
 tables:{title:'Read and compare a trial table',intro:'Read the labels and units first. Compare matching measurements in a known order.',items:[
 item('Trial A traveled 2 m. Trial B traveled 5 m. Which traveled farther?','Trial B.','Trial A.','They traveled equally far.','Both measurements use metres. Five is greater than two.'),
 item('The same table shows A = 2 m and B = 5 m. How much farther did B travel?','3 m.','7 m.','3 seconds.','Subtract the first distance from the second: 5 m − 2 m = 3 m.'),
 item('A table has columns labeled distance (m) and time (s). A row shows distance 4 and time 2. What does the row say?','The object traveled 4 m in 2 s.','The object traveled 2 m in 4 s.','The object traveled 6 m.','Read each number under its own column label. Do not add different quantities together.'),
 item('Trial A was not measured. Trial B traveled 3 m. Can you compare their distances?','No: A needs a measurement.','A must have traveled zero metres.','B must have traveled farther.','A blank result is missing evidence, not a measurement of zero. Record both distances before comparing.') ]},
 speed:{title:'Distance, time and average speed',intro:'Average speed is total distance divided by elapsed time. Keep distance and time units visible.',items:[
 item('A carrier travels a total distance of 6 m in 3 s. Its average speed is…','2 m/s.','18 m/s.','2 seconds.','6 m ÷ 3 s = 2 m/s. Speed is distance per unit time.'),
 item('Two carriers each travel 6 m. A takes 2 s; B takes 3 s. Which has greater average speed?','A.','B.','They must have equal speeds.','A: 6 ÷ 2 = 3 m/s. B: 6 ÷ 3 = 2 m/s. Less time for the same distance means greater average speed.'),
 item('A constant speed is 2 m/s for 4 s. What distance is traveled?','8 m.','0.5 m.','8 m/s.','Distance = speed × time = 2 m/s × 4 s = 8 m.'),
 item('A carrier goes 3 m right, then 3 m left, in 6 s. Compare average speed and average velocity.','Speed is 1 m/s; velocity is 0 m/s.','Both are zero because it returns.','Velocity is 6 m/s.','Total distance is 6 m; displacement is zero. Average speed uses distance, while average velocity uses signed displacement.') ]},
 relationships:{title:'Ratios and squared quantities',intro:'Name what stays fixed before using a relationship. A proportional rule is different from a squared rule.',items:[
 item('At the same lane resistance, doubling ramp height doubles stopping distance in this model. A 0.10 m start gives 0.50 m. A 0.20 m start gives…','1.00 m.','0.25 m.','0.50 m.','With resistance fixed, d = h/c. Doubling h doubles d.'),
 item('For the same mass, kinetic energy is proportional to speed squared. Doubling speed changes kinetic energy by…','A factor of four.','A factor of two.','No change.','(2v)² = 4v². Keep mass fixed before using this comparison.'),
 item('At fixed net force, doubling mass changes acceleration by…','A factor of one half.','A factor of two.','No change for any mass.','a = F/m. Doubling the denominator while keeping force fixed halves acceleration.'),
 item('A 2 kg cart moves at 3 m/s. In K = ½mv², what kinetic energy is predicted?','9 J.','6 J.','18 watts.','½ × 2 kg × (3 m/s)² = 9 kg·m²/s² = 9 J. Joules and watts describe different quantities.') ]},
 budgets:{title:'Percentages, units and design limits',intro:'Convert percentages to fractions. Track energy, rates, margins and each design limit separately.',items:[
 item('Storage is 1200 Wh and delivery efficiency is 75%. How much energy is delivered?','900 Wh.','1600 Wh.','900 W.','75% = 0.75. Delivered energy = 1200 Wh × 0.75 = 900 Wh.'),
 item('A constant 60 W load runs for 10 h. How much energy does it require?','600 Wh.','6 Wh.','600 W.','Energy = power × time = 60 W × 10 h = 600 Wh.'),
 item('Delivered energy is 900 Wh; demand is 600 Wh; a 100 Wh reserve is required. What margin remains after reserve?','200 Wh.','300 Wh.','1600 Wh.','Margin = delivered − demand − reserve = 900 − 600 − 100 = 200 Wh.'),
 item('Plan A meets the energy need but exceeds the mass limit. Plan B meets energy and mass limits. Which is feasible under both constraints?','Plan B.','Plan A because energy is enough.','Both: choose whichever has the bigger battery.','A feasible design satisfies every required constraint in the same plan. One successful measurement does not cancel a failed constraint.') ]}
};
const comparisonTable={caption:'Carrier trial distances',headers:['Trial','Distance (m)'],rows:[['A','2'],['B','5']]};
mathBridges.tables.items[0].table=comparisonTable;
mathBridges.tables.items[1].table=comparisonTable;
mathBridges.tables.items[2].table={caption:'Carrier trial record',headers:['Trial','Distance (m)','Time (s)'],rows:[['C','4','2']]};
mathBridges.tables.items[3].table={caption:'An incomplete trial record',headers:['Trial','Distance (m)'],rows:[['A','Not measured'],['B','3']]};
export function createMathBridge(){return{version:1,step:0,answers:[],history:[],revealed:[],complete:false,draft:null,feedback:null};}
export function bridgeForMission(m){if(m.band==='K–2'||m.band==='3–5')return 'tables';if(m.adapter.includes('energy')||['night-reserve','power-limit','uncertainty'].includes(m.adapter))return 'budgets';if(['ramp','force','collision','force-mass','mass-track','momentum','collision-momentum'].includes(m.adapter)||m.id==='same-force-more-mass'||m.id==='momentum-through-collisions')return 'relationships';return ['push','direction','resistance'].includes(m.adapter)||m.id==='same-force-more-mass'?'speed':'tables';}
export function chooseMath(s,id,choice){const i=mathBridges[id]?.items[s.step];if(s.complete||!i||!Number.isInteger(choice)||choice<0||choice>=i.options.length)throw Error('Invalid math choice.');s.draft=choice;s.feedback=null;}
export function checkMath(s,id,help=false){const i=mathBridges[id]?.items[s.step];if(s.complete||!i)throw Error('Math bridge is complete.');if(help){if(!s.revealed.includes(s.step))s.revealed.push(s.step);if(s.answers[s.step])s.answers[s.step].assisted=true;s.feedback={ok:false,text:i.worked};return;}if(!Number.isInteger(s.draft))throw Error('Choose an answer first.');const ok=s.draft===i.correct,assisted=s.revealed.includes(s.step)||!ok;if(!ok){if(!s.revealed.includes(s.step))s.revealed.push(s.step);if(s.answers[s.step])s.answers[s.step].assisted=true;}s.history.push({step:s.step,choice:s.draft,correct:ok,assisted,at:Date.now()});s.feedback={ok,text:ok?'That matches the quantities and units.':i.worked};if(ok)s.answers[s.step]={choice:s.draft,assisted};}
export function nextMath(s,id){if(s.complete||!s.feedback?.ok||s.answers[s.step]?.choice!==mathBridges[id].items[s.step].correct)throw Error('Check your answer before continuing.');if(s.step===mathBridges[id].items.length-1){s.complete=true;s.completedAt=Date.now();}else{s.step++;s.draft=null;s.feedback=null;}}
export function validateMathBridges(records){
 if(!records||typeof records!=='object'||Array.isArray(records))throw Error('Invalid math bridges.');
 for(const [id,s]of Object.entries(records)){
  const pack=mathBridges[id];
  if(!pack||!s||s.version!==1||!Number.isInteger(s.step)||s.step<0||s.step>=pack.items.length||typeof s.complete!=='boolean'||!Array.isArray(s.answers)||s.answers.length>pack.items.length||!Array.isArray(s.history)||!Array.isArray(s.revealed)||(s.draft!==null&&(!Number.isInteger(s.draft)||s.draft<0||s.draft>=3))||s.revealed.some(x=>!Number.isInteger(x)||x<0||x>=pack.items.length))throw Error('Invalid math checkpoint.');
  for(const h of s.history){
   if(!h||!Number.isInteger(h.step)||h.step<0||h.step>=pack.items.length||!Number.isInteger(h.choice)||h.choice<0||h.choice>=3||h.correct!==(h.choice===pack.items[h.step].correct)||typeof h.assisted!=='boolean'||(!h.correct&&!h.assisted)||(h.assisted&&!s.revealed.includes(h.step))||!Number.isFinite(h.at)||h.at<=0)throw Error('Invalid math attempt.');
  }
  for(let j=0;j<pack.items.length;j++){
   const a=s.answers[j];
   if(a&&(j>s.step||a.choice!==pack.items[j].correct||typeof a.assisted!=='boolean'||(s.revealed.includes(j)&&!a.assisted)||!s.history.some(h=>h.step===j&&h.correct)))throw Error('Invalid math answer.');
  }
  if(s.feedback!==null&&(!s.feedback||typeof s.feedback.ok!=='boolean'||typeof s.feedback.text!=='string'||(s.feedback.ok&&(!s.answers[s.step]||s.draft!==pack.items[s.step].correct))))throw Error('Invalid math feedback.');
  if(pack.items.some((_,j)=>j<s.step&&!s.answers[j]))throw Error('Missing earlier math answer.');
  if(s.complete&&(s.step!==pack.items.length-1||pack.items.some((_,j)=>!s.answers[j])||!Number.isFinite(s.completedAt)||s.completedAt<=0))throw Error('Incomplete math bridge marked complete.');
 }
 return records;
}
