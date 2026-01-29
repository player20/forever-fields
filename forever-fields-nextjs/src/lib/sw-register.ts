// Service Worker Registration

export async function registerServiceWorker() {
  if (typeof window === "undefined") {
    return;
  }

  if (!("serviceWorker" in navigator)) {
    console.log("[SW] Service workers not supported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("[SW] Service worker registered:", registration.scope);

    // Handle updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New content is available
            console.log("[SW] New content available");
            // Optionally notify the user
            if (window.confirm("New version available! Reload to update?")) {
              newWorker.postMessage("skipWaiting");
              window.location.reload();
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error("[SW] Registration failed:", error);
  }
}

export function unregisterServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}
