// These poses use the lesson's saved model output, not a second physics model.
import {simulate} from './models.js';
export const WORLD_MODELS = ['push','direction','force','ramp','resistance','collision'];
export const supportsWorldExperiment = model => WORLD_MODELS.includes(model);
export function experimentAction(model,input){
  return ({push:`Push · ${input} N`,direction:input<0?'Push left':'Push right',force:`Pull · ${input} N`,ramp:'Release rover',resistance:'Launch rover',collision:'Send cart to cushion'})[model]||'Run test';
}
export function sampleExperiment(result,progress){
  const p=Math.max(0,Math.min(1,progress)),t=p*result.duration;
  if(result.model==='ramp'&&t<result.rampDuration){
    const u=(t/result.rampDuration)**2;
    return {x:-2*(1-u),y:result.input*(1-u),v:0,phase:'ramp'};
  }
  const time=result.model==='ramp'?t-result.rampDuration:t;
  const points=result.series;
  let a=points[0],b=points.at(-1);
  for(let i=1;i<points.length;i++)if(points[i].t>=time){a=points[i-1];b=points[i];break;}
  const u=b.t===a.t?1:Math.max(0,Math.min(1,(time-a.t)/(b.t-a.t)));
  return {x:a.x+(b.x-a.x)*u,y:0,v:(a.v||0)+((b.v||0)-(a.v||0))*u,phase:'lane'};
}
export function experimentObservation(result){
  const value=Number(result.value.toFixed(2));
  if(['push','direction','force'].includes(result.model))return `At the 1-second mark: ${value} m from the start. The view is paused to measure; this is not a stopping distance.`;
  if(result.model==='collision')return `${value} J transferred from the moving cart to the barrier and surroundings. The cart is now at rest.`;
  return `The rover stopped ${value} m along the level lane. This trial is saved. Reset, change one setting, and compare.`;
}

export function routeExperiment(trial){
  const {height,resistance,cushion}=trial.config;
  const ramp=simulate('ramp',height,{resistance});
  if(!trial.reaches)return ramp;
  const a=resistance*9.8,entry=ramp.speed,arrival=trial.arrivalSpeed;
  const laneTime=(entry-arrival)/a,cushionTime=2*cushion/arrival;
  const series=[];
  for(let i=0;i<=60;i++){const t=laneTime*i/60;series.push({t,x:entry*t-.5*a*t*t,v:entry-a*t});}
  for(let i=1;i<=60;i++){const u=i/60;series.push({t:laneTime+cushionTime*u,x:trial.distance+cushion*(2*u-u*u),v:arrival*(1-u)});}
  return {...ramp,series,duration:ramp.rampDuration+laneTime+cushionTime};
}
