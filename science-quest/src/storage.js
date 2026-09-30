/** Atomic snapshots and evidence. The fallback uses one envelope, never two partial writes. */
const KEY='science-quest.v1';
let db,queue=Promise.resolve(),observed=null,conflicted=false;
const unsavedEvents=new Map();let knownEvents=new Map(),fallbackObserved=null;
const fingerprint=value=>JSON.stringify(value??null);
function conflictError(){const error=Error('Another tab changed this device’s save. Export this tab’s backup, then reload and import it to preserve both versions.');error.code='SAVE_CONFLICT';return error;}
async function readIndexed(){
 const tx=db.transaction(['snapshots','events']),done=transactionDone(tx),store=tx.objectStore('snapshots');
 try{const [snapshot,revision=0,events]=await Promise.all([requestResult(store.get('current')),requestResult(store.get('revision')),requestResult(tx.objectStore('events').getAll())]);await done;if(!Number.isSafeInteger(revision)||revision<0)throw Error('Invalid save revision');return{snapshot,revision,events};}catch(error){await done.catch(()=>{});throw error;}
}
function observe(current){observed={revision:current.revision,snapshot:fingerprint(current.snapshot)};knownEvents=new Map(current.events.map(e=>[e.id,e]));}
function remember(events){for(const e of events)knownEvents.set(e.id,e);}

async function guardedWrite(mutate,replacement,stores=['snapshots','events']){
 if(conflicted)throw conflictError();
 const tx=db.transaction(stores,'readwrite'),done=transactionDone(tx);
 try{
  const snapshots=tx.objectStore('snapshots');
  const [current,revision=0]=await Promise.all([requestResult(snapshots.get('current')),requestResult(snapshots.get('revision'))]);
  if(!observed||observed.revision!==revision||observed.snapshot!==fingerprint(current)){conflicted=true;throw conflictError();}
  if(!Number.isSafeInteger(revision)||revision>=Number.MAX_SAFE_INTEGER)throw Error('Invalid save revision');
  mutate(tx);snapshots.put(revision+1,'revision');await done;
  observed={revision:revision+1,snapshot:fingerprint(replacement===undefined?current:replacement)};
 }catch(error){try{tx.abort();}catch{}await done.catch(()=>{});throw error;}
}

