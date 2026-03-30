// Pub Golf — Service Worker
// Caches the app shell so it loads instantly and works offline
const CACHE = 'pub-golf-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:ital,wght@0,400;0,600;0,700;1,400&family=Barlow+Condensed:wght@400;700;900&display=swap'
];

// Install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache, fall back to network
// Firebase requests always go to network (real-time data)
self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Never cache Firebase — always live
  if (url.includes('firebase') || url.includes('firebasedatabase') || url.includes('googleapis.com/identitytoolkit')) {
    return; // let browser handle it normally
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      // Cache successful GET responses for the app shell
      if (e.request.method === 'GET' && resp.status === 200) {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    }))
  );
});
