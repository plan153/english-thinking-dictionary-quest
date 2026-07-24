const CACHE = 'etd-quest-v1.3.11';
// Do NOT precache HTML. Stale index.html in Cache Storage is the main Safari stuck-UI cause.
const ASSETS = [
  './manifest.webmanifest',
  './src/data/thinking-map-sets.js',
  './src/domain/next-practice.js',
  './src/domain/markdown-projection.js',
  './src/domain/obsidian-sync.js',
  './src/domain/canon-intake.js',
  './src/domain/verb-matrix-gate.js',
  './src/domain/vault-overlay.js',
  './src/domain/feynman-challenge.js',
  './src/domain/graph-style.js',
  './src/domain/progress-store.js',
  './src/domain/active-speaking-set.js',
  './src/domain/phrasal-speaking-set.js',
  './src/domain/english-brain-export.js',
  './data/verbs.json',
  './data/nouns.json',
  './data/patterns.json',
  './data/expressions.json',
  './data/verb-maps.json',
  './data/learning-paths.json',
  './data/qa-matrices.json',
  './data/phrasal-verbs.json',
  './data/phrasal-qa-matrices.json',
];

function sameOriginGet(request) {
  return request.method === 'GET' && new URL(request.url).origin === self.location.origin;
}

function isHtmlNavigation(request, url) {
  if (request.mode === 'navigate') return true;
  const path = url.pathname;
  return path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('index.html');
}

function isBypassPath(url) {
  return url.pathname.endsWith('/fresh.html') || url.pathname.endsWith('fresh.html');
}

async function networkOnly(request) {
  return fetch(request, { cache: 'no-store' });
}

async function networkFirstAsset(request) {
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
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (!sameOriginGet(request)) return;
  const url = new URL(request.url);
  // Let the cache-buster page talk to the network/browser directly.
  if (isBypassPath(url)) return;
  // Never serve HTML from Cache Storage — always hit the network.
  if (isHtmlNavigation(request, url)) {
    event.respondWith(networkOnly(request));
    return;
  }
  event.respondWith(networkFirstAsset(request));
});
