// Installation is browser-controlled and always requires the visitor's approval.
let pending=null,busy=false,installed=false,status='';
const standalone=matchMedia('(display-mode: standalone)');
const isApple=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isInstalled=()=>installed||standalone.matches||navigator.standalone===true;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pending=event;status='';refresh();});
window.addEventListener('appinstalled',()=>{installed=true;pending=null;busy=false;document.getElementById('install-help')?.close();refresh();});
standalone.addEventListener?.('change',refresh);
export function mountInstall(){
 if(isInstalled())return;
 const panel=document.createElement('section');panel.id='install-panel';panel.className='install-card';
 const copy=document.createElement('div');const title=document.createElement('strong');title.textContent='Keep Forex Quest on your home screen';
 const subtitle=document.createElement('p');subtitle.textContent='Open it like an app. No App Store needed.';copy.append(title,subtitle);
 const button=document.createElement('button');button.id='install-button';button.className='btn primary';button.addEventListener('click',install);
 const note=document.createElement('p');note.id='install-status';note.setAttribute('role','status');note.className='small';panel.append(copy,button,note);
 document.querySelector('.topbar')?.after(panel);refresh();
}
function refresh(){const panel=document.getElementById('install-panel');if(!panel)return;if(isInstalled()){panel.remove();return;}const button=document.getElementById('install-button');button.disabled=busy;button.textContent=busy?'Waiting for approval…':pending?'Install Forex Quest':isApple()?'Add to Home Screen':'Install on your device';document.getElementById('install-status').textContent=status;}
async function install(){
 if(busy||isInstalled())return;
 if(!pending){showHelp();return;}
 const event=pending;pending=null;busy=true;status='';refresh();
 try{
  // Call promptly inside the click handler to retain the browser's user activation.
  const result=await event.prompt();
  const choice=event.userChoice?await event.userChoice:result;
  status=choice?.outcome==='accepted'?'Installation approved. Your browser will finish adding the app.':'Installation cancelled. You can try again from your browser’s install menu.';
 }catch{status='The browser could not open installation. Use the install steps below.';showHelp();}
 finally{busy=false;refresh();}
}
function showHelp(){
 let dialog=document.getElementById('install-help');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='install-help';dialog.setAttribute('aria-labelledby','install-help-title');document.body.append(dialog);}
 const embedded=/FBAN|FBAV|Instagram|Line\/|MicroMessenger/.test(navigator.userAgent);
 dialog.innerHTML=`<h2 id="install-help-title">${isApple()?'Add Forex Quest to your home screen':'Install Forex Quest'}</h2>${isApple()?'<ol><li>Open this game in <strong>Safari</strong>.</li><li>Tap <strong>Share</strong> (you may find it in the page menu).</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>If shown, turn on <strong>Open as Web App</strong>, then tap <strong>Add</strong>.</li></ol><p>Apple requires these steps; this page cannot open the system installation prompt for you.</p>':'<ol><li>Open the game in a supported browser such as <strong>Chrome or Edge</strong>.</li><li>Open the browser menu and choose <strong>Install app</strong>, <strong>Install this site as an app</strong>, or <strong>Add to Home screen</strong>.</li><li>Approve the browser’s installation prompt.</li></ol><p>If an install option is not available, check whether the app is already installed or try another supported browser. A direct install button appears when your browser makes installation available.</p>'}${embedded?'<p><strong>Using an in-app browser?</strong> Choose Open in browser from its menu first.</p>':''}<p>Offline play is available after the first successful online cache. Installation does not create an account or sync progress between browsers; use Export progress to keep a backup.</p><form method="dialog"><button class="btn primary">Got it</button></form>`;
 if(!dialog.open)dialog.showModal();
}
