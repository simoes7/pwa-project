const CACHE_NAME = 'smart-queue-cache-v1';
const OFFLINE_URL = '/offline.html';

// Core assets to pre-cache immediately upon installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
  OFFLINE_URL
];

// Self install event: pre-cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching offline shell and assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Self activate event: clear out old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper to determine if a request is a local API call
const isApiRequest = (url) => {
  return url.includes('/api/') || url.includes('/socket.io');
};

// Fetch event interceptor
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Skip caching for API, socket connections, and chrome extensions
  if (isApiRequest(event.request.url) || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // 2. Handle SPA Navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If response is valid, clone and cache it
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[Service Worker] Navigation failed, serving cached shell or offline fallback');
          // Try to serve the cached app shell or index first, otherwise fall back to offline page
          return caches.match('/')
            .then((cachedShell) => {
              if (cachedShell) {
                return cachedShell;
              }
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // 3. Cache First with Network Fallback strategy for static assets (images, CSS, JS, fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache for next time (Stale-While-Revalidate style)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {/* Ignore background sync failures */ });

        return cachedResponse;
      }

      // If not in cache, fetch from network and cache for future use
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        // Fallback for image requests when offline
        if (event.request.headers.get('accept').includes('image')) {
          return caches.match('/favicon.svg');
        }
        throw err;
      });
    })
  );
});
