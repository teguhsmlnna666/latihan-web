
const CACHE_NAME = "teguh-pwa-v1";
const ASSETS_TO_CACHE = [
  "/latihan-web/",
  "/latihan-web/index.html",
  "/latihan-web/about.html",
  "/latihan-web/contact.html",
  "/latihan-web/offline.html",
  "/latihan-web/manifest.json",
  "/latihan-web/style.css",
  "/latihan-web/icons/logo-192.png",
  "/latihan-web/icons/logo-512.png",
  "/latihan-web/icons/apple-touch-icon.png"
];

// Install
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching assets");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
           .map((key) => {
             console.log("Deleting old cache:", key);
             return caches.delete(key);
           })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === "navigate") {
    // Navigation requests (HTML pages)
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, try cache first, then offline.html
          return caches.match(request)
            .then((cachedResponse) => {
              return cachedResponse || caches.match("/latihan-web/offline.html");
            });
        })
    );
  } else {
    // Assets (CSS, JS, images, etc.)
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Not in cache, fetch from network
          return fetch(request)
            .then((response) => {
              // Cache successful responses
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // Return empty response if fetch fails
              return new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
  }
});