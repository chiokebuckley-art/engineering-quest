/** Pure optimistic-concurrency protocol. No last-writer-wins data loss. */
import {validateSave} from '../src/learning.js';
export function validatePush(body){if(!body||!Number.isInteger(body.baseRevision)||body.baseRevision<0||typeof body.operationId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(body.operationId)||!Array.isArray(body.events)||body.events.length>10000)throw Error('Invalid sync request.');validateSave(body.snapshot);const profiles=new Set(body.snapshot.profiles.map(p=>p.id)),ids=new Set();for(const e of body.events){if(!e||typeof e.id!=='string'||!e.id||ids.has(e.id)||!profiles.has(e.profile))throw Error('Invalid evidence event.');ids.add(e.id);}return body;}
const fingerprint=async text=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join('');
export async function applyPush(current,body,now=Date.now()){
 validatePush(body);const state=current||{revision:0,snapshot:null,events:[],operations:[],history:[]};const previous=state.operations.find(o=>o.id===body.operationId),payload=JSON.stringify({snapshot:body.snapshot,events:body.events,baseRevision:body.baseRevision});
 if(previous){if((previous.digest||await fingerprint(previous.payload))!==await fingerprint(payload))return {status:409,body:{error:'Operation ID reused with different data.'},state};return {status:200,body:{revision:previous.revision,replayed:true},state};}
 if(body.baseRevision!==state.revision)return {status:409,body:{conflict:true,revision:state.revision,snapshot:state.snapshot,events:state.events},state};
 const events=new Map(state.events.map(e=>[e.id,e]));for(const e of body.events){if(events.has(e.id)&&JSON.stringify(events.get(e.id))!==JSON.stringify(e))return{status:409,body:{error:'Evidence ID reused with different data.'},state};events.set(e.id,structuredClone(e));}
 if(events.size>20000)throw Error('Cloud event limit reached; export an archive.');
 const compactOperations=await Promise.all(state.operations.slice(-99).map(async o=>({id:o.id,revision:o.revision,digest:o.digest||await fingerprint(o.payload)})));
 const revision=state.revision+1,next={revision,snapshot:structuredClone(body.snapshot),events:[...events.values()],updatedAt:now,operations:[...compactOperations,{id:body.operationId,digest:await fingerprint(payload),revision}],history:[...state.history,...(state.snapshot?[{revision:state.revision,snapshot:state.snapshot,updatedAt:state.updatedAt}]:[])].slice(-10)};
 return {status:200,body:{revision,replayed:false},state:next};
}
