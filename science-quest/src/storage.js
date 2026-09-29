/** Atomic snapshots and evidence. The fallback uses one envelope, never two partial writes. */
const KEY='science-quest.v1';
let db,queue=Promise.resolve();
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
export async function openStore(){
  try{
    if(db)db.close();db=null;
    db=await new Promise((resolve,reject)=>{const r=indexedDB.open('science-quest',2);
      r.onupgradeneeded=()=>{for(const store of ['snapshots','recoveries'])if(!r.result.objectStoreNames.contains(store))r.result.createObjectStore(store);if(!r.result.objectStoreNames.contains('events'))r.result.createObjectStore('events',{keyPath:'id'});};
      r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};r.onerror=()=>reject(r.error);r.onblocked=()=>{const error=Error('Another tab is holding an older save connection. Close it and reload.');error.code='SAVE_BLOCKED';reject(error);};
    });return 'IndexedDB';
  }catch(error){db=null;if(error.code==='SAVE_BLOCKED')throw error;return 'localStorage';}
}
export async function loadSave(){
  await queue;
  if(db){const v=await requestResult(db.transaction('snapshots').objectStore('snapshots').get('current'));if(v)return v;}
  return fallbackEnvelope().snapshot;
}
export function persist(state,event){
  const copy=structuredClone(state),evt=event?{id:crypto.randomUUID(),at:Date.now(),contentVersion:1,modelVersion:1,...structuredClone(event)}:null;
  return enqueue(async()=>{
    if(db){const tx=db.transaction(['snapshots','events'],'readwrite'),done=transactionDone(tx);tx.objectStore('snapshots').put(copy,'current');if(evt)tx.objectStore('events').add(evt);await done;}
    else{const old=fallbackEnvelope();localStorage.setItem(KEY,JSON.stringify({storageFormat:1,snapshot:copy,events:evt?[...old.events,evt]:old.events}));}
  });
}
export async function getEvents(){await queue;if(!db)return fallbackEnvelope().events;return requestResult(db.transaction('events').objectStore('events').getAll());}
function validateEvents(events){if(!Array.isArray(events)||events.some(e=>!e||typeof e.id!=='string'||typeof e.profile!=='string'))throw Error('Invalid evidence events');}
export function importEvents(events=[]){
  validateEvents(events);const incoming=structuredClone(events);
  return enqueue(async()=>{if(db){const tx=db.transaction('events','readwrite'),done=transactionDone(tx);for(const e of incoming)tx.objectStore('events').put(e);await done;}
    else{const old=fallbackEnvelope(),map=new Map(old.events.map(e=>[e.id,e]));incoming.forEach(e=>map.set(e.id,e));localStorage.setItem(KEY,JSON.stringify({...old,events:[...map.values()]}));}});
}
export function replaceSaveWithEvents(state,events=[]){
  validateEvents(events);const snapshot=structuredClone(state),incoming=structuredClone(events);
  return enqueue(async()=>{if(db){const tx=db.transaction(['snapshots','events'],'readwrite'),done=transactionDone(tx);tx.objectStore('snapshots').put(snapshot,'current');for(const e of incoming)tx.objectStore('events').put(e);await done;}
    else{const old=fallbackEnvelope(),map=new Map(old.events.map(e=>[e.id,e]));incoming.forEach(e=>map.set(e.id,e));localStorage.setItem(KEY,JSON.stringify({storageFormat:1,snapshot,events:[...map.values()]}));}});
}
export function deleteProfileEvents(id){return enqueue(async()=>{
  if(db){const tx=db.transaction('events','readwrite'),done=transactionDone(tx),r=tx.objectStore('events').openCursor();r.onsuccess=()=>{const c=r.result;if(c){if(c.value.profile===id)c.delete();c.continue();}};await done;}
  else{const old=fallbackEnvelope();localStorage.setItem(KEY,JSON.stringify({...old,events:old.events.filter(e=>e.profile!==id)}));}
});}
export async function recoveryExport(includeArchives=true){
  await queue.catch(()=>{});
  const raw={kind:'science-quest-recovery',at:Date.now(),localSnapshot:localStorage.getItem(KEY),localEvents:localStorage.getItem(KEY+'.events')};
  if(db){raw.indexedSnapshot=await requestResult(db.transaction('snapshots').objectStore('snapshots').get('current'));raw.indexedEvents=await requestResult(db.transaction('events').objectStore('events').getAll());if(includeArchives)raw.archives=await requestResult(db.transaction('recoveries').objectStore('recoveries').getAll());}
  if(includeArchives){raw.localArchives=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(KEY+'.recovery-'))raw.localArchives.push({key,raw:localStorage.getItem(key)});}}
  return raw;
}
export async function archiveUnreadableSave(){
  const archive=await recoveryExport(false),id='recovery-'+Date.now();
  if(db){const tx=db.transaction(['recoveries','snapshots'],'readwrite'),done=transactionDone(tx);tx.objectStore('recoveries').put(archive,id);tx.objectStore('snapshots').delete('current');await done;}
  // Preserve the original bytes before a fresh envelope can be written.
  if(!db)localStorage.setItem(KEY+'.'+id,JSON.stringify(archive));
  localStorage.removeItem(KEY);localStorage.removeItem(KEY+'.events');return id;
}
