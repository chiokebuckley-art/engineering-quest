import test from 'node:test';
import assert from 'node:assert/strict';
import {CATEGORIES,makeProfile,createRun,validateSave} from '../src/learning.js';
import {byId,glossary} from '../src/content.js';
import {TEACH_UNITS,ensureTeachPath,markUnitSeen,unitClear,unitAvailable,canStartPathMission,nextTeachUnit,teachPathView,fieldTabletFrame} from '../src/teach-path.js';
import {recordExploration} from '../src/exploration-record.js';
test('New explorers start guided; existing evidence stays opt-in',()=>{
 const fresh=makeProfile();assert.equal(ensureTeachPath(fresh,true).enabled,true);
 const old=makeProfile();old.runs['first-move']=createRun(byId['first-move']);assert.equal(ensureTeachPath(old).enabled,false);
});
test('Ordered path requires introductions and all six independent checks, not completion',()=>{
 const p=makeProfile();ensureTeachPath(p,true);
 assert.equal(canStartPathMission(p,'rover-rescue'),false);
 assert.throws(()=>markUnitSeen(p,4));
 for(const unit of TEACH_UNITS.slice(0,9)){
  assert.equal(nextTeachUnit(p).id,unit.id);assert.ok(unitAvailable(p,unit.id));markUnitSeen(p,unit.id);
  if(unit.mission){const r=p.runs[unit.mission]??=createRun(byId[unit.mission]);
   if(unit.id!==3){r.completed=true;assert.equal(unitClear(p,unit.id),false);r.evidence=Object.fromEntries(CATEGORIES.map(k=>[k,true]));}
   if(unit.capstone){assert.equal(unitClear(p,unit.id),false);r.capstone={complete:true};}
  }
  assert.ok(unitClear(p,unit.id));
 }
 assert.equal(nextTeachUnit(p).id,9);assert.ok(unitClear(p,9));
});
test('Exploration records never overwrite mission learning or create mastery',()=>{
 const p=makeProfile();p.runs['rover-rescue']=createRun(byId['rover-rescue']);p.runs['rover-rescue'].evidence.predict=true;
 const before=JSON.stringify(p.runs),state={trials:[{height:.2,distance:1}]};
 recordExploration(p,'motion',state,123);assert.equal(JSON.stringify(p.runs),before);
 state.trials[0].height=.8;assert.equal(p.explorations.motion.trials[0].height,.2);
 recordExploration(p,'earth',{trials:[]},124);assert.equal(p.runs['soil-runoff'],undefined);
});
test('Path vocabulary exists; accessible field tablet can minimize without replacing the world',()=>{
 for(const unit of TEACH_UNITS)for(const word of unit.words)assert.ok(glossary[word],word);
 const p=makeProfile();ensureTeachPath(p);markUnitSeen(p,0);p.teachPath.unit=1;
 assert.match(teachPathView(p),/data-id="clip-fair"/);
 const html=fieldTabletFrame('Task',{collapsed:true});assert.match(html,/aria-expanded="false"/);assert.match(html,/id="teach-tablet-body" hidden/);assert.match(html,/harbor-walk-canvas-container/);
});
test('Backup validation rejects malformed path state while preserving older backups',()=>{
 const p=makeProfile(),save={version:1,profiles:[p],active:p.id};validateSave(save);ensureTeachPath(p);validateSave(save);
 p.teachPath.seen={3:'yes'};assert.throws(()=>validateSave(save),/Teach Path/);
});
