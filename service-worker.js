/**
 * Forever Fields Service Worker
 * Provides offline functionality and caching for PWA
 */

const CACHE_VERSION = 'v1.1.0'; // Upgraded for offline memorial viewing
const CACHE_NAME = `forever-fields-${CACHE_VERSION}`;
const RUNTIME_CACHE = `forever-fields-runtime-${CACHE_VERSION}`;
const API_CACHE = `forever-fields-api-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/dark-mode.css',
    '/js/script.js',
    '/js/api-client.js',
    '/js/api-config.js',
    '/js/memorial-helpers.js',
    '/js/modal-system.js',
    '/js/undo-system.js',
    '/js/keyboard-shortcuts.js',
    '/js/upload-progress.js',
    '/js/indexeddb-manager.js',
    '/js/offline-sync.js',
    '/js/auth-ui.js',
    '/js/language-switcher.js',
    '/js/pwa.js',
    '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - smart caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Strategy 1: Stale-while-revalidate for memorial API calls (offline viewing!)
    if (url.pathname.startsWith('/api/memorials/') && !url.pathname.includes('/candles')) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Strategy 2: Network-only for write operations
    if (url.pathname.includes('/api/') && (url.pathname.includes('/candles') || url.pathname.includes('/memories'))) {
        event.respondWith(networkOnly(request));
        return;
    }

    // Strategy 3: Network-first with cache fallback for other API calls
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstWithCache(request));
        return;
    }

    // Strategy 4: Cache-first for static assets and pages
    event.respondWith(cacheFirst(request));
});

/**
 * Stale-while-revalidate strategy
 * Returns cached version immediately, updates cache in background
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);

    // Fetch from network and update cache in background
    const fetchPromise = fetch(request)
        .then((response) => {
            if (response && response.status === 200) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    // Return cached response immediately, or wait for network
    return cachedResponse || fetchPromise || offlineResponse();
}

/**
 * Network-only strategy (for write operations)
 */
async function networkOnly(request) {
    try {
        return await fetch(request);
    } catch (error) {
        return offlineResponse();
    }
}

/**
 * Network-first with cache fallback
 */
async function networkFirstWithCache(request) {
    const cache = await caches.open(API_CACHE);

    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        return cachedResponse || offlineResponse();
    }
}

/**
 * Cache-first strategy for static assets
 */
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const response = await fetch(request);

        if (response && response.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        // Return offline page for navigation requests
        if (request.destination === 'document') {
            return new Response(
                getOfflinePage(),
                {
                    status: 200,
                    headers: { 'Content-Type': 'text/html' }
                }
            );
        }

        return new Response('Offline', { status: 503 });
    }
}

/**
 * Generic offline response
 */
function offlineResponse() {
    return new Response(
        JSON.stringify({
            error: 'You are offline. Please check your internet connection.',
            offline: true
        }),
        {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

function getOfflinePage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - Forever Fields</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(180deg, #f5f7f5 0%, #fff8f0 100%);
            color: #3a3a3a;
            text-align: center;
            padding: 2rem;
        }
        .offline-container {
            max-width: 500px;
        }
        .offline-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        h1 {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #2a2a2a;
        }
        p {
            font-size: 1.1rem;
            line-height: 1.6;
            color: #6a6a6a;
            margin-bottom: 2rem;
        }
        .btn {
            display: inline-block;
            padding: 0.875rem 2rem;
            background: linear-gradient(135deg, #b38f1f, #8a6d17);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            transition: transform 0.2s ease;
        }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="offline-icon">📡</div>
        <h1>You're Offline</h1>
        <p>It looks like you're not connected to the internet. Please check your connection and try again.</p>
        <p style="font-size: 0.95rem; color: #8a8a8a;">Some cached pages may still be available while offline.</p>
        <a href="/" class="btn">Return to Home</a>
    </div>
</body>
</html>`;
}

console.log('[Service Worker] Script loaded');
