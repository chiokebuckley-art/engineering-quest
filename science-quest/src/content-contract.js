/** Validate executable content; structural checks never substitute for science/educator review. */
export function validateContent({missions,regions,adapters,pathways=[],glossary={}}){
 const errors=[],ids=new Set(),regionIds=new Set(regions.map(r=>r.id));const byId=new Map(missions.map(m=>[m.id,m]));
 for(const m of missions){
  const fail=msg=>errors.push(`${m.id||'<missing id>'}: ${msg}`);
  if(typeof m.id!=='string'||!m.id)fail('missing ID');if(ids.has(m.id))fail('duplicate ID');ids.add(m.id);
  if(!regionIds.has(m.region))fail('unknown region');
  if(!Number.isInteger(m.version)||m.version<1)fail('invalid content version');
  const model=adapters[m.adapter];if(!model){fail('unknown simulation adapter');continue;}
  if(!model.limits||!model.law||!model.fixed||!model.outUnit)fail('model needs limits, relationship, controls and output units');
  if(!m.story||!m.skill)fail('missing phenomenon or objective');
  if(!Array.isArray(m.compare)||m.compare.length!==2||m.compare[0]===m.compare[1])fail('two distinct comparison inputs are required');
  const allowed=x=>Number.isFinite(x)&&x>=model.min&&x<=model.max&&Math.abs((x-model.min)/model.step-Math.round((x-model.min)/model.step))<1e-7;
  for(const x of [m.initial,...(m.compare||[])])if(!allowed(x))fail('off-grid or out-of-range parameter');
  for(const field of ['predict','explain','t1','t2']){const q=m.questions?.[field];if(!q?.prompt||!Array.isArray(q.options)||q.options.length<2||q.options.some(x=>typeof x!=='string'||!x.trim())||new Set(q.options).size!==q.options.length||!Number.isInteger(q.correct)||q.correct<0||q.correct>=q.options.length)fail(`invalid ${field} question`);}
  for(const pre of m.prerequisites||[])if(!byId.has(pre))fail('unknown prerequisite '+pre);
  for(const term of m.vocabulary||[])if(!glossary[term])fail('undefined vocabulary '+term);
  const checkDesign=(spec,name,options={})=>{
   if(spec.maxInput!=null&&(!allowed(spec.maxInput)||!spec.constraint))fail(`${name}: height limit needs an allowed setting and visible constraint`);
   if(!Array.isArray(spec.target)||spec.target.length!==2||!spec.target.every(Number.isFinite)||spec.target[0]>spec.target[1]){fail(`${name}: invalid target interval`);return;}
   let solved=false;for(let x=model.min;x<=model.max+1e-7;x+=model.step){x=Number(x.toFixed(6));const result=model.run(x,options);if(result.value>=spec.target[0]&&result.value<=spec.target[1]&&(spec.maxInput==null||x<=spec.maxInput)&&(!spec.requireFeasible||result.feasible===true))solved=true;}
   if(!solved)fail(`${name}: no allowed setting solves all constraints in the same test`);
  };
  if(m.target)checkDesign(m,'mission');
  if(m.transfers){for(const [stage,t]of Object.entries(m.transfers)){
   if(!['transfer1','transfer2'].includes(stage))fail('unknown executed transfer stage');
   if(!t||typeof t!=='object'){fail('invalid executed transfer');continue;}
   if(!t.title||!t.story||!t.fixed||!allowed(t.initial))fail(`${stage}: missing brief or invalid initial setting`);
   const q=t.question;if(!q?.prompt||!Array.isArray(q.options)||q.options.length!==3||q.options.some(x=>typeof x!=='string'||!x.trim())||new Set(q.options).size!==3||!Number.isInteger(q.correct)||q.correct<0||q.correct>=3)fail(`${stage}: invalid explanation question`);
   const validOptions=model.stoppingVariant?t.options&&Object.keys(t.options).length===1&&[1.5,2,3].includes(t.options.speed):t.options&&Object.keys(t.options).length===1&&[.1,.2,.4].includes(t.options.resistance);
   if(!validOptions){fail(`${stage}: invalid lane configuration`);continue;}
   checkDesign(t,stage,t.options);
  }}
 }
 const visiting=new Set(),visited=new Set();function visit(id){if(visiting.has(id)){errors.push('Prerequisite cycle at '+id);return;}if(visited.has(id))return;visiting.add(id);for(const p of byId.get(id)?.prerequisites||[])if(byId.has(p))visit(p);visiting.delete(id);visited.add(id);}ids.forEach(visit);
 const gradeIds=new Set();for(const p of pathways){if(gradeIds.has(p.grade))errors.push('Duplicate grade route '+p.grade);gradeIds.add(p.grade);if(!p.missions.length)errors.push('Empty pathway '+p.grade);for(const id of p.missions)if(!byId.has(id))errors.push(`Pathway ${p.grade}: unknown mission ${id}`);}
 return errors;
}
