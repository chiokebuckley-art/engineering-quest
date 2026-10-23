export const modelNames={scale:'Equal groups / direct proportion',linear:'Equal additions / linear',square:'Square growth / quadratic',exponential:'Repeated multiplication / exponential',inverse:'Fixed product / inverse variation',negative:'Decreasing straight-line association',cycle:'Repeating cycle',threshold:'Conditional threshold',capacity:'Capacity bottleneck',series:'Series circuit',mixture:'Mixture fraction',confound:'Common cause',chain:'Indirect causal chain',necessary:'Necessary but not sufficient',reinforcing:'Reinforcing feedback',balancing:'Balancing feedback',delay:'Accumulation with delay',competition:'Shared resource constraint'};
export function output(model,x,c=4,a=2,b=0){
 if(![x,c,a,b].every(Number.isFinite))throw Error('Use finite values.');
 switch(model){
 case 'scale':return a*x;
 case 'linear':return a*x+b;
 case 'square':return a*x*x;
 case 'exponential':return a**x;
 case 'inverse':if(x<=0)throw Error('Input must be positive.');return a/x;
 case 'negative':return b-a*x;
 case 'cycle':return ((Math.round(x)%3)+3)%3;
 case 'threshold':return x>=c?a:0;
 case 'capacity':return Math.min(x,c,6);
 case 'series':if(c<=0)throw Error('Resistance must be positive.');return x/c;
 case 'mixture':return x/(x+c)*100;
 case 'confound':return 2*c;
 case 'chain':return Math.min(x*2,c);
 case 'necessary':return x>0&&c>0?1:0;
 case 'reinforcing':return Math.min(c,a*(1.2**x));
 case 'balancing':return c*(1-.5**x);
 case 'delay':return Math.max(0,(x-c)*3);
 case 'competition':return Math.max(0,c-x);
 default:throw Error('Unknown model '+model);
 }
}
export function dataPoints(l,c=l.control){return [1,2,3,4].map(x=>({x,y:output(l.model,x,c,l.a,l.b),c}));}
export function candidate(model,x,c,a,b){return output(model,x,c,a,b);}
export const close=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<=Math.max(.02,Math.abs(b)*.005);
export function ruleFits(l,rule,points){try{return points.every(p=>close(candidate(rule.model,p.x,p.c,rule.a,rule.b),p.y));}catch{return false;}}
export function sequenceRules(x){return {add:2*x,alternative:2*x+(x-1)*(x-2)*(x-3)};}
export function simulateNetwork({supply=8,pipe=4,outlet=6,steps=8,delay=0}){const flow=Math.min(supply,pipe,outlet);return Array.from({length:steps},(_,t)=>({t,flow:t<delay?0:flow,stored:Math.max(0,t-delay+1)*flow,bottleneck:Math.min(supply,pipe,outlet)===pipe?'connection':Math.min(supply,pipe,outlet)===outlet?'output':'source'}));}
export const objects=[{id:'A',shape:'circle',color:'blue',size:1,parts:1},{id:'B',shape:'square',color:'gold',size:2,parts:4},{id:'C',shape:'circle',color:'gold',size:2,parts:1},{id:'D',shape:'square',color:'blue',size:1,parts:4}];
export const transferObjects=[{id:'E',shape:'triangle',color:'blue',size:2},{id:'F',shape:'rectangle',color:'gold',size:1},{id:'G',shape:'triangle',color:'gold',size:1},{id:'H',shape:'rectangle',color:'blue',size:2}];
export function objectTask(kind,transfer=false){
 const tasks={
  attributes:{prompt:'Sort by shape. Color and size may change within a group.',buckets:['circle','square'],answer:['circle','square','circle','square'],why:'Use the same visible property for every object.'},
  classification:{prompt:'Sort by size. Ignore color and shape.',buckets:['small','large'],answer:['small','large','large','small'],why:'A and D are small; B and C are large. Category membership follows the chosen criterion.'},
  parts:{prompt:'Match each object to its number of straight sides.',buckets:['0 sides','4 sides'],answer:['0 sides','4 sides','0 sides','4 sides'],why:'A square has four straight sides. A circle has no straight sides; color does not determine this.'},
  order:{prompt:'Arrange the stages of a water filter: input, filtering, clean output.',items:['Clean output','Dirty input','Filter'],answer:['Dirty input','Filter','Clean output'],why:'Input reaches the process before its output. Moving labels changes order, not causation.'},
  spatial:{prompt:'Move the dot so it is inside the box and left of the triangle.',answer:[1,1],why:'Inside and left-of are two separate spatial constraints.'},
  observation:{prompt:'Classify each statement by what its evidence establishes.',items:['The meter displays 12.','The machine is safe.','The keeper says it worked yesterday.'],buckets:['observation','interpretation','report'],answer:['observation','interpretation','report'],why:'A displayed reading is observed. Safety requires further evidence. A keeper’s statement is a report.'}
 };
 if(transfer){
  tasks.attributes={prompt:'A new collection: group triangles and rectangles, ignoring color.',buckets:['triangle','rectangle'],answer:['triangle','rectangle','triangle','rectangle'],why:'The criterion is shape, even with new objects.'};
  tasks.classification={prompt:'Sort this new set by size, ignoring its unfamiliar shapes.',buckets:['small','large'],answer:['large','small','small','large'],why:'Apply the size rule to these new shapes, rather than copying earlier group positions.'};
  tasks.parts={prompt:'Count straight sides in the new collection.',buckets:['3 sides','4 sides'],answer:['3 sides','4 sides','3 sides','4 sides'],why:'Triangles have three straight sides; rectangles have four.'};
  tasks.order={prompt:'Arrange a delivery process: order, packing, arrival.',items:['Arrives','Order placed','Packed'],answer:['Order placed','Packed','Arrives'],why:'Map input-process-output roles to a different process.'};
  tasks.spatial={prompt:'Place the dot inside the lower box, left of the lower triangle.',answer:[2,1],why:'The same two constraints apply after the reference objects move.'};
  tasks.observation={prompt:'Classify new evidence about a material.',items:['The scale displays 5 g.','The material is pure.','The technician says it was calibrated.'],buckets:['observation','interpretation','report'],answer:['observation','interpretation','report'],why:'A reading, an inferred purity claim, and a source report establish different things.'};
 }
 return tasks[kind]||tasks.attributes;
}
