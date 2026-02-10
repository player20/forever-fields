// Push Notification Service Worker
// Handles incoming push messages and notification clicks

// This file should be registered alongside the main service worker
// or combined with it in the production build

self.addEventListener("push", function (event) {
  console.log("[SW Push] Received push event");

  if (!event.data) {
    console.warn("[SW Push] No data in push event");
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error("[SW Push] Failed to parse push data:", e);
    return;
  }

  const title = data.title || "Forever Fields";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/badge-72x72.png",
    image: data.image,
    tag: data.tag || "default",
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200],
    // Renotify if same tag
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  console.log("[SW Push] Notification clicked:", event.notification.tag);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  // Determine URL to open
  let url = "/";

  if (action) {
    // Handle specific actions
    switch (action) {
      case "view":
      case "open":
        url = data.url || "/";
        break;
      case "light":
        url = data.url ? `${data.url}?action=light-candle` : "/";
        break;
      case "accept":
        url = data.acceptUrl || data.url || "/";
        break;
      default:
        url = data.url || "/";
    }
  } else if (data.url) {
    // Default click - open the URL
    url = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      // Open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener("notificationclose", function (event) {
  console.log("[SW Push] Notification closed:", event.notification.tag);

  // Track analytics if needed
  const data = event.notification.data || {};
  if (data.trackClose) {
    // Could send analytics event here
  }
});

// Handle push subscription change (e.g., when browser refreshes keys)
self.addEventListener("pushsubscriptionchange", function (event) {
  console.log("[SW Push] Subscription changed");

  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Use the same application server key
      applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
    }).then((subscription) => {
      // Send new subscription to server
      return fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });
    }).catch((error) => {
      console.error("[SW Push] Failed to resubscribe:", error);
    })
  );
});
