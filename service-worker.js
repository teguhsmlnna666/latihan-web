const CACHE_NAME = "teguh-pwa-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",
  "./style.css",
  "./icons/logo-512.png",
  "./icons/apple-touch-icon.png"
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  console.log("Service Worker activated.");
});

// Fetch
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    // jika user minta halaman baru, fallback ke offline.html saat offline
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match("./offline.html"))
    );
  } else {
    // asset load dari cache atau fetch
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});
