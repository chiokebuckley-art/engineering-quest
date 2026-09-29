const CACHE='science-quest-v1.0.0';
const FILES=['./','./index.html','./styles.css','./src/app.js','./src/content.js','./src/models.js','./src/learning.js','./src/storage.js','./src/visuals.js','./favicon.svg','./manifest.webmanifest','./assets/islands.webp'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('science-quest-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||!event.request.url.startsWith(self.registration.scope))return;event.respondWith(caches.open(CACHE).then(async c=>(await c.match(event.request))||fetch(event.request)));});
