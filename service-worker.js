const CACHE = 'etd-quest-v1.0.0-data-v9';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './data/verbs.json',
  './data/nouns.json',
  './data/patterns.json',
  './data/expressions.json',
  './data/verb-maps.json',
  './data/learning-paths.json',
];

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.mode === 'navigate' || new URL(request.url).pathname.endsWith('/index.html')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
});
