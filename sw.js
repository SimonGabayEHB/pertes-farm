// SW.js - service worker

// 1. Name of the cache
const CACHE_NAME = "pertes-v2.12";

// 2. List of files to cache
const ASSETS = [
  "/pertes-farm/",
  "/pertes-farm/index.html",
  "/pertes-farm/style.css",
  "/pertes-farm/manifest.json",
  "/pertes-farm/products.json",
  "/pertes-farm/JsBarcode.min.js",
  "/pertes-farm/js/main.js",
  "/pertes-farm/images/ic_launcher.png",
  "/pertes-farm/images/playstore.png",
  "/pertes-farm/images/farm-logo.webp",
  "/pertes-farm/fonts/PatuaOne-Regular.woff2",
  "/pertes-farm/fonts/PatuaOne-Regular.woff"
];

// 3. INSTALL event — caches all assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
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
  self.clients.claim();
});

// 5. FETCH event — serve cached files when offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});


