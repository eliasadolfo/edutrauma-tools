// Service Worker — MIP · NETWORK-FIRST + auto-actualización
const CACHE = 'mip-v3';
const ASSETS = ['./','./index.html','./manifest.json','./design/edutrauma-ui.css',
  './design/feedback.js','./logo-blanco-trim.png','./logo-mip.png','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', e => { const req=e.request; if(req.method!=='GET')return; const u=new URL(req.url); if(u.origin!==location.origin)return; e.respondWith(fetch(req).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp)).catch(()=>{});return res;}).catch(()=>caches.match(req).then(c=>c||caches.match('./index.html')))); });
