const CACHE = 'etd-quest-v1.0.1';
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

function sameOriginGet(request) {
  return request.method === 'GET' && new URL(request.url).origin === self.location.origin;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request, { cache: 'reload' });
    if (sameOriginGet(request) && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('install', event => {
  event.waitUntil(Promise.all([
    self.skipWaiting(),
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)),
  ]));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (!sameOriginGet(request)) return;
  if (request.mode === 'navigate' || new URL(request.url).pathname.endsWith('/index.html')) {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(networkFirst(request));
});
