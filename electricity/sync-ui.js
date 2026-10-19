import {ElectricitySync,formatCode,RECOVERY_KEY} from './sync.js';
import {validStore} from './engine.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function setupSync({storage,getState,commit,canApply,notify,rerender}){
 let revealed=false;
 function hasRecovery(){try{return !!storage.getItem(RECOVERY_KEY);}catch{return false;}}
 const cloud=new ElectricitySync({storage,getProfile:id=>getState().profiles.find(p=>p.id===id),canApply,
  replaceProfile(id,profile){const next={...getState(),profiles:getState().profiles.map(p=>p.id===id?{...profile,id}:p)};if(!validStore(next))throw Error('Invalid synced profile.');commit(next);rerender();},
  addProfile(profile){const state=getState();if(state.profiles.length>=20)throw Error('There are already 20 profiles on this device.');const next={...state,profiles:[...state.profiles,profile],active:profile.id};commit(next);rerender();return profile.id;},
  onChange(){const box=document.querySelector('#sync-status');if(box)box.textContent=cloud.info(getState().active).status||'Ready to sync.';const join=document.querySelector('#sync-join-status');if(join)join.textContent=cloud.info('join').status;}
 });
 function panel(){const id=getState().active,{link,status,conflict,busy}=cloud.info(id);return `<section class="card sync-card" style="margin-top:24px"><p class="eyebrow">USE ANOTHER DEVICE</p><h2>Sync your Electricity progress</h2><p class="muted">One learner. One private code. Your lessons, answers, and notes travel together.</p><p id="sync-status" role="status">${esc(status||'Ready to connect.')}</p>${link?`<div class="callout"><p class="small">Code for ${esc(getState().profiles.find(p=>p.id===id).name)}</p><strong class="sync-code">${revealed?esc(formatCode(link.code)):'••••–••••–••••'}</strong><div class="row"><button class="btn outline small" data-action="sync-reveal">${revealed?'Hide code':'Show my code'}</button><button class="btn light small" data-action="sync-copy">Copy code</button></div><p class="fineprint">Last successful sync: ${link.at?new Date(link.at).toLocaleString():'Not yet'}. Anyone with this code can read and change this learner’s cloud save. Keep it private.</p></div><div class="row"><button class="btn" data-action="sync-now" ${busy?'disabled':''}>Sync now</button><button class="btn outline" data-action="sync-disconnect" ${busy?'disabled':''}>Disconnect this device</button></div>${conflict?`<div class="callout" role="alert"><h3>Both devices have changes</h3><p>These copies cannot be combined automatically. Choose which one to continue with. Both copies are saved in a recovery backup first.</p><div class="row"><button class="btn light" data-action="sync-local">Keep this device’s copy</button><button class="btn outline" data-action="sync-remote">Use the cloud copy</button></div></div>`:''}`:`<p class="small">On your first device, create a code for the selected learner.</p><button class="btn" data-action="sync-create" ${busy?'disabled':''}>Create my sync code</button><p class="fineprint">This uploads this learner’s saved progress and notebook to the same sync service used by Engineering Quest. It does not upload other learners. Avoid sensitive notes.</p>`}<details ${cloud.info('join').status?'open':''} style="margin-top:24px"><summary>Connect a code from another device</summary><form id="sync-join-form"><label class="field">Electricity code<input name="syncCode" id="sync-code-input" placeholder="ELXX-XXXX-XXXX" maxlength="20" autocomplete="off" autocapitalize="characters" spellcheck="false" required></label><p class="fineprint">Use a code beginning EL. Engineering Quest codes are for that game only. Connecting adds a learner without replacing existing local profiles.</p><button class="btn light" type="submit" ${busy?'disabled':''}>Connect this device</button><p id="sync-join-status" role="status">${esc(cloud.info('join').status)}</p></form></details><p class="fineprint" style="margin-top:20px">Sync checks about every 15 seconds while this app is visible, and when you return online. Completed work saves locally first. Finish a drill before switching devices. If both devices were used offline, choose a copy when prompted.</p>${hasRecovery()?'<button class="linkbtn" data-action="sync-recovery">Download last recovery backup</button>':''}</section>`;}
 async function action(name){const id=getState().active;
  if(name==='sync-create'){try{commit(getState());}catch(e){notify(e.message);return;}await cloud.create(id);}
  else if(name==='sync-now')await cloud.sync(id);
  else if(name==='sync-local'||name==='sync-remote')await cloud.resolve(id,name==='sync-local'?'local':'remote');
  else if(name==='sync-reveal')revealed=!revealed;
  else if(name==='sync-copy'){try{await navigator.clipboard.writeText(formatCode(cloud.info(id).link.code));notify('Code copied. Keep it private.');}catch{revealed=true;notify('Select and copy the code shown below.');}}
  else if(name==='sync-disconnect'){if(confirm('Disconnect this device? Local progress stays here. Other devices keep syncing.'))try{cloud.disconnect(id);revealed=false;}catch(e){notify(e.message);}}
  else if(name==='sync-recovery'){const raw=storage.getItem(RECOVERY_KEY);if(raw){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a.href=url;a.download='electricity-sync-recovery.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}
  rerender();
 }
 async function join(code){const result=await cloud.join(code);revealed=false;rerender();return result;}
 async function tick(){if(document.visibilityState==='hidden'||!canApply()||cloud.busy)return;for(const id of Object.keys(cloud.links)){if(!canApply()||!getState().profiles.some(p=>p.id===id))continue;const before=cloud.info(id).conflict;await cloud.sync(id);if(cloud.info(id).conflict!==before){notify('Both devices changed. Open Profile & sync to choose a copy.');rerender();}}}
 if(typeof window.addEventListener==='function'){
  window.addEventListener('online',tick);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')tick();});
  setInterval(tick,15000);setTimeout(tick,500);
 }
 return {panel,action,join,cloud,hideCode:()=>{revealed=false;}};
}

