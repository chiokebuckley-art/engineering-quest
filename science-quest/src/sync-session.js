import {createSyncKey,preparePush,syncEndpoint,syncRequest} from './cloud-client.js';
/** Cloud credentials and pending uploads are separate from exported gameplay snapshots. */
export function createSyncSession(storage,fetcher=fetch){
 const name='science-quest.cloud-session.v1';let busy=false;
 const read=()=>{const raw=storage.getItem(name);return raw?JSON.parse(raw):null;};
 const write=s=>storage.setItem(name,JSON.stringify(s));
 const required=()=>{const s=read();if(!s)throw Error('Connect a sync service first.');return s;};
 async function exclusive(fn){if(busy)throw Error('A sync operation is already running.');busy=true;try{return await fn();}finally{busy=false;}}
 return {
 status(){const s=read();return s?{url:s.url,revision:s.revision,pending:!!s.pending,conflict:!!s.conflict,updatedAt:s.updatedAt}:null;},
 connect(url,key=createSyncKey()){if(busy)throw Error('Wait for sync to finish.');if(read())throw Error('Disconnect the existing service before changing its key.');if(!/^[a-f0-9]{64}$/.test(key))throw Error('Invalid private sync key.');write({version:1,url:syncEndpoint(url),key,revision:0,pending:null,conflict:null,recovery:[]});return key;},
 privateKey(){return required().key;},
 queue(snapshot,events){if(busy)throw Error('Wait for sync to finish.');const s=required();if(s.pending||s.conflict)throw Error('Finish or resolve the previous upload before queuing another.');s.pending=preparePush(snapshot,events,s.revision);write(s);return s.pending.operationId;},
 async upload(){return exclusive(async()=>{const s=required();if(s.conflict)throw Error('Resolve the saved conflict first.');if(!s.pending)return{idle:true};const result=await syncRequest({url:s.url,key:s.key,method:'PUT',body:s.pending},fetcher);if(result.conflict){s.conflict=result;write(s);return result;}if(!Number.isInteger(result.revision)||result.revision<s.revision)throw Error('Invalid server revision.');s.revision=result.revision;s.pending=null;s.updatedAt=Date.now();write(s);return result;});},
 async inspect(){return exclusive(async()=>{const s=required(),remote=await syncRequest({url:s.url,key:s.key},fetcher);if(!Number.isInteger(remote.revision)||remote.revision<0)throw Error('Invalid cloud response.');return remote;});},
 conflict(){return structuredClone(required().conflict);},
 resolveWithMerged(snapshot,events){if(busy)throw Error('Wait for sync to finish.');const s=required();if(!s.conflict||!Number.isInteger(s.conflict.revision))throw Error('No recoverable snapshot conflict.');s.recovery.push({at:Date.now(),local:s.pending,remote:s.conflict});s.revision=s.conflict.revision;s.conflict=null;s.pending=preparePush(snapshot,events,s.revision);write(s);},
 recovery(){return structuredClone(required().recovery);},
 disconnect(){if(busy)throw Error('Wait for sync to finish.');const s=read();if(s?.pending||s?.conflict)throw Error('Export and resolve pending cloud work before disconnecting.');storage.removeItem(name);},
 async deleteCloud(){return exclusive(async()=>{const s=required();if(s.pending||s.conflict)throw Error('Resolve pending cloud work first.');await syncRequest({url:s.url,key:s.key,method:'DELETE'},fetcher);storage.removeItem(name);});}
 };
}
