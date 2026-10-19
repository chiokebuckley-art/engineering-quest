// Explicit opt-in integration check; writes only synthetic QA data to the existing service.
import assert from 'node:assert/strict';
import {ElectricitySync,encodeProfile,RECOVERY_KEY} from '../sync.js';
import {newProfile} from '../engine.js';
function device(){const profiles=[newProfile('Electricity QA')],values=new Map();const cloud=new ElectricitySync({storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},getProfile:id=>profiles.find(p=>p.id===id),replaceProfile:(id,p)=>profiles.splice(profiles.findIndex(p=>p.id===id),1,{...p,id}),addProfile:p=>{profiles.push(p);return p.id;}});return {profiles,values,cloud};}
const a=device(),b=device(),id=a.profiles[0].id;
assert.equal(await a.cloud.create(id),true,a.cloud.info(id).status);
const code=a.cloud.info(id).link.code;
const other=await b.cloud.join(code);assert.ok(other,b.cloud.info('join').status);
a.profiles[0].notes['L01.01']='Synthetic QA note: a complete path is needed.';
assert.equal(await a.cloud.sync(id),true,a.cloud.info(id).status);
assert.equal(await b.cloud.sync(other),true,b.cloud.info(other).status);
assert.equal(b.profiles[1].notes['L01.01'],a.profiles[0].notes['L01.01']);
a.profiles[0].name='Electricity QA first client';b.profiles[1].name='Electricity QA second client';
assert.equal(await a.cloud.sync(id),true);
assert.equal(await b.cloud.sync(other),false);assert.equal(b.cloud.info(other).conflict,true);
assert.equal(await b.cloud.resolve(other,'remote'),true);assert.ok(b.values.get(RECOVERY_KEY));
assert.equal(encodeProfile(a.profiles[0]),encodeProfile(b.profiles[1]));
console.log('PASS: live create, second-client join, upload, download, conflict detection and recovery. No personal learner data used.');
