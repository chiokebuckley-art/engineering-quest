import {validateArcade,mergeArcade} from './arcade-model.js';
import {validateSave, newProfile} from '../engine.js';
export const LINK_KEY='small-common-word-academy.sync.v1';
export const SERVICE='https://wordraiders-sync.wordraiders.workers.dev';
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const normalizeCode=s=>s.toUpperCase().replace(/[\s-]/g,'');
export const validCode=s=>/^AC[A-HJ-NP-Z2-9]{10}$/.test(s);
export const formatCode=s=>s.match(/.{1,4}/g)?.join('-')||s;
export function newCode(){let code='AC';const bytes=new Uint8Array(32);while(code.length<12){crypto.getRandomValues(bytes);for(const b of bytes){if(b<256-256%ALPHABET.length)code+=ALPHABET[b%ALPHABET.length];if(code.length===12)break;}}return code;}
export function snapshot(p){
 const records=Object.fromEntries(Object.entries(p.records).filter(([id])=>id.startsWith('academy.')));
 return validatePayload({app:'small-common-word-academy',version:1,learner:{id:p.id,name:p.name,level:p.level},academy:p.academy||{version:1,completed:{},checkpoint:null},records,updatedAt:Number(p.academySyncUpdatedAt)||0});
}
export function validatePayload(x){
 if(!x||x.app!=='small-common-word-academy'||x.version!==1||!x.learner||!x.academy||!x.records||typeof x.records!=='object'||Array.isArray(x.records)||!Number.isFinite(x.updatedAt)||x.updatedAt<0||Object.keys(x.records).some(k=>!/^academy\.[a-zA-Z-]+$/.test(k)))throw Error('This code does not contain valid Academy progress.');
 const p={...newProfile(),...x.learner,academy:x.academy,records:x.records};
 validateSave({version:1,active:p.id,profiles:[p]});
 if(x.academy.arcade!==undefined)x.academy.arcade=validateArcade(x.academy.arcade);
 return JSON.parse(JSON.stringify({app:x.app,version:1,learner:{id:p.id,name:p.name,level:p.level},academy:x.academy,records:x.records,updatedAt:x.updatedAt}));
}
export function merge(a,b){
 a=validatePayload(a);b=validatePayload(b);
 if(a.learner.id!==b.learner.id)throw Error('These saves belong to different learners.');
 const phase={learn:0,guided:1,picture:2,meaning:3,done:4};
 const rank=x=>x.academy.checkpoint?x.academy.checkpoint.index*10+phase[x.academy.checkpoint.phase]:-1;
 const latest=a.updatedAt===b.updatedAt?(rank(a)>=rank(b)?a:b):(a.updatedAt>b.updatedAt?a:b);
 const out=structuredClone(latest);
 out.academy.completed={...a.academy.completed};
 if(a.academy.arcade||b.academy.arcade)out.academy.arcade=mergeArcade(a.academy.arcade,b.academy.arcade);
 for(const [id,at] of Object.entries(b.academy.completed))out.academy.completed[id]=Math.max(at,out.academy.completed[id]||0);
 // A scene completed on either device must never reopen as unfinished after a merge.
 if(out.academy.checkpoint&&out.academy.completed['a'+out.academy.checkpoint.index])out.academy.checkpoint=null;
 out.records={...a.records};
 for(const [id,r] of Object.entries(b.records)){const local=out.records[id];if(!local||r.last>local.last||(r.last===local.last&&r.attempts>local.attempts))out.records[id]=r;}
 return validatePayload(out);
}
export function applyPayload(save,payload){
 payload=validatePayload(payload);const result=structuredClone(save);
 let p=result.profiles.find(p=>p.id===payload.learner.id);const existing=!!p;
 if(!p){if(result.profiles.length>=30)throw Error('This device already has 30 learners. Make room in Manage profiles first.');p={...newProfile(payload.learner.name,payload.learner.level),id:payload.learner.id};result.profiles.push(p);}
 const before=Object.keys(p.academy?.completed||{}).length;
 const merged=existing?merge(snapshot(p),payload):payload;
 p.academy=merged.academy;p.academySyncUpdatedAt=merged.updatedAt;
 p.records={...p.records,...merged.records};
 p.xp+=10*(Object.keys(p.academy.completed).length-before);
 return validateSave(result);
}
export async function pack(payload){
 const raw=JSON.stringify(validatePayload(payload));
 if(typeof CompressionStream==='undefined')return raw;
 const bytes=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
 let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return 'gz1:'+btoa(s);
}
export async function unpack(data){
 if(typeof data!=='string'||data.length>410000)throw Error('Invalid sync response.');
 if(data.startsWith('gz1:')){
  if(typeof DecompressionStream==='undefined')throw Error('Update this browser to read synced progress.');
  const bytes=Uint8Array.from(atob(data.slice(4)),c=>c.charCodeAt(0));
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const chunks=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2000000){await reader.cancel();throw Error('Synced save is too large.');}chunks.push(value);}
  data=await new Blob(chunks).text();
 }
 return validatePayload(JSON.parse(data));
}
export async function request(code,{method='GET',payload,rev=0,fetchFn=fetch,url=SERVICE}={}){
 if(!validCode(code))throw Error('Enter the 12-character Academy code beginning with AC.');
 const init={method,cache:'no-store',signal:AbortSignal.timeout(15000)};
 if(payload){init.headers={'content-type':'text/plain'};init.body=JSON.stringify({data:await pack(payload),baseRev:rev,savedAt:Date.now()});if(init.body.length>400*1024)throw Error('This save is too large to sync. Export a backup from Manage profiles.');}
 const res=await fetchFn(url+'/v1/save/'+code,init);
 if(res.status===404&&method==='GET')return null;
 const body=await res.json();
 if(res.status===409&&body.conflict)return {conflict:true,rev:body.rev,payload:await unpack(body.data)};
 if(!res.ok)throw Error(body.error||`Sync server returned ${res.status}.`);
 if(!Number.isInteger(body.rev)||body.rev<1)throw Error('Invalid sync revision.');
 return {rev:body.rev,savedAt:body.savedAt,...(method==='GET'?{payload:await unpack(body.data)}:{})};
}
