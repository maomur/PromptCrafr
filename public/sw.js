/**
 * Service worker de PromptCraft.
 *
 * El anterior sólo hacía `fetch().catch(() => caches.match(...))` sin llegar a
 * guardar nada en la caché, así que sin conexión no había nada que servir.
 * Aquí separamos dos estrategias:
 *
 *  - Navegaciones: red primero, con la última página vista como respaldo.
 *  - Recursos estáticos de Next.js: caché primero, porque llevan un hash en el
 *    nombre y nunca cambian de contenido.
 *
 * Los datos nunca se cachean: de la sincronización sin conexión ya se encarga
 * la persistencia propia de Firestore.
 */

const VERSION = 'v2';
const PAGES_CACHE = `promptcraft-pages-${VERSION}`;
const ASSETS_CACHE = `promptcraft-assets-${VERSION}`;
const CURRENT_CACHES = [PAGES_CACHE, ASSETS_CACHE];

const PRECACHED_ASSETS = ['/icons/logo-192.png', '/icons/apple-touch-icon.png', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(ASSETS_CACHE)
      .then((cache) => cache.addAll(PRECACHED_ASSETS))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => !CURRENT_CACHES.includes(name)).map((name) => caches.delete(name)))
      )
      .then(() => self.clients.claim())
  );
});

/** Sólo gestionamos peticiones propias; el resto van directas a la red. */
function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

/** Los ficheros con hash de Next.js y los iconos se pueden cachear sin miedo. */
function isImmutableAsset(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/');
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Las escrituras y las llamadas a Firebase no se tocan.
  if (request.method !== 'GET' || !isSameOrigin(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGES_CACHE));
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE));
  }
});

// Permite que la página active una versión nueva sin esperar a cerrar pestañas.
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});
