const CACHE_NAME = 'teguh-portfolio-v4';
const OFFLINE_PAGE = './offline.html';

// Only cache offline page and essential assets
const urlsToCache = [
  './style.css',
  './manifest.json',
  OFFLINE_PAGE
];

// Install event - cache only offline page
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching offline page and assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Offline page cached successfully');
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network Only with offline fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    // Always try network first (no caching of pages)
    fetch(event.request)
      .then((response) => {
        console.log('[Service Worker] Network success for:', event.request.url);
        return response;
      })
      .catch(() => {
        console.log('[Service Worker] Network failed (OFFLINE), showing offline page');
        
        // If network fails (offline), show offline page for HTML requests
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match(OFFLINE_PAGE);
        }
        
        // For CSS and other assets, try to serve from cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If not in cache, return error response
            return new Response('Offline - Resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});