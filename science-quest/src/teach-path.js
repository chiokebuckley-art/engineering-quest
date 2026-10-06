import {skillState} from './learning.js';
import {esc} from './visuals.js';

// Path badges are derived from independent evidence, never copied from world rewards.
export const TEACH_UNITS = [
  {id:0,title:'Meet Pip & the islands',words:['trial','fair'],intro:'I am Pip. We will notice something, try one change, and check what happened. A trial is one test. Fair means keeping the other conditions the same. You can walk around or use the field tablet without walking.',mission:null},
  {id:1,title:'What is a fair test?',words:['trial','fair','variable'],intro:'A variable is something you can change. To find out what a stronger push does, change the push but keep the cart and pushing time the same. Changing the cart AND the push leaves two possible causes. First watch the fair-test example, then make your own comparison.',mission:'keep-it-fair'},
  {id:2,title:'One variable: push',words:['force','trial'],intro:'A force is a push or pull. Compare two pushes on the same cart, from the same starting place, for the same time. Watch the cart before introducing the numbers. N means newtons: the unit used for force.',mission:'first-move'},
  {id:3,title:'Controlled comparison',words:['variable','fair','trial'],intro:'Compare the records from two trials. Point to the one thing that changed and the things held fixed. Revisit your fair-test investigation if any independent checks are still missing.',mission:'keep-it-fair'},
  {id:4,title:'One variable: height',words:['energy','distance','model'],intro:'A higher start stores more energy in the rover-Earth system. As the rover rolls down, energy transfers into motion. Keep the rover and lane unchanged while comparing heights. Our model is a simplified description, not every detail of a real rover.',mission:'rover-rescue'},
  {id:5,title:'Surface and resistance',words:['distance','energy'],intro:'Rolling resistance slows motion. Start each trial with the same rover and entry speed, then change only the stopping surface. Energy transfers to the surroundings; it does not disappear.',mission:'stopping-zone'},
  {id:6,title:'Arrival energy',words:['energy','distance'],intro:'Compare equal-mass carts meeting the same soft barrier. A faster cart carries more energy. Look at how much the same barrier changes when it stops each cart.',mission:'gentle-delivery'},
  {id:7,title:'Design under constraints',words:['model','distance'],intro:'A constraint is a limit your design must meet. Use what you know about height and resistance to deliver the cargo. First compare one change at a time; then choose and justify a working design.',mission:'cargo-budget'},
  {id:8,title:'Restore the route',words:['energy','force','model'],intro:'Connect the ramp, stopping lane, and cushion. Predict, test, and explain each part. Finish both the independent mission checks and the connected route design.',mission:'restore-route',capstone:true},
  {id:9,title:'Explore your working harbor',words:[],intro:'Your guided route is complete. Run the harbor, invent in Free Lab, or practice in Arcade. These activities preserve your learning record; they do not automatically award mastery.',mission:null}
];
export function ensureTeachPath(profile,isNew=false){
  return profile.teachPath??={version:1,enabled:isNew,seen:{},unit:0};
}
export function validateTeachPath(path){
  if(!path||path.version!==1||typeof path.enabled!=='boolean'||!Number.isInteger(path.unit)||path.unit<0||path.unit>9||!path.seen||typeof path.seen!=='object'||Array.isArray(path.seen)||Object.entries(path.seen).some(([k,v])=>!/^\d$/.test(k)||v!==true))throw Error('Invalid Teach Path progress');
}
export function unitClear(profile,id){
  const unit=TEACH_UNITS[id];if(!unit)return false;
  if(id===9)return TEACH_UNITS.slice(0,9).every(u=>unitClear(profile,u.id));
  if(!profile.teachPath?.seen?.[id])return false;
  if(!unit.mission)return true;
  const run=profile.runs?.[unit.mission];
  return ['Demonstrated','Retained'].includes(skillState(run))&&(!unit.capstone||!!run?.capstone?.complete);
}
export function nextTeachUnit(profile){return TEACH_UNITS.find(u=>!unitClear(profile,u.id))||TEACH_UNITS[9];}
export function unitAvailable(profile,id){return Number.isInteger(id)&&id>=0&&id<=9&&TEACH_UNITS.slice(0,id).every(u=>unitClear(profile,u.id));}
export function missionPathUnit(id){return TEACH_UNITS.find(u=>u.mission===id);}
export function canStartPathMission(profile,id){
  if(!profile.teachPath?.enabled)return true;
  const unit=missionPathUnit(id);
  return !unit||(unitAvailable(profile,unit.id)&&!!profile.teachPath.seen[unit.id]);
}
export function markUnitSeen(profile,id){
  if(!unitAvailable(profile,id))throw Error('Finish the earlier independent checks first.');
  const path=ensureTeachPath(profile);path.seen[id]=true;path.unit=id;
}
export function teachPathView(profile,{unit:requested,collapsed=false}={}){
  ensureTeachPath(profile);
  const unit=TEACH_UNITS[requested??profile.teachPath.unit]||nextTeachUnit(profile);
  const unlocked=unitAvailable(profile,unit.id),seen=!!profile.teachPath.seen[unit.id];
  const cleared=unitClear(profile,unit.id),run=profile.runs?.[unit.mission];
  const state=unit.mission?skillState(run):'Orientation';
  return `<section class="teach-intro"><p class="eyebrow">TEACH PATH · MOTION HARBOR · UNIT ${unit.id} OF 9</p><h2>${esc(unit.title)}</h2><p>See → Do → Check. Walking is optional; the harbor stays 3D.</p>
    <details class="teach-unit-list"><summary>Quest route · ${TEACH_UNITS.slice(1,9).filter(u=>unitClear(profile,u.id)).length} / 8 learning units clear</summary><ol>${TEACH_UNITS.map(u=>`<li><button data-action="teach-unit" data-unit="${u.id}" ${unitAvailable(profile,u.id)?'':'disabled'} aria-current="${u.id===unit.id?'step':'false'}">${unitClear(profile,u.id)?'✓':unitAvailable(profile,u.id)?'○':'🔒'} ${u.id}. ${esc(u.title)}</button></li>`).join('')}</ol></details>
    ${!unlocked?`<p>Complete the earlier independent checks to open this quest.</p>`:`<div class="pip-note"><span aria-hidden="true">🤖</span><p>${esc(unit.intro)}</p></div>
    <div class="mission-words"><b>See: meet the ideas first</b><p>${unit.words.map(w=>`<button class="term" data-action="term" data-term="${w}">${esc(w)}</button>`).join(' · ')}</p><button class="secondary" data-action="teach-read" data-unit="${unit.id}">Read Pip's introduction</button>${[1,3].includes(unit.id)?'<button class="secondary" data-action="clip-open" data-term="fair" data-id="clip-fair">Watch the fair-test example</button>':''}</div>
    ${!seen&&unit.id!==9?`<button class="primary full" data-action="teach-seen" data-unit="${unit.id}">I have seen the idea →</button><p class="muted">This records the introduction only. It awards no skill evidence.</p>`:''}
    ${seen&&unit.mission?`<p><b>Checks:</b> ${state}. Unit clear requires all six independent evidence categories${unit.capstone?' and the connected-route capstone':''}.</p><button class="primary full" data-action="teach-do" data-unit="${unit.id}">${run?.stage==='done'&&!cleared?'Practice missing checks':'Open field investigation'}</button>`:''}
    ${cleared&&unit.id<9?`<button class="primary full" data-action="teach-unit" data-unit="${unit.id+1}">Next quest →</button>`:''}
    ${unit.id===9?'<button class="primary full" data-action="teach-explore">Run the restored harbor</button><button class="secondary" data-action="nav" data-view="lab">Free Lab</button><button class="secondary" data-action="nav" data-view="arcade">Arcade</button>':''}`}
    <p class="muted">Exploration rewards and mission completion are separate from demonstrated understanding.</p><button class="text-button" data-action="teach-free">Choose free exploration instead</button></section>`;
}

