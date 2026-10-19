import test from 'node:test';
import assert from 'node:assert/strict';
import {ElectricitySync,newCode,validCode,normalizeCode,formatCode,pack,unpack,encodeProfile,decodeProfile,LINK_KEY,RECOVERY_KEY} from '../sync.js';
import {newProfile,validStore} from '../engine.js';

function service(){
 const saves=new Map();let offline=false,hook=null;const calls=[];
 return {saves,calls,set offline(x){offline=x;},set hook(x){hook=x;},fetch:async(url,options={})=>{
  if(offline)throw Error('Offline');if(hook)await hook(url,options);
  const code=url.split('/').at(-1),old=saves.get(code);calls.push({code,method:options.method});
  if(options.method!=='POST')return Response.json(old||{error:'Missing'},{status:old?200:404});
  const body=JSON.parse(options.body);
  if(body.baseRev!==(old?.rev||0))return Response.json({conflict:true,...old},{status:409});
  const next={rev:(old?.rev||0)+1,savedAt:body.savedAt,data:body.data};saves.set(code,next);return Response.json({rev:next.rev,savedAt:next.savedAt});
 }};
}
function device(server,name='Learner'){
 const values=new Map(),profiles=[newProfile(name)];let allow=true;
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const options={storage,fetchFn:server.fetch,getProfile:id=>profiles.find(p=>p.id===id),replaceProfile:(id,p)=>profiles.splice(profiles.findIndex(p=>p.id===id),1,{...p,id}),addProfile:p=>{profiles.push(p);return p.id;},canApply:()=>allow};
 const sync=new ElectricitySync(options);
 return {sync,profiles,values,options,set allow(x){allow=x;},get p(){return profiles[0];}};
}
test('Native browser fetch keeps the Window receiver for create, pull and push',async()=>{
 const original=globalThis.fetch,s=service(),a=device(s),b=device(s);let requests=0;
 globalThis.fetch=function(...args){assert.equal(this,globalThis,'Safari requires the Window receiver');requests++;return s.fetch(...args);};
 try{
  const first=new ElectricitySync({...a.options,fetchFn:undefined}),second=new ElectricitySync({...b.options,fetchFn:undefined});
  assert.equal(await first.create(a.p.id),true);
  const code=first.info(a.p.id).link.code,id=await second.join(code);assert.ok(id);
  b.profiles.at(-1).name='Phone learner';assert.equal(await second.sync(id),true);
  assert.equal(await first.sync(a.p.id),true);assert.equal(a.p.name,'Phone learner');assert.ok(requests>=5);
 }finally{globalThis.fetch=original;}
});
test('Private EL codes, typed envelopes and compressed saves round trip',async()=>{
 const code=newCode();assert.ok(validCode(code));assert.equal(normalizeCode(formatCode(code).toLowerCase()),code);assert.equal(validCode('EQABCDEFGHJK'),false);assert.equal(validCode(normalizeCode(code+'extra')),false);
 const raw=encodeProfile(newProfile());assert.equal(await unpack(await pack(raw)),raw);assert.ok(decodeProfile(raw));assert.throws(()=>decodeProfile(JSON.stringify({app:'engineering-quest',profile:newProfile()})));
});
test('Two devices share one learner without replacing other local learners',async()=>{
 const s=service(),a=device(s,'Chioke'),b=device(s,'Local learner');await a.sync.create(a.p.id);const code=a.sync.info(a.p.id).link.code;
 a.p.lessons.push('L01.01');await a.sync.sync(a.p.id);
 const id=await b.sync.join(formatCode(code));assert.ok(id);assert.equal(b.profiles.length,2);assert.equal(b.p.name,'Local learner');assert.deepEqual(b.profiles[1].lessons,['L01.01']);
 b.profiles[1].name='Renamed learner';await b.sync.sync(id);await a.sync.sync(a.p.id);assert.equal(a.p.name,'Renamed learner');
 assert.equal(await b.sync.join(code),false);assert.equal(b.profiles.length,2);
 const reloaded=new ElectricitySync(b.options);assert.equal(reloaded.info(id).link.code,code);
});
test('Offline changes survive and upload on retry; unlink retains all local work',async()=>{
 const s=service(),a=device(s);await a.sync.create(a.p.id);const before=a.sync.info(a.p.id).link.rev;s.offline=true;a.p.lessons.push('L01.01');assert.equal(await a.sync.sync(a.p.id),false);assert.equal(a.sync.info(a.p.id).link.rev,before);s.offline=false;await a.sync.sync(a.p.id);assert.equal(a.sync.info(a.p.id).link.rev,before+1);a.sync.disconnect(a.p.id);assert.deepEqual(a.p.lessons,['L01.01']);assert.equal(a.sync.info(a.p.id).link,undefined);
});
test('Concurrent offline edits pause and preserve both copies before explicit resolution',async()=>{
 const s=service(),a=device(s),b=device(s);await a.sync.create(a.p.id);const code=a.sync.info(a.p.id).link.code,id=await b.sync.join(code);a.p.lessons.push('L01.01');b.profiles[1].lessons.push('L01.02');await a.sync.sync(a.p.id);const rev=s.saves.get(code).rev;
 assert.equal(await b.sync.sync(id),false);assert.equal(b.sync.info(id).conflict,true);assert.equal(s.saves.get(code).rev,rev);assert.deepEqual(b.profiles[1].lessons,['L01.02']);
 await b.sync.resolve(id,'remote');assert.deepEqual(b.profiles[1].lessons,['L01.01']);const backup=JSON.parse(b.values.get(RECOVERY_KEY));assert.ok(validStore(backup));assert.deepEqual(backup.profiles[0].lessons,['L01.02']);assert.deepEqual(backup.profiles[1].lessons,['L01.01']);
 b.profiles[1].name='B';a.p.name='A';await a.sync.sync(a.p.id);await b.sync.sync(id);await b.sync.resolve(id,'local');await a.sync.sync(a.p.id);assert.equal(a.p.name,'B');
});
test('An update racing a POST is rejected by revision, never silently overwritten',async()=>{
 const s=service(),a=device(s);await a.sync.create(a.p.id);const code=a.sync.info(a.p.id).link.code;a.p.name='Local';let once=true;
 s.hook=async(url,o)=>{if(o.method==='POST'&&once){once=false;const remote=newProfile('Other');s.saves.set(code,{rev:2,savedAt:Date.now(),data:encodeProfile(remote)});}};
 assert.equal(await a.sync.sync(a.p.id),false);assert.ok(a.sync.info(a.p.id).conflict);assert.equal(a.p.name,'Local');assert.equal(s.saves.get(code).rev,2);
});
test('Edits made during upload are detected and sent by the next sync',async()=>{
 const s=service(),a=device(s);await a.sync.create(a.p.id);a.p.name='First edit';let once=true;s.hook=async(url,o)=>{if(o.method==='POST'&&once){once=false;a.p.name='Second edit';}};await a.sync.sync(a.p.id);assert.match(a.sync.info(a.p.id).status,/New changes/);await a.sync.sync(a.p.id);const code=a.sync.info(a.p.id).link.code;assert.equal(decodeProfile(await unpack(s.saves.get(code).data)).name,'Second edit');
});
test('A remote pull defers during an activity and cannot erase local edits',async()=>{
 const s=service(),a=device(s),b=device(s);await a.sync.create(a.p.id);const code=a.sync.info(a.p.id).link.code,id=await b.sync.join(code);a.p.name='Other device';await a.sync.sync(a.p.id);b.allow=false;await b.sync.sync(id);assert.notEqual(b.profiles[1].name,'Other device');b.allow=true;await b.sync.sync(id);assert.equal(b.profiles[1].name,'Other device');
});
test('Invalid, missing and other-game cloud saves never create or replace profiles',async()=>{
 const s=service(),a=device(s);assert.equal(await a.sync.join(newCode()),false);const code=newCode();s.saves.set(code,{rev:1,data:'{"app":"engineering-quest"}'});assert.equal(await a.sync.join(code),false);assert.equal(a.profiles.length,1);
});
test('Storage failure blocks replacement and a second tab cannot reuse a disconnected link',async()=>{
 const s=service(),a=device(s),b=device(s);await a.sync.create(a.p.id);const code=a.sync.info(a.p.id).link.code,id=await b.sync.join(code);a.p.name='New cloud name';await a.sync.sync(a.p.id);
 b.options.storage.setItem=()=>{throw Error('Storage full');};assert.equal(await b.sync.sync(id),false);assert.notEqual(b.profiles[1].name,'New cloud name');
 const stale=new ElectricitySync(a.options);a.sync.disconnect(a.p.id);assert.equal(await stale.sync(a.p.id),false);assert.match(stale.info(a.p.id).status,/another tab/);assert.equal(a.values.get(LINK_KEY),'{}');
});
