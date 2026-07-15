const CACHE = 'aast-v1';
const ASSETS = ['./','./index.html','./manifest.json','./design/edutrauma-ui.css','./aast-trans.js','./logo-blanco-trim.png','./logo-dqt.png','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', e => { if(e.request.method!=='GET')return; const u=new URL(e.request.url); if(u.origin!==location.origin)return; e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});return r;}).catch(()=>c))); });
