// Service Worker — estrategia NETWORK-FIRST (siempre la última versión cuando hay señal;
// caché solo como respaldo offline). Se auto-activa y limpia versiones viejas.
const CACHE = 'et-tools-app-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './design/edutrauma-ui.css',
  './design/et-app.css',
  './design/feedback.js',
  './i18n.js',
  './et-data.js',
  './aast-data.js',
  './mip-data.js',
  './tools.js',
  './tools2.js',
  './cases.js',
  './guias.js',
  './camas.js',
  './vendor/supabase.js',
  './app.js',
  './abdomen/miaa-trans.js',
  './mip/mip-trans.js',
  './logo-blanco-trim.png',
  './logo-miaa.png',
  './logo-dqt.png',
  './logo-mip.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];
self.addEventListener('install', (e) => {
  // addAll falla entero si un solo archivo falla; se cachea uno a uno para que
  // un recurso ausente no deje la app sin caché offline.
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(ASSETS.map((a) => c.add(a).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // no tocar analytics ni orígenes externos
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
  );
});
