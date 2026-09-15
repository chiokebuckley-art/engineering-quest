// Keep this UI outside #app so checking for updates never redraws a lesson.
export async function startUpdates({beforeReload=()=>true}={}){
 if(!('serviceWorker' in navigator))return;
 let registration,requested=false,reloaded=false,changed=false,checking=false,lastCheck=0;
 const hadController=!!navigator.serviceWorker.controller;
 const bar=document.createElement('section');
 bar.className='update-bar';bar.hidden=true;bar.setAttribute('aria-label','App update');
 const status=document.createElement('span');status.setAttribute('role','status');
 const button=document.createElement('button');button.className='btn primary';button.textContent='Update now';
 bar.append(status,button);document.body.prepend(bar);
 const show=()=>{bar.hidden=false;status.textContent='An update is ready. Saved progress stays. Finish your current question or trade before updating.';button.disabled=false;};
 const reload=()=>{if(reloaded)return;reloaded=true;location.reload();};
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(requested){reload();return;}
  if(hadController){changed=true;show();}
 });
 button.onclick=()=>{
  try{if(!beforeReload()){status.textContent='Progress could not be saved. Export a backup from the Academy before updating.';return;}}
  catch{status.textContent='Progress could not be saved. Export a backup before updating.';return;}
  if(changed){reload();return;}
  if(!registration?.waiting){bar.hidden=true;void check();return;}
  requested=true;button.disabled=true;status.textContent='Applying update…';
  registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
  setTimeout(()=>{if(!reloaded){requested=false;button.disabled=false;status.textContent='The update is taking longer than expected. Tap Update now to retry.';}},10000);
 };
 const watch=worker=>{if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&registration.waiting)show();});};
 async function check(){
  if(!registration||checking||navigator.onLine===false||Date.now()-lastCheck<30000)return;
  checking=true;lastCheck=Date.now();
  try{await registration.update();if(registration.waiting)show();}catch{/* Offline play remains available. */}finally{checking=false;}
 }
 try{
  registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
  registration.addEventListener('updatefound',()=>watch(registration.installing));
  watch(registration.installing);if(registration.waiting)show();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void check();});
  window.addEventListener('pageshow',()=>void check());
  window.addEventListener('online',()=>{lastCheck=0;void check();});
  setInterval(()=>{if(document.visibilityState==='visible')void check();},5*60*1000);
  void check();
 }catch{/* Unsupported/private browser: normal online play still works. */}
}
