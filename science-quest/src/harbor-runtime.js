import {energyLedger} from './energy-planning.js';
import {simulate,insideBay} from './models.js';

// One fixed 0.1 minute model step = 0.1 second of active play. No offline catch-up.
export const HARBOR_STEP=.1;
export const HARBOR_RULES={labWatts:6,craneWatts:18,labMinutes:2,craneMinutes:2,routeMinutes:3,readyCapacity:8,loadedCapacity:6};
const facilities={lab:['rover-rescue','harbor-route'],crane:['first-move','harbor-crane'],route:['restore-route','harbor-hub'],power:['night-lab','coast-power']};
export function harborUnlocked(p,id){const [mission,upgrade]=facilities[id];return !!p.runs?.[mission]?.completed||!!p.world?.upgrades?.some(u=>u.id===upgrade);}
export function harborLimits(p){return harborUnlocked(p,'power')?{capacity:24,powerLimit:30}:{capacity:12,powerLimit:18};}
export function createHarborRuntime(){return {version:1,ticks:0,settings:{paused:false,generation:8,height:.3},bins:{energy:4,arriving:12,ready:3,loaded:0,delivered:0},progress:{lab:0,crane:0,route:0},totals:{received:0,generated:0,used:0,spilled:0,misses:0},trip:null,deliveries:[],samples:[],last:{labW:0,craneW:0,generatedWh:0,usedWh:0,unservedWh:0,labStatus:'Needs discovery',craneStatus:'Needs discovery',routeStatus:'Needs discovery'}};}
export function ensureHarborRuntime(p){return p.harborRuntime??=createHarborRuntime();}
export function setHarborSetting(p,key,value){const s=ensureHarborRuntime(p);if(key==='paused'){if(typeof value!=='boolean')throw Error('Choose pause or run.');}else if(key==='generation'){if(![0,8,24].includes(value))throw Error('Choose a generator setting.');}else if(key==='height'){simulate('ramp',value); }else throw Error('Unknown harbor control.');s.settings[key]=value;return s;}
export function receiveHarborCargo(p){const s=ensureHarborRuntime(p);if(s.bins.arriving>12)throw Error('Make room before receiving another shipment.');s.bins.arriving+=12;s.totals.received+=12;return s;}
function progress(s,key,amount,action){s.progress[key]+=amount;if(s.progress[key]>=1-1e-9){s.progress[key]=Math.max(0,s.progress[key]-1);action();}}
export function stepHarbor(p){
 const s=ensureHarborRuntime(p),b=s.bins,old={...b},r=HARBOR_RULES,limits=harborLimits(p),hours=HARBOR_STEP/60;
 const generated=s.settings.generation*hours,overflow=Math.max(0,b.energy+generated-limits.capacity);
 b.energy=Math.min(limits.capacity,b.energy+generated);s.totals.generated+=generated;s.totals.spilled+=overflow;
 const labReady=harborUnlocked(p,'lab')&&harborUnlocked(p,'route')&&old.arriving>0&&old.ready<r.readyCapacity;
 const craneReady=harborUnlocked(p,'crane')&&old.ready>0&&old.loaded<r.loadedCapacity;
 const request=(labReady?r.labWatts:0)+(craneReady?r.craneWatts:0);
 const ledger=energyLedger({storage:b.energy,efficiency:1,reserve:0,powerLimit:limits.powerLimit,schedule:[{hours,watts:request}]});
 const servedW=ledger.ledger[0].served/hours,labW=labReady?Math.min(r.labWatts,servedW):0,craneW=craneReady?Math.min(r.craneWatts,Math.max(0,servedW-labW)):0;
 b.energy=ledger.remaining;s.totals.used+=ledger.ledger[0].served;
 const powerStatus=(watts,need)=>watts<1e-8?'No power':watts<need-1e-8?'Slowed by power limit':'Running';
 let labStatus=!harborUnlocked(p,'lab')?'Needs discovery':!harborUnlocked(p,'route')?'Waiting for route discovery':old.arriving===0?'Waiting for shipment':old.ready>=r.readyCapacity?'Output bay full':powerStatus(labW,r.labWatts);
 let craneStatus=!harborUnlocked(p,'crane')?'Needs discovery':old.ready===0?'Waiting for prepared cargo':old.loaded>=r.loadedCapacity?'Loaded bay full':powerStatus(craneW,r.craneWatts);
 if(labReady)progress(s,'lab',HARBOR_STEP/r.labMinutes*labW/r.labWatts,()=>{b.arriving--;b.ready++;});
 if(craneReady)progress(s,'crane',HARBOR_STEP/r.craneMinutes*craneW/r.craneWatts,()=>{b.ready--;b.loaded++;});
 let routeStatus=!harborUnlocked(p,'route')?'Needs discovery':old.loaded===0?'Waiting for loaded cargo':'Running';
 if(harborUnlocked(p,'route')&&old.loaded>0){
  s.trip??={height:s.settings.height,startedTick:s.ticks};
  progress(s,'route',HARBOR_STEP/r.routeMinutes,()=>{
   const result=simulate('ramp',s.trip.height),success=insideBay(result.value);
   const delivery={tick:s.ticks+1,height:s.trip.height,resistance:.2,distance:result.value,energy:result.energy,modelVersion:result.modelVersion,success};
   s.deliveries.push(delivery);s.deliveries=s.deliveries.slice(-20);
   if(success){b.loaded--;b.delivered++;}else{s.totals.misses++;routeStatus='Bay missed · cargo kept';}
   s.trip=null;
  });
 }
 if(s.deliveries.at(-1)?.success===false&&routeStatus==='Running')routeStatus='Bay missed · adjust the next ramp';
 s.ticks++;s.last={labW,craneW,generatedWh:generated,usedWh:ledger.ledger[0].served,unservedWh:ledger.unserved,labStatus,craneStatus,routeStatus};
 if(s.ticks%10===0){s.samples.push({tick:s.ticks,energy:b.energy,arriving:b.arriving,ready:b.ready,loaded:b.loaded,delivered:b.delivered});s.samples=s.samples.slice(-120);}
 return s;
}
export function advanceHarbor(p,steps=10){if(!Number.isInteger(steps)||steps<1||steps>36000)throw Error('Invalid number of harbor steps.');for(let i=0;i<steps;i++)stepHarbor(p);return p.harborRuntime;}
export function validateHarborRuntime(s){
 const integer=x=>Number.isSafeInteger(x)&&x>=0&&x<=1e9,nonnegative=x=>Number.isFinite(x)&&x>=-1e-8;
 if(!s||s.version!==1||!integer(s.ticks)||typeof s.settings?.paused!=='boolean'||![0,8,24].includes(s.settings.generation)||!s.bins||!s.progress||!s.totals||!s.last||!Array.isArray(s.deliveries)||s.deliveries.length>20||!Array.isArray(s.samples)||s.samples.length>120)throw Error('Invalid harbor save.');
 simulate('ramp',s.settings.height);
 for(const key of ['arriving','ready','loaded','delivered'])if(!integer(s.bins[key]))throw Error('Invalid harbor cargo.');
 if(s.bins.arriving>24||s.bins.ready>8||s.bins.loaded>6||!nonnegative(s.bins.energy)||s.bins.energy>24+1e-7)throw Error('Harbor bin outside its capacity.');
 if(!integer(s.totals.received)||s.totals.received%12!==0||!integer(s.totals.misses)||['generated','used','spilled'].some(k=>!nonnegative(s.totals[k])))throw Error('Invalid harbor totals.');
 if(s.bins.arriving+s.bins.ready+s.bins.loaded+s.bins.delivered!==15+s.totals.received)throw Error('Harbor cargo is not conserved.');
 const scale=Math.max(1,4+s.totals.generated);
 if(Math.abs(4+s.totals.generated-s.bins.energy-s.totals.used-s.totals.spilled)>1e-8*scale)throw Error('Harbor energy is not conserved.');
 if(['lab','crane','route'].some(k=>!nonnegative(s.progress[k])||s.progress[k]>=1+1e-8))throw Error('Invalid harbor work progress.');
 if(s.trip!==null){if(!s.trip||!integer(s.trip.startedTick)||s.trip.startedTick>s.ticks||s.bins.loaded<1)throw Error('Invalid harbor dispatch.');simulate('ramp',s.trip.height);}
 for(const key of ['labW','craneW','generatedWh','usedWh','unservedWh'])if(!nonnegative(s.last[key]))throw Error('Invalid harbor flow.');
 if(s.last.labW>6+1e-8||s.last.craneW>18+1e-8||['labStatus','craneStatus','routeStatus'].some(k=>typeof s.last[k]!=='string'||s.last[k].length>100))throw Error('Invalid harbor status.');
 let previous=-1;for(const d of s.deliveries){const expected=simulate('ramp',d.height);if(!integer(d.tick)||d.tick<=previous||d.tick>s.ticks||!Number.isFinite(d.distance)||!Number.isFinite(d.energy)||d.resistance!==.2||d.modelVersion!==expected.modelVersion||d.success!==insideBay(expected.value)||Math.abs(d.distance-expected.value)>1e-8||Math.abs(d.energy-expected.energy)>1e-8)throw Error('Invalid saved harbor delivery.');previous=d.tick;}
 previous=-1;for(const row of s.samples){if(!integer(row.tick)||row.tick<=previous||row.tick>s.ticks||row.tick%10!==0||!nonnegative(row.energy)||row.energy>24+1e-7||['arriving','ready','loaded','delivered'].some(k=>!integer(row[k]))||row.arriving>24||row.ready>8||row.loaded>6)throw Error('Invalid harbor sample.');previous=row.tick;}
 return s;
}
