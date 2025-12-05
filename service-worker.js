/**
 * Forever Fields - Service Worker
 * Handles offline caching and push notifications
 */

const CACHE_VERSION = 'v0.6-pwa';
const CACHE_NAME = `forever-fields-${CACHE_VERSION}`;

// Assets to cache for offline use
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/create/',
    '/create/index.html',
    '/dashboard/',
    '/dashboard/index.html',
    '/memorial/',
    '/memorial/index.html',
    '/css/style.css',
    '/js/script.js',
    '/js/language-switcher.js',
    '/js/moderation.js',
    '/memorial-template/css/memorial.css',
    '/memorial-template/js/memorial.js',
    '/memorial-template/js/api-client.js',
    '/memorial-template/js/photo-uploader.js',
    '/manifest.json',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
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
                        if (cacheName !== CACHE_NAME) {
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Skip API requests (always go to network for fresh data)
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // Return offline message for API failures
                    return new Response(
                        JSON.stringify({ error: 'You are offline. Please check your connection.' }),
                        {
                            headers: { 'Content-Type': 'application/json' },
                            status: 503
                        }
                    );
                })
        );
        return;
    }

    // For other requests, try cache first, then network
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    // Return cached version
                    return response;
                }

                // Not in cache, fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a success response
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Cache successful GET requests
                        if (event.request.method === 'GET') {
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return response;
                    })
                    .catch(() => {
                        // Network failed, show offline page
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// ============================================
// PUSH NOTIFICATION HANDLERS
// ============================================

/**
 * Push event - receive and display notifications
 */
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event);

    let data = {};

    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        console.error('[Service Worker] Failed to parse push data:', error);
        data = {
            title: 'Forever Fields',
            body: 'You have a new notification',
        };
    }

    const title = data.title || 'Forever Fields';
    const options = {
        body: data.body || 'You have a new notification',
        icon: data.icon || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect width='192' height='192' fill='%23A7C9A2'/><text x='96' y='140' font-size='120' text-anchor='middle'>🌿</text></svg>",
        badge: data.badge || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><circle cx='48' cy='48' r='48' fill='%23A7C9A2'/><text x='48' y='72' font-size='60' text-anchor='middle'>🌿</text></svg>",
        vibrate: data.vibrate || [200, 100, 200],
        data: {
            url: data.url || '/',
            memorialId: data.memorialId || null,
            type: data.type || 'general',
            timestamp: Date.now(),
        },
        tag: data.tag || 'forever-fields-notification',
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || [
            {
                action: 'view',
                title: 'View',
                icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z' fill='%23A7C9A2'/></svg>",
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' fill='%23999'/></svg>",
            },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

/**
 * Notification click event - handle user interactions
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event);

    event.notification.close();

    const action = event.action;
    const notificationData = event.notification.data;

    if (action === 'dismiss') {
        // User dismissed the notification, do nothing
        return;
    }

    // Default action or 'view' action
    const urlToOpen = notificationData.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }

                // No window found, open new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

/**
 * Notification close event - track dismissals
 */
self.addEventListener('notificationclose', (event) => {
    console.log('[Service Worker] Notification closed:', event);

    // Could send analytics here if needed
    const notificationData = event.notification.data;

    // Log for debugging
    console.log('[Service Worker] Notification dismissed:', {
        type: notificationData.type,
        timestamp: notificationData.timestamp,
    });
});

/**
 * Background sync event - retry failed requests when online
 */
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);

    if (event.tag === 'sync-failed-requests') {
        event.waitUntil(
            // Could retry failed API requests here
            Promise.resolve()
        );
    }
});

/**
 * Message event - communicate with client pages
 */
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
});

console.log('[Service Worker] Loaded successfully');
