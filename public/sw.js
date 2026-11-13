const CACHE = 'little-bites-v9';
const ASSETS = ['./', 'index.html', 'app.js', 'store.js', 'engine.js', 'grocery.js', 'foods.js', 'icon.svg', 'icon-192.png', 'manifest.webmanifest'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).pathname.startsWith('/api/')) return; // never cache API/account data
  // network-first so updates show up; fall back to cache offline
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((ch) => ch.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
