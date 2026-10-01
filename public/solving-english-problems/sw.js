// Caches only the hub's own files so the home screen, exam and study menu open offline. Requests for the
// three worlds pass straight through: Sentence Forge keeps its own worker, and Linguistics Quest and
// Word Raiders deliberately have none.
const CACHE='solving-english-problems-v1.0.0';
const FILES=['./','./index.html','./style.css','./app.js','./exam.js','./exam-content.js','./skills.js','./progress.js','./hub-bar.js','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest','./sentence-forge/fonts.css','./sentence-forge/fonts/dm-sans-400.ttf','./sentence-forge/fonts/dm-sans-700.ttf','./sentence-forge/fonts/space-grotesk-600.ttf'];
const OWN=new Set(FILES.map(f=>new URL(f,self.location.href).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('solving-english-problems-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);url.hash='';url.search='';
 const isHome=event.request.mode==='navigate'&&url.href===new URL('./',self.location.href).href;
 if(!OWN.has(url.href)&&!isHome)return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;}).catch(()=>caches.match(event.request,{ignoreSearch:true}).then(hit=>hit||caches.match('./index.html'))));
});
