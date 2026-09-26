import {SAVE_KEY,loadSave} from '../engine.js';
import {LINK_KEY,formatCode,normalizeCode,newCode,request,snapshot,merge,applyPayload} from './sync-model.js';
export function createAcademySync({getSave,applySave,isBlocked,storage=localStorage,requestFn=request}){
 let timer,busy=false,dirty=false,preview=null,message='';
 const dialog=document.createElement('dialog');dialog.className='academy-sync';dialog.setAttribute('aria-labelledby','sync-title');
 dialog.innerHTML=`<form method="dialog"><button class="sync-close" aria-label="Close sync">×</button></form><h2 id="sync-title">Sync across devices</h2><p id="sync-learner"></p><p>Keep this learner’s completed scenes, lesson place and Academy reviews on your other devices. Other courses and learners stay separate.</p><div id="sync-linked" hidden><label for="sync-code">Your private Academy code</label><input id="sync-code" readonly autocomplete="off"><div class="sync-actions"><button id="sync-copy">Copy code</button><button id="sync-now">Sync now</button></div><p>On another device, open the Academy, tap Sync, and enter this code. Anyone with the code can access this learner’s Academy progress.</p><button id="sync-disconnect">Disconnect this device</button></div><div id="sync-unlinked"><button id="sync-create">Create my sync code</button><p>Already have an Academy code?</p><form id="sync-connect"><label for="sync-enter">Code from your other device</label><input id="sync-enter" placeholder="ACXX-XXXX-XXXX" maxlength="16" autocomplete="off" autocapitalize="characters" spellcheck="false" required><button>Find my learner</button></form><p>Engineering Quest codes are separate. Academy codes begin with AC.</p></div><div id="sync-preview" hidden><p id="sync-preview-text"></p><button id="sync-import">Add / sync this learner</button><p>Your existing local learners are kept. Matching learner IDs merge their completed scenes.</p></div><p id="sync-message" role="status" aria-live="polite"></p><small id="sync-last"></small>`;
 document.body.append(dialog);
 const el=id=>dialog.querySelector('#'+id);
 function links(){try{return JSON.parse(storage.getItem(LINK_KEY)||'{}');}catch{return {};}}
 function current(){const s=getSave();return s.profiles.find(p=>p.id===s.active);}
 function linkFor(id){return links()[id];}
 function putLink(id,link){const all=links();if(link)all[id]=link;else delete all[id];storage.setItem(LINK_KEY,JSON.stringify(all));}
 function report(s){message=s;el('sync-message').textContent=s;const badge=document.querySelector('[data-action="sync"]');if(badge)badge.title=s;}
 function render(){const p=current(),link=linkFor(p.id);el('sync-learner').textContent='Learner: '+p.name;el('sync-linked').hidden=!link;el('sync-unlinked').hidden=!!link;el('sync-code').value=link?formatCode(link.code):'';el('sync-last').textContent=link?.at?'Last synced: '+new Date(link.at).toLocaleString():'';el('sync-message').textContent=message;dialog.querySelectorAll('button:not(.sync-close)').forEach(b=>b.disabled=busy);}
 function read(){if(isBlocked())throw Error('Saving is unavailable on this device. Your existing progress has not been changed.');const latest=loadSave(storage);if(latest.error)throw Error(latest.error);return storage.getItem(SAVE_KEY)?latest.save:getSave();}
 function commit(payload,activate=false){const base=read(),next=applyPayload(base,payload);if(activate)next.active=payload.learner.id;
  if(JSON.stringify(base)===JSON.stringify(next))return;
  // Retain the prior family save before applying cloud progress; never replace unreadable data.
  storage.setItem(SAVE_KEY+'.before-academy-sync',JSON.stringify(base));
  storage.setItem(SAVE_KEY,JSON.stringify(next));applySave(next);
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(()=>syncAll(),15000);}
 async function run(action){if(busy)return;busy=true;render();try{await action();}catch(e){report('Not synced. '+(e.name==='TimeoutError'?'The connection timed out.':e.message)+' Your progress stays on this device.');}finally{busy=false;render();if(dirty)schedule();}}
 async function syncOne(id){
  const link=linkFor(id);if(!link)return;
  let remote=await requestFn(link.code);
  if(!remote)throw Error('No cloud save was found for this code.');
  for(let tries=0;tries<4;tries++){
   const p=read().profiles.find(p=>p.id===id);if(!p)return;
   const combined=merge(snapshot(p),remote.payload);
   if(JSON.stringify(combined)===JSON.stringify(remote.payload)){commit(combined);putLink(id,{code:link.code,rev:remote.rev,at:Date.now()});return;}
   const result=await requestFn(link.code,{method:'POST',payload:combined,rev:remote.rev});
   if(result.conflict){remote=result;continue;}
   // Merge again with current storage: the learner may answer while the network request runs.
   commit(combined);putLink(id,{code:link.code,rev:result.rev,at:Date.now()});return;
  }
  throw Error('Another device is syncing. Try Sync now again.');
 }
 async function syncAll(){if(busy){dirty=true;return;}if(!Object.keys(links()).length)return;await run(async()=>{dirty=false;report('Syncing…');for(const id of Object.keys(links()))await syncOne(id);report('Synced. Completed scenes from both devices are kept.');});}
 el('sync-create').onclick=()=>run(async()=>{
  const p=current();const base=read();storage.setItem(SAVE_KEY,JSON.stringify(base));const code=newCode();report('Creating your code…');
  const result=await requestFn(code,{method:'POST',payload:snapshot(p),rev:0});
  if(result.conflict)throw Error('Please try creating a code again.');
  putLink(p.id,{code,rev:result.rev,at:Date.now()});report('Ready. Enter this code on your other device.');
 });
 el('sync-connect').onsubmit=e=>{e.preventDefault();run(async()=>{preview=null;el('sync-preview').hidden=true;const code=normalizeCode(el('sync-enter').value);const remote=await requestFn(code);if(!remote)throw Error('No saved learner was found. Check the code on the first device.');preview={code,...remote};el('sync-preview-text').textContent=remote.payload.learner.name+' — '+Object.keys(remote.payload.academy.completed).length+' of 3,000 scenes completed';el('sync-preview').hidden=false;report('Check the learner above, then add / sync.');});};
 el('sync-import').onclick=()=>run(async()=>{if(!preview)return;const {code,payload,rev}=preview;commit(payload,true);putLink(payload.learner.id,{code,rev,at:0});await syncOne(payload.learner.id);preview=null;el('sync-preview').hidden=true;report('Learner connected. Continue your journey on this device.');});
 el('sync-copy').onclick=async()=>{try{await navigator.clipboard.writeText(el('sync-code').value);report('Code copied.');}catch{el('sync-code').select();report('Select and copy the code above.');}};
 el('sync-now').onclick=syncAll;
 el('sync-disconnect').onclick=()=>{putLink(current().id,null);report('Disconnected here. Local progress and the cloud copy are kept.');render();};
 document.addEventListener('click',e=>{if(e.target.closest('[data-action="sync"]')){preview=null;el('sync-preview').hidden=true;render();dialog.showModal();}});
 window.addEventListener('online',syncAll);
 setInterval(()=>{if(!document.hidden&&!busy)syncAll();},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncAll();});
 window.addEventListener('storage',e=>{if(e.key===LINK_KEY)render();});
 return {changed(){dirty=true;if(Object.keys(links()).length)schedule();},start(){syncAll();},open(){render();dialog.showModal();}};
}
