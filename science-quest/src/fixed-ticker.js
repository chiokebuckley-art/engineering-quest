/** Bounded fixed-step accumulator. Dropped wall time never becomes offline progress. */
export function createFixedTicker(step=.1,maxFrame=.25){
 let last=null,accumulator=0;
 return {reset(){last=null;accumulator=0;},frame(now,tick){
  if(!Number.isFinite(now))throw Error('Invalid frame time.');
  if(last===null){last=now;return 0;}
  const delta=Math.max(0,Math.min(maxFrame,(now-last)/1000));last=now;accumulator+=delta;
  let count=0;while(accumulator>=step-1e-10){tick();accumulator=Math.max(0,accumulator-step);count++;}return count;
 }};
}
