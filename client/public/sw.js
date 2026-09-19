// FoodMan Progressive Web App Service Worker
const CACHE_NAME = 'foodman-pwa-v1';

// Essential assets to cache immediately upon service worker installation
const PRECACHE_ASSETS = [
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-maskable-512x512.png',
  '/favicon.ico',
];

// Install event: Pre-cache critical offline assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event: Clean up old cache versions and take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event: Intelligent routing and caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never cache backend API requests or external WebSocket / Pusher connections
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('pusher.com') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // 2. Navigation requests (HTML page loads)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If response is valid, return it
          return response;
        })
        .catch(async () => {
          // If offline and request failed, serve the offline fallback page
          const cache = await caches.open(CACHE_NAME);
          const cachedOffline = await cache.match('/offline.html');
          return (
            cachedOffline ||
            new Response(
              '<html><body><h1>Offline</h1><p>Please connect to the internet.</p></body></html>',
              {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
              }
            )
          );
        })
    );
    return;
  }

  // 3. Static assets: Next.js bundles, public icons, images, fonts (Cache-First / Stale-While-Revalidate)
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff|woff2|ttf|css|js)$/);

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // Fetch updated asset in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Not in cache, fetch from network and cache
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. Default: Network-First with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        return cached;
      })
  );
});

// Listen for messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
