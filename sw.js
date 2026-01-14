// SW.js - service worker

// 1. Name of the cache
const CACHE_NAME = "pertes-v1";

// 2. List of files to cache
const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/manifest.json",
  "/products.json",
  "/jsbarcode.min.js",
  "/js/main.js",
  "/images/icon-192.png",
  "/images/icon-512.png"
];

// 3. INSTALL event — caches all assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// 4. ACTIVATE event — cleans up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// 5. FETCH event — serve cached files when offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
