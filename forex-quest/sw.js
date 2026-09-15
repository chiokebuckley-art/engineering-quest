// Bump this version on EVERY release, including content-only changes.
const CACHE='forex-quest-v2.0.3';
const ASSETS=['./','index.html','style.css','app.js','profiles.js','updates.js','engine.js','content.js','advanced-engine.js','advanced-content.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];
// A complete release must be cached before it can replace the current one.
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})))));});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')event.waitUntil(self.skipWaiting());});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('forex-quest-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!event.request.url.startsWith(self.registration.scope))return;
 // Serve one complete cached release, rather than mixing old and new modules.
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(event.request,{ignoreSearch:true});
  if(cached)return cached;
  try{return await fetch(event.request);}catch{return event.request.mode==='navigate'?(await cache.match(new URL('./',self.registration.scope).href))||Response.error():Response.error();}
 })());
});
