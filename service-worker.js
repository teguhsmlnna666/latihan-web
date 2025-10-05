const CACHE_NAME = 'teguh-portfolio-v5';
const OFFLINE_PAGE = 'offline.html';

// Only cache offline page and essential assets
const urlsToCache = [
  'style.css',
  'manifest.json',
  'offline.html'
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
        console.log('[Service Worker] ✅ Offline page cached successfully');
      })
      .catch((error) => {
        console.error('[Service Worker] ❌ Cache failed:', error);
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
  return self.clients.claim();
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

  // Check if it's an HTML request
  const isHTMLRequest = event.request.headers.get('accept')?.includes('text/html');

  event.respondWith(
    // Always try network first (no caching of pages)
    fetch(event.request)
      .then((response) => {
        console.log('[Service Worker] ✅ Network success for:', event.request.url);
        return response;
      })
      .catch((error) => {
        console.log('[Service Worker] ❌ Network failed (OFFLINE):', error);
        
        // If network fails and it's HTML request, show offline page
        if (isHTMLRequest) {
          console.log('[Service Worker] 🔄 Serving offline page');
          return caches.match(OFFLINE_PAGE)
            .then((response) => {
              if (response) {
                return response;
              }
              // Fallback if offline page not in cache
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Offline</title>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      min-height: 100vh;
                      margin: 0;
                      background: linear-gradient(to right, #6A89A7, #BDDDFC);
                      text-align: center;
                      padding: 20px;
                    }
                    .container {
                      background: white;
                      padding: 40px;
                      border-radius: 20px;
                      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    }
                    h1 { color: #384959; margin-bottom: 20px; }
                    button {
                      background: #384959;
                      color: white;
                      border: none;
                      padding: 12px 24px;
                      border-radius: 8px;
                      cursor: pointer;
                      font-size: 16px;
                      margin-top: 20px;
                    }
                    button:hover { background: #2b3642; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>🔌 Anda Sedang Offline</h1>
                    <p>Tidak dapat terhubung ke internet.</p>
                    <p>Silakan periksa koneksi Anda dan coba lagi.</p>
                    <button onclick="window.location.reload()">🔄 Coba Lagi</button>
                  </div>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html' }
              });
            });
        }
        
        // For CSS and other assets, try to serve from cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[Service Worker] 📦 Serving from cache:', event.request.url);
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