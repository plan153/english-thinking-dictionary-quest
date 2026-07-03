const CACHE = 'etd-quest-v1.0.0-data-v5';
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
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
