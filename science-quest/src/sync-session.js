import {createSyncKey,preparePush,syncEndpoint,syncRequest} from './cloud-client.js';
/** Cloud credentials and pending uploads are separate from exported gameplay snapshots.
 * Every mutation uses the same origin-wide Web Lock, including whole UI transactions.
 * Unsupported environments fail closed rather than pretending a localStorage lease is atomic.
 */
export const SYNC_LOCK='science-quest.cloud-session.v1';
export function createSyncSession(storage,fetcher=fetch,locks=globalThis.navigator?.locks){
 const name=SYNC_LOCK;let busy=false;
 const read=()=>{const raw=storage.getItem(name);return raw?JSON.parse(raw):null;};
 const write=s=>storage.setItem(name,JSON.stringify(s));
 const current=()=>{const raw=storage.getItem(name);if(!raw)throw Error('Connect a sync service first.');return{raw,s:JSON.parse(raw)};};
 const required=()=>current().s;
 async function exclusive(fn){
  if(busy)throw Error('A sync operation is already running.');
  if(typeof locks?.request!=='function')throw Error('Safe device sync is unavailable in this browser. Use a browser with Web Locks support. Your local game and backups remain available.');
  busy=true;
  try{return await locks.request(SYNC_LOCK,{mode:'exclusive',ifAvailable:true},async lock=>{
   if(!lock)throw Error('Another Science Quest sync tab is busy. Wait for it to finish, then try again.');
   return await fn();
  });}finally{busy=false;}
 }
 // Network responses must not overwrite a record changed by an older, uncoordinated tab.
 const unchanged=raw=>{if(storage.getItem(name)!==raw)throw Error('The sync connection changed in another tab. No local sync record was overwritten. Reload and check pending work.');};
 const api={
 status(){const s=read();return s?{url:s.url,revision:s.revision,pending:!!s.pending,conflict:!!s.conflict,updatedAt:s.updatedAt}:null;},
 connect(url,key=createSyncKey()){if(read())throw Error('Disconnect the existing service before changing its key.');if(!/^[a-f0-9]{64}$/.test(key))throw Error('Invalid private sync key.');write({version:1,url:syncEndpoint(url),key,revision:0,pending:null,conflict:null,recovery:[]});return key;},
 privateKey(){return required().key;},
 queue(snapshot,events){const s=required();if(s.pending||s.conflict)throw Error('Finish or resolve the previous upload before queuing another.');s.pending=preparePush(snapshot,events,s.revision);write(s);return s.pending.operationId;},
 async upload(){const {s,raw}=current();if(s.conflict)throw Error('Resolve the saved conflict first.');if(!s.pending)return{idle:true};const result=await syncRequest({url:s.url,key:s.key,method:'PUT',body:s.pending},fetcher);unchanged(raw);if(result.conflict){s.conflict=result;write(s);return result;}if(!Number.isInteger(result.revision)||result.revision<s.revision)throw Error('Invalid server revision.');s.revision=result.revision;s.pending=null;s.updatedAt=Date.now();write(s);return result;},
 async inspect(){const {s,raw}=current(),remote=await syncRequest({url:s.url,key:s.key},fetcher);unchanged(raw);if(!Number.isInteger(remote.revision)||remote.revision<0)throw Error('Invalid cloud response.');return remote;},
 conflict(){return structuredClone(required().conflict);},
 resolveWithMerged(snapshot,events){const s=required();if(!s.conflict||!Number.isInteger(s.conflict.revision))throw Error('No recoverable snapshot conflict.');s.recovery.push({at:Date.now(),local:s.pending,remote:s.conflict});s.revision=s.conflict.revision;s.conflict=null;s.pending=preparePush(snapshot,events,s.revision);write(s);},
 recovery(){return structuredClone(required().recovery);},
 disconnect(){const s=read();if(s?.pending||s?.conflict)throw Error('Export and resolve pending cloud work before disconnecting.');storage.removeItem(name);},
 async deleteCloud(){const {s,raw}=current();if(s.pending||s.conflict)throw Error('Resolve pending cloud work first.');await syncRequest({url:s.url,key:s.key,method:'DELETE'},fetcher);unchanged(raw);storage.removeItem(name);}
 };
 const readers=['status','privateKey','conflict','recovery'];
 return {...Object.fromEntries(Object.entries(api).map(([key,fn])=>[key,readers.includes(key)?fn:(...args)=>exclusive(()=>fn(...args))])),
  transaction:fn=>exclusive(async()=>{
   // A scoped facade cannot be retained and used to mutate outside the lock.
   let active=true,inFlight=null;const tasks=[];
   const scoped=Object.fromEntries(Object.entries(api).map(([key,fn])=>[key,(...args)=>{
    if(!active)throw Error('The sync transaction has ended.');
    if(inFlight&&!readers.includes(key))throw Error('Wait for the current sync request to finish.');
    const value=fn(...args);
    if(value&&typeof value.then==='function'){inFlight=value;tasks.push(value);const release=()=>{if(inFlight===value)inFlight=null;};value.then(release,release);}
    return value;
   }]));
   try{return await fn(scoped);}finally{active=false;await Promise.allSettled(tasks);}
  })};
}
