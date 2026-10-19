import {validStore,uid} from './engine.js';

// Same service and optimistic revision protocol as Engineering Quest.
export const SYNC_URL='https://wordraiders-sync.wordraiders.workers.dev';
export const LINK_KEY='electricity.sync.v1';
export const RECOVERY_KEY='electricity.sync-recovery.v1';
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const normalizeCode=s=>String(s).toUpperCase().replace(/[\s-]/g,'');
export const validCode=s=>/^EL[A-HJ-NP-Z2-9]{10}$/.test(s);
export const formatCode=s=>s.match(/.{1,4}/g)?.join('-')||s;
export function newCode(){const b=crypto.getRandomValues(new Uint8Array(10));return 'EL'+Array.from(b,n=>ALPHABET[n%ALPHABET.length]).join('');}
export function encodeProfile(profile){return JSON.stringify({app:'electricity',version:1,profile:{...profile,id:'synced-profile'}});}
export function decodeProfile(raw){
 const x=JSON.parse(raw,(k,v)=>['__proto__','constructor','prototype'].includes(k)?undefined:v);
 if(x?.app!=='electricity'||x.version!==1||!validStore({version:1,active:x.profile?.id,profiles:[x.profile]}))throw Error('This is not a valid Electricity save.');
 return x.profile;
}
async function digest(raw){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');}
export async function pack(raw){
 if(typeof CompressionStream==='undefined')return raw;
 const data=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
 let binary='';for(let i=0;i<data.length;i+=8192)binary+=String.fromCharCode(...data.subarray(i,i+8192));return 'gz1:'+btoa(binary);
}
export async function unpack(data){
 if(typeof data!=='string'||data.length>400*1024)throw Error('Invalid sync response.');
 if(!data.startsWith('gz1:'))return data;
 if(typeof DecompressionStream==='undefined')throw Error('Update this browser to read compressed saves.');
 const bytes=Uint8Array.from(atob(data.slice(4)),c=>c.charCodeAt(0));
 const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
 const chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>10*1024*1024)throw Error('Synced save is too large.');chunks.push(value);}}finally{await reader.cancel();}
 return new Blob(chunks).text();
}
export class ElectricitySync {
 // Safari requires native fetch to be called with the Window receiver. Keep the
 // browser call inside a wrapper instead of invoking it as a ElectricitySync method.
 constructor({storage,getProfile,replaceProfile,addProfile,canApply=()=>true,fetchFn=(...args)=>globalThis.fetch(...args),onChange=()=>{}}){
  Object.assign(this,{storage,getProfile,replaceProfile,addProfile,canApply,fetchFn,onChange});this.busy=false;this.conflicts=new Map();this.status=new Map();this.links={};
  try{this.rawLinks=storage.getItem(LINK_KEY);const links=JSON.parse(this.rawLinks||'{}');for(const [id,l] of Object.entries(links)){if(/^[a-zA-Z0-9_-]{1,100}$/.test(id)&&validCode(l?.code)&&Number.isInteger(l.rev)&&l.rev>=0&&typeof l.hash==='string')this.links[id]=l;}}catch{this.disabled=true;}
 }
 info(id){return {link:this.links[id],status:this.status.get(id)||'',conflict:this.conflicts.has(id),busy:this.busy};}
 setStatus(id,message){this.status.set(id,message);this.onChange(id);}
 setLink(id,link){if(this.storage.getItem(LINK_KEY)!==this.rawLinks)throw Error('Sync changed in another tab. Reload this tab to continue.');const next={...this.links};if(link)next[id]=link;else delete next[id];const raw=JSON.stringify(next);this.storage.setItem(LINK_KEY,raw);this.rawLinks=raw;this.links=next;}
 async request(code,body){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const res=await this.fetchFn(`${SYNC_URL}/v1/save/${code}`,{method:body?'POST':'GET',cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal,...(body?{headers:{'Content-Type':'text/plain'},body:JSON.stringify(body)}:{})});
   if(res.status===404&&!body)return null;
   const x=await res.json();if(res.status===409&&body&&x?.conflict)return {conflict:true,...await this.readRemote(x)};
   if(!res.ok)throw Error(res.status===413?'This save is too large to sync. Export a backup.':`Sync unavailable (${res.status}). Your progress stays on this device.`);
   if(!Number.isInteger(x.rev)||x.rev<1)throw Error('Invalid server revision.');
   return body?{rev:x.rev,savedAt:x.savedAt}:this.readRemote(x);
  }catch(e){if(e.name==='AbortError')throw Error('Sync timed out. Your progress stays on this device.');throw e;}finally{clearTimeout(timeout);}
 }
 async readRemote(x){if(!Number.isInteger(x.rev)||x.rev<1)throw Error('Invalid server revision.');const profile=decodeProfile(await unpack(x.data));return {rev:x.rev,savedAt:x.savedAt,profile,raw:encodeProfile(profile)};}
 async run(id,action){
  if(this.busy)return false;
  if(this.disabled){this.setStatus(id,'Sync settings could not be read. Export a backup and reload.');return false;}
  this.busy=true;this.setStatus(id,'Syncing…');
  try{if(this.storage.getItem(LINK_KEY)!==this.rawLinks)throw Error('Sync changed in another tab. Reload this tab to continue.');return await action();}catch(e){this.setStatus(id,e.message||'Sync failed. Your local progress is safe.');return false;}finally{this.busy=false;this.onChange(id);}
 }
 async create(id){return this.run(id,async()=>{
  if(this.links[id])return false;
  const raw=encodeProfile(this.getProfile(id));decodeProfile(raw);const code=newCode();
  const result=await this.push(code,raw,0);if(result.conflict)throw Error('That code already exists. Try creating another.');
  this.setLink(id,{code,rev:result.rev,hash:await digest(raw),at:Date.now()});this.setStatus(id,'Synced. Use this code on your other device.');return true;
 });}
 async join(input){return this.run('join',async()=>{
  const code=normalizeCode(input);if(!validCode(code))throw Error('Enter the 12-character Electricity code beginning EL.');
  if(Object.values(this.links).some(l=>l.code===code))throw Error('This code is already connected on this device. Switch to that learner.');
  const remote=await this.request(code);if(!remote)throw Error('No save found. Check the code and sync the first device.');
  if(!this.canApply())throw Error('Finish your current activity before connecting.');
  const id=this.addProfile({...remote.profile,id:uid()});
  this.setLink(id,{code,rev:remote.rev,hash:await digest(remote.raw),at:Date.now()});this.setStatus(id,'Connected. Your other local profiles were kept.');return id;
 });}
 async push(code,raw,baseRev){const data=await pack(raw);const body={data,baseRev,savedAt:Date.now()};if(new TextEncoder().encode(JSON.stringify(body)).length>400*1024)throw Error('This save is too large to sync. Export a backup.');return this.request(code,body);}
 async sync(id){return this.run(id,async()=>{
  const link=this.links[id];if(!link)return false;
  if(this.conflicts.has(id)){this.setStatus(id,'Both devices changed. Choose a copy below.');return false;}
  const remote=await this.request(link.code);if(!remote)throw Error('Cloud save is missing. Disconnect and create a new code to upload this copy.');
  const raw=encodeProfile(this.getProfile(id)),hash=await digest(raw);
  if(remote.rev<link.rev)throw Error('Cloud revision moved backwards. Sync paused to protect your progress.');
  if(remote.rev!==link.rev){
   if(remote.raw===raw){this.setLink(id,{...link,rev:remote.rev,hash,at:Date.now()});this.setStatus(id,'Up to date.');return true;}
   if(hash!==link.hash){this.conflicts.set(id,remote);this.setStatus(id,'Both devices changed. Choose a copy below.');return false;}
   if(!this.canApply()){this.setStatus(id,'New progress is ready. Finish your activity, then sync.');return false;}
   // Recheck after awaits: never discard changes made while the request was running.
   if(encodeProfile(this.getProfile(id))!==raw){this.setStatus(id,'New local changes are waiting to sync.');return false;}
   this.backup(id);this.replaceProfile(id,remote.profile);this.setLink(id,{...link,rev:remote.rev,hash:await digest(remote.raw),at:Date.now()});this.setStatus(id,'Downloaded your latest progress.');return true;
  }
  if(hash===link.hash){this.setStatus(id,'Up to date.');return true;}
  const pushed=await this.push(link.code,raw,link.rev);
  if(pushed.conflict){this.conflicts.set(id,pushed);this.setStatus(id,'Both devices changed. Choose a copy below.');return false;}
  this.setLink(id,{...link,rev:pushed.rev,hash,at:Date.now()});this.setStatus(id,encodeProfile(this.getProfile(id))===raw?'Progress synced.':'Saved snapshot. New changes will sync next.');return true;
 });}
 backup(id,other){const profile=this.getProfile(id);this.storage.setItem(RECOVERY_KEY,JSON.stringify({version:1,active:profile.id,profiles:[profile,...(other?[{...other,id:uid(),name:other.name.slice(0,40)+' (cloud recovery)'}]:[])]}));}
 async resolve(id,choice){return this.run(id,async()=>{
  const remote=this.conflicts.get(id),link=this.links[id];if(!remote||!link)return false;
  if(!this.canApply())throw Error('Finish your current activity before choosing a copy.');
  this.backup(id,remote.profile);
  if(choice==='remote'){
   this.replaceProfile(id,remote.profile);this.setLink(id,{...link,rev:remote.rev,hash:await digest(remote.raw),at:Date.now()});
  }else if(choice==='local'){
   const raw=encodeProfile(this.getProfile(id)),result=await this.push(link.code,raw,remote.rev);
   if(result.conflict){this.conflicts.set(id,result);throw Error('The other device changed again. Review the choices and retry.');}
   this.setLink(id,{...link,rev:result.rev,hash:await digest(raw),at:Date.now()});
  }else throw Error('Choose one of the two copies.');
  this.conflicts.delete(id);this.setStatus(id,'Choice saved. Recovery backup is available below.');return true;
 });}
 disconnect(id){if(this.busy)throw Error('Wait for syncing to finish.');if(this.storage.getItem(LINK_KEY)!==this.rawLinks)throw Error('Sync changed in another tab. Reload first.');this.setLink(id,null);this.conflicts.delete(id);this.setStatus(id,'Disconnected on this device. Local progress is kept.');}
}

