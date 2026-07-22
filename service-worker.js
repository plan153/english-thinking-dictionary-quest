const CACHE = 'etd-quest-v1.1.2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/domain/markdown-projection.js',
  './src/domain/obsidian-sync.js',
  './src/domain/canon-intake.js',
  './src/domain/verb-matrix-gate.js',
  './src/domain/vault-overlay.js',
  './src/domain/feynman-challenge.js',
  './src/domain/graph-style.js',
  './src/domain/progress-store.js',
  './src/domain/active-speaking-set.js',
  './src/domain/english-brain-export.js',
  './data/verbs.json',
  './data/nouns.json',
  './data/patterns.json',
  './data/expressions.json',
  './data/verb-maps.json',
  './data/learning-paths.json',
  './data/qa-matrices.json',
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
