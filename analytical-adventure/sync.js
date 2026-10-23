// Engineering Quest / WordRaiders wire protocol. AA codes isolate this game's saves.
import {validateLab} from './lab-engine.js';
export const SERVICE='https://wordraiders-sync.wordraiders.workers.dev';
export const LINK_KEY='analytical-adventure.sync.v1';
export const RECOVERY_KEY='analytical-adventure.sync-recovery.v1';
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const normalizeCode=value=>value.trim().toUpperCase().replace(/[\s-]/g,'');
export const validCode=value=>/^AA[A-HJ-NP-Z2-9]{10}$/.test(value);
export const formatCode=value=>value.match(/.{1,4}/g)?.join('-')||'';
export function newCode(){const bytes=crypto.getRandomValues(new Uint8Array(10));return 'AA'+[...bytes].map(b=>ALPHABET[b%ALPHABET.length]).join('');}
export function snapshot(db,settings){return {app:'analytical-adventure',version:1,db,settings};}
export function validate(value){
 if(value?.app!=='analytical-adventure'||value.version!==1||!value.db?.sessions||!value.db?.seen||!value.settings)throw Error('This is not a compatible Analytical Adventure save.');
 if(value.db.relationshipLab)validateLab(value.db.relationshipLab);
 if(!['normal','large','larger'].includes(value.settings.size)||(value.settings.variant!==undefined&&!['starter','investigator'].includes(value.settings.variant)))throw Error('Unsupported display settings.');
 for(const [key,s] of Object.entries(value.db.sessions)){
  if(!/^(lighthouse|greenhouse):(starter|investigator)$/.test(key)||s.schema!=='1.0.0'||key!==`${s.id}:${s.variant}`||typeof s.session!=='string')throw Error('Unsupported investigation save.');
  for(const field of ['events','evidence','predictions','reviews','scores','help','components','partners'])if(!Array.isArray(s[field]))throw Error('Incomplete investigation save.');
  if(s.scores.length!==6||s.help.length!==6||!s.links||!s.classifications||!s.interpretations||!s.attempted)throw Error('Incomplete reasoning record.');
  if(s.scores.some(x=>![0,1,2].includes(x))||s.help.some(x=>typeof x!=='boolean')||s.evidence.some(id=>!/^E0[1-7]$/.test(id))||![0,1,2].includes(s.role)||typeof s.notes!=='string')throw Error('Invalid reasoning record.');
  if(s.hypothesis!==null&&![0,1,2].includes(s.hypothesis))throw Error('Invalid explanation.');
  if(s.predictions.some(p=>!['source','output','connection'].includes(p.testId)||![0,1,2].includes(p.hypothesis)||![0,1].includes(p.choice)||![null,0,1].includes(p.observation)))throw Error('Invalid test history.');
  if(s.pending!==null&&(!Number.isInteger(s.pending)||!s.predictions[s.pending]))throw Error('Invalid pending test.');
  if(s.conclusion&&!Array.isArray(s.conclusion.evidence))throw Error('Invalid conclusion.');
 }
 return value;
}
export async function pack(value){const raw=JSON.stringify(validate(value));if(typeof CompressionStream==='undefined')return raw;const bytes=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return 'gz1:'+btoa(binary);}
export async function unpack(data){if(typeof data!=='string')throw Error('Invalid cloud save.');if(data.startsWith('gz1:')){if(typeof DecompressionStream==='undefined')throw Error('Update your browser to read compressed cloud saves.');const bytes=Uint8Array.from(atob(data.slice(4)),c=>c.charCodeAt(0));data=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();}if(data.length>20_000_000)throw Error('Cloud save is too large to open safely.');return validate(JSON.parse(data));}
export function createSync({storage,getSnapshot,applySnapshot,onStatus=()=>{},fetcher=fetch,locks=globalThis.navigator?.locks,service=SERVICE}){
 let busy=false,conflict=null;
 const read=()=>{const raw=storage.getItem(LINK_KEY);return raw?JSON.parse(raw):null;};
 const write=link=>storage.setItem(LINK_KEY,JSON.stringify(link));
 const current=()=>JSON.stringify(validate(getSnapshot()));
 function backup(value,label){const records=JSON.parse(storage.getItem(RECOVERY_KEY)||'[]');records.push({at:Date.now(),label,snapshot:value});storage.setItem(RECOVERY_KEY,JSON.stringify(records));}
 function remember(remote,local){backup(JSON.parse(local),'Device copy before conflict');backup(remote.value,'Cloud copy before conflict');conflict=remote;onStatus('Both devices have changes. Choose which copy to continue; both are backed up.');}
 async function request(code,init){const res=await fetcher(`${service}/v1/save/${code}`,{cache:'no-store',signal:AbortSignal.timeout(15000),...init});if(res.status===404&&!init)return null;const body=await res.json();if(res.status===409)return {conflict:true,...body};if(!res.ok)throw Error(body.error||`Sync unavailable (${res.status}).`);if(!Number.isInteger(body.rev)||body.rev<1)throw Error('Invalid cloud revision.');return body;}
 async function decode(remote){if(!remote)return null;return {...remote,value:await unpack(remote.data)};}
 async function exclusive(fn){if(busy)return;busy=true;onStatus('Syncing…');try{if(!locks?.request)throw Error('This browser cannot safely coordinate sync tabs. Please update your browser.');return await locks.request(LINK_KEY,{mode:'exclusive'},fn);}catch(e){onStatus(`${e.message} Your local progress is kept.`);throw e;}finally{busy=false;}}
 async function upload(link,raw){const data=await pack(JSON.parse(raw));const body=JSON.stringify({data,baseRev:link.rev,savedAt:Date.now()});if(new TextEncoder().encode(body).length>400*1024)throw Error('Save exceeds the cloud size limit. Download a backup from Sync.');const result=await request(link.code,{method:'POST',headers:{'content-type':'text/plain'},body});if(result.conflict){remember(await decode(result),current());return false;}write({...link,rev:result.rev,baseline:raw,at:Date.now()});onStatus(current()===raw?'Synced across devices.':'Latest moves saved locally; next sync will upload them.');return true;}
 async function adopt(remote,link){backup(getSnapshot(),'Device copy before cloud restore');await applySnapshot(remote.value);write({...link,rev:remote.rev,baseline:current(),at:Date.now()});onStatus('Cloud progress loaded and saved on this device.');}
 return {
  status:()=>({link:read(),busy,conflict:!!conflict}),
  backup:()=>backup(getSnapshot(),'Manual backup'),
  create:()=>exclusive(async()=>{if(read())throw Error('This device is already linked.');const code=newCode(),raw=current();const link={code,rev:0,baseline:'',at:0};write(link);await upload(link,raw);return read();}),
  join:code=>exclusive(async()=>{if(read())throw Error('Turn off the existing link before linking another.');code=normalizeCode(code);if(!validCode(code))throw Error('Enter the complete Analytical Adventure code starting with AA. Engineering Quest codes belong in Engineering Quest.');const remote=await decode(await request(code));if(!remote)throw Error('No saved game was found. Turn on sync on the first device, then check the code.');await adopt(remote,{code});return read();}),
  sync:(allowRestore=false)=>exclusive(async()=>{const link=read();if(!link)return;if(conflict){onStatus('Choose a copy to resolve the saved conflict.');return;}const remote=await decode(await request(link.code));const raw=current();if(!remote){if(link.rev===0){await upload(link,raw);return;}throw Error('Cloud copy not found. Your local copy is preserved.');}if(remote.rev<link.rev)throw Error('Cloud revision went backwards. No save was changed.');if(remote.rev===link.rev){if(raw!==link.baseline)await upload(link,raw);else onStatus('Synced across devices.');return;}if(raw!==link.baseline){remember(remote,raw);return;}if(!(typeof allowRestore==='function'?allowRestore():allowRestore)){onStatus('Updates available from your other device. Open Sync and press Sync now.');return;}await adopt(remote,link);}),
  resolve:choice=>exclusive(async()=>{if(!conflict)throw Error('No conflict to resolve.');const link=read();const remote=await decode(await request(link.code));if(!remote)throw Error('Cloud copy is unavailable.');if(remote.rev!==conflict.rev){remember(remote,current());return;}if(choice==='cloud'){await adopt(remote,link);conflict=null;}else if(choice==='device'){if(await upload({...link,rev:remote.rev},current()))conflict=null;}else throw Error('Choose a copy to continue.');}),
  disconnect:()=>exclusive(async()=>{backup(getSnapshot(),'Device copy before disconnect');storage.removeItem(LINK_KEY);conflict=null;onStatus('Sync turned off here. Local progress and the cloud copy are kept.');})
 };
}
