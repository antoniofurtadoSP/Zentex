const CACHE_NAME = 'zentex-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/logo.png',
  '/logo192.png',
  '/logo512.png',
  '/logo180.png',
  '/logo152.png',
  '/logo167.png'
];

const isDevApp = self.location.hostname.includes('localhost') || 
                  self.location.hostname.includes('127.0.0.1') ||
                  self.location.hostname.includes('ais-dev') ||
                  self.location.hostname.includes('ais-pre') ||
                  self.location.hostname.includes('run.app');

if (isDevApp) {
  // In development and preview environments, bypass Service Worker caching completely
  // to ensure instant live updates of all application screens and fixes.
  self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map(key => caches.delete(key)));
      }).then(() => self.clients.claim())
    );
  });

  self.addEventListener('fetch', (event) => {
    // Do not intercept or cache anything in development/preview
    return;
  });
} else {
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('[Service Worker] Caching app shell');
          return cache.addAll(ASSETS_TO_CACHE);
        })
        .then(() => self.skipWaiting())
    );
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      }).then(() => self.clients.claim())
    );
  });

  self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    
    // Do not intercept external requests or /api endpoints
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/') || url.pathname.includes('/firestore')) {
      return;
    }

    // Network-First for index.html/navigation requests to guarantee instant updates
    if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
              return networkResponse;
            }
            return caches.match(event.request);
          })
          .catch(() => {
            return caches.match(event.request) || caches.match('/');
          })
      );
      return;
    }

    // Stale-while-revalidate for assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch in background to update cache for next time
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => { /* ignore background update failures */ });
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            // Fallback
            return caches.match('/');
          });
      })
    );
  });
}
