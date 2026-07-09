// Service Worker — Hub EduTrauma Tools
// Cachea SOLO el hub. /abdomen/ (y cada herramienta) tiene su propio SW.
const CACHE = 'et-tools-hub-v8';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './design/edutrauma-ui.css',
  './logo-blanco-trim.png',
  './logo-miaa.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // No tocar las herramientas (tienen su propio SW) ni orígenes externos (analytics)
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/abdomen')) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => cached);
    })
  );
});
