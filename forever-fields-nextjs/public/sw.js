// Forever Fields Service Worker
// Provides offline support for memorial viewing

const CACHE_VERSION = "v1";
const STATIC_CACHE = `forever-fields-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `forever-fields-dynamic-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/help",
  "/pricing",
  "/memorials",
  "/manifest.json",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name.startsWith("forever-fields-") &&
              name !== STATIC_CACHE &&
              name !== DYNAMIC_CACHE
            );
          })
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip API requests (except for specific endpoints)
  if (url.pathname.startsWith("/api/")) {
    // Only cache GET requests to memorials API
    if (url.pathname.startsWith("/api/memorials")) {
      event.respondWith(networkFirstThenCache(request));
    }
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip Next.js internal requests
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.includes("__nextjs")
  ) {
    return;
  }

  // For HTML pages - Network first, fallback to cache
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirstThenCache(request));
    return;
  }

  // For images - Cache first, fallback to network
  if (
    request.destination === "image" ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i)
  ) {
    event.respondWith(cacheFirstThenNetwork(request));
    return;
  }

  // For other assets - Stale while revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Network first, then cache
async function networkFirstThenCache(request) {
  try {
    const networkResponse = await fetch(request);
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page for HTML requests
    if (request.headers.get("accept")?.includes("text/html")) {
      return caches.match("/offline") || caches.match("/");
    }
    throw error;
  }
}

// Cache first, then network
async function cacheFirstThenNetwork(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a placeholder for images
    return new Response("", { status: 404 });
  }
}

// Stale while revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  // Fetch in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  // Return cached response immediately, or wait for network
  return cachedResponse || fetchPromise;
}

// Listen for messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