const enqueue=operation=>{const task=queue.catch(()=>{}).then(operation);queue=task;return task;};
function requestResult(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
function transactionDone(tx){return new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Save transaction aborted'));});}
function fallbackEnvelope(){
  const raw=localStorage.getItem(KEY);if(!raw)return{storageFormat:1,snapshot:null,events:[]};
  const value=JSON.parse(raw);
  if(value?.storageFormat===1){if(!Array.isArray(value.events)||!value.snapshot)throw Error('The save envelope is incomplete.');return value;}
  // Version 1.0 used a separate event key. Read it before atomically migrating on the next write.
  return{storageFormat:1,snapshot:value,events:JSON.parse(localStorage.getItem(KEY+'.events')||'[]')};
}
const fallbackToken=()=>JSON.stringify([localStorage.getItem(KEY),localStorage.getItem(KEY+'.events')]);
function observeFallback(){fallbackObserved=fallbackToken();try{knownEvents=new Map(fallbackEnvelope().events.map(e=>[e.id,e]));}catch{}}
async function guardedFallback(mutate){
 const write=()=>{if(conflicted||fallbackObserved!==fallbackToken()){conflicted=true;throw conflictError();}const result=mutate();observeFallback();return result;};
 const locks=globalThis.navigator?.locks;
 // The callback is synchronous; modern tabs additionally serialize it with a Web Lock.
 return locks?.request?locks.request('science-quest.local-save.v1',{mode:'exclusive'},write):write();
}
export async function openStore(){
  try{
    if(db)db.close();db=null;
    db=await new Promise((resolve,reject)=>{const r=indexedDB.open('science-quest',2);
      r.onupgradeneeded=()=>{for(const store of ['snapshots','recoveries'])if(!r.result.objectStoreNames.contains(store))r.result.createObjectStore(store);if(!r.result.objectStoreNames.contains('events'))r.result.createObjectStore('events',{keyPath:'id'});};
      r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};r.onerror=()=>reject(r.error);r.onblocked=()=>{const error=Error('Another tab is holding an older save connection. Close it and reload.');error.code='SAVE_BLOCKED';reject(error);};
    });const current=await readIndexed();observe(current);conflicted=false;return 'IndexedDB';
  }catch(error){if(db||error.code==='SAVE_BLOCKED')throw error;conflicted=false;observeFallback();return 'localStorage';}
}
export async function loadSave(){
  await queue.catch(()=>{});
  if(db){const current=await readIndexed();if(!conflicted)observe(current);if(current.snapshot)return current.snapshot;}
  if(!conflicted)observeFallback();return fallbackEnvelope().snapshot;
}
export function persist(state,event){
  const copy=structuredClone(state),evt=event?{id:crypto.randomUUID(),at:Date.now(),contentVersion:1,modelVersion:1,...structuredClone(event)}:null;
  return enqueue(async()=>{
    if(db){await guardedWrite(tx=>{tx.objectStore('snapshots').put(copy,'current');if(evt)tx.objectStore('events').add(evt);},copy);if(evt)remember([evt]);}
    else await guardedFallback(()=>{const old=fallbackEnvelope();localStorage.setItem(KEY,JSON.stringify({storageFormat:1,snapshot:copy,events:evt?[...old.events,evt]:old.events}));});
  }).then(()=>{if(evt)unsavedEvents.delete(evt.id);},error=>{if(evt)unsavedEvents.set(evt.id,evt);throw error;});
}
export async function getEvents(){await queue.catch(()=>{});if(!db)return fallbackEnvelope().events;return requestResult(db.transaction('events').objectStore('events').getAll());}
export async function getBackupEvents(){await queue.catch(()=>{});const saved=[...knownEvents.values()],map=new Map(saved.map(e=>[e.id,e]));for(const [id,event]of unsavedEvents)map.set(id,event);return [...map.values()];}
function validateEvents(events){if(!Array.isArray(events)||events.some(e=>!e||typeof e.id!=='string'||typeof e.profile!=='string'))throw Error('Invalid evidence events');}
export function importEvents(events=[]){
  validateEvents(events);const incoming=structuredClone(events);
  return enqueue(async()=>{if(db){await guardedWrite(tx=>{for(const e of incoming)tx.objectStore('events').put(e);});remember(incoming);}
    else await guardedFallback(()=>{const old=fallbackEnvelope(),map=new Map(old.events.map(e=>[e.id,e]));incoming.forEach(e=>map.set(e.id,e));localStorage.setItem(KEY,JSON.stringify({...old,events:[...map.values()]}));});});
}
export function replaceSaveWithEvents(state,events=[],removedProfile=null){
  if(removedProfile!==null&&(typeof removedProfile!=='string'||!removedProfile||state.profiles?.some(p=>p.id===removedProfile)||events.some(e=>e.profile===removedProfile)))throw Error('Invalid profile removal');
  validateEvents(events);const snapshot=structuredClone(state),incoming=structuredClone(events);
  return enqueue(async()=>{if(db){await guardedWrite(tx=>{tx.objectStore('snapshots').put(snapshot,'current');for(const e of incoming)tx.objectStore('events').put(e);if(removedProfile){const request=tx.objectStore('events').openCursor();request.onsuccess=()=>{const c=request.result;if(c){if(c.value.profile===removedProfile)c.delete();c.continue();}};}},snapshot);if(removedProfile)for(const [key,e]of knownEvents)if(e.profile===removedProfile)knownEvents.delete(key);remember(incoming);}
    else await guardedFallback(()=>{const old=fallbackEnvelope(),map=new Map(old.events.filter(e=>e.profile!==removedProfile).map(e=>[e.id,e]));incoming.forEach(e=>map.set(e.id,e));localStorage.setItem(KEY,JSON.stringify({storageFormat:1,snapshot,events:[...map.values()]}));});});
}
export function deleteProfileEvents(id){return enqueue(async()=>{
  if(db){await guardedWrite(tx=>{const r=tx.objectStore('events').openCursor();r.onsuccess=()=>{const c=r.result;if(c){if(c.value.profile===id)c.delete();c.continue();}};});for(const [key,e]of knownEvents)if(e.profile===id)knownEvents.delete(key);}
  else await guardedFallback(()=>{const old=fallbackEnvelope();localStorage.setItem(KEY,JSON.stringify({...old,events:old.events.filter(e=>e.profile!==id)}));});
});}
export async function recoveryExport(includeArchives=true){
  await queue.catch(()=>{});
  const raw={kind:'science-quest-recovery',at:Date.now(),unsavedEvents:[...unsavedEvents.values()],localSnapshot:localStorage.getItem(KEY),localEvents:localStorage.getItem(KEY+'.events')};
  if(db){raw.indexedSnapshot=await requestResult(db.transaction('snapshots').objectStore('snapshots').get('current'));raw.indexedEvents=await requestResult(db.transaction('events').objectStore('events').getAll());if(includeArchives)raw.archives=await requestResult(db.transaction('recoveries').objectStore('recoveries').getAll());}
  if(includeArchives){raw.localArchives=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(KEY+'.recovery-'))raw.localArchives.push({key,raw:localStorage.getItem(key)});}}
  return raw;
}
export async function archiveUnreadableSave(){
  const archive=await recoveryExport(false),id='recovery-'+Date.now();
  if(db)await enqueue(()=>guardedWrite(tx=>{tx.objectStore('recoveries').put(archive,id);tx.objectStore('snapshots').delete('current');},null,['recoveries','snapshots']));
  // Preserve the original bytes before a fresh envelope can be written.
  if(!db)await enqueue(()=>guardedFallback(()=>{localStorage.setItem(KEY+'.'+id,JSON.stringify(archive));localStorage.removeItem(KEY);localStorage.removeItem(KEY+'.events');}));
  else{localStorage.removeItem(KEY);localStorage.removeItem(KEY+'.events');}return id;
}