export function fieldTabletFrame(content,{collapsed=false,label='Pip · Quest tablet',experiment=false,action='',running=false,runAction='run'}={}){
  return `<section class="teach-world" aria-label="3D Motion Harbor Teach Path"><div id="harbor-walk-canvas-container" class="teach-world-canvas" tabindex="0" aria-label="3D harbor: WASD or touch controls to walk, drag to look"></div>
  <header class="teach-world-header"><button class="secondary" data-action="nav" data-view="explore">← Islands</button><strong>Motion Harbor · 3D Teach Path</strong><button class="secondary" data-action="harbor-walk-focus-rover">Find rover</button></header>
  <div class="harbor-walk-touch-controls teach-dpad" role="group" aria-label="Touch walk controls"><div class="harbor-walk-dpad">${[['up','forward','▲'],['left','left','◀'],['right','right','▶'],['down','backward','▼']].map(([cls,dir,icon])=>`<button class="touch-btn touch-${cls}" data-action="touch-walk" data-dir="${dir}" aria-label="Walk ${dir}">${icon}</button>`).join('')}<button class="touch-btn touch-center" data-action="harbor-walk-focus-rover" aria-label="Find rover">🧭</button></div></div>
  <aside class="teach-tablet ${experiment?'is-experiment':''} ${collapsed?'is-collapsed':''}" aria-label="Quest field tablet"><header><strong>${experiment?'🤖 Pip':esc(label)}</strong><button class="secondary" data-action="teach-toggle" aria-controls="teach-tablet-body" aria-expanded="${!collapsed}">${collapsed?'Show task':'Minimize'}</button></header><div id="teach-tablet-body" ${collapsed?'hidden':''}><button class="text-button" data-action="teach-open">Quest route</button>${content}</div></aside>${experiment&&collapsed&&action?`<div class="world-action-dock"><button class="primary" data-action="${runAction}" ${running?'disabled':''}>${running?'Watching test…':esc(action)}</button>${running?'<span role="status">Watch the rover. Pip will return with your result.</span>':'<span>Tap or press E</span>'}</div>`:''}</section>`;
}
