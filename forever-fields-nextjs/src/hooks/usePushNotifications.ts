"use client";

import { useState, useEffect, useCallback } from "react";

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isSubscribed: boolean;
  isLoading: boolean;
  vapidPublicKey: string | null;
}

/**
 * Convert base64 URL to Uint8Array for push subscription
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Hook for managing push notification subscriptions
 */
export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "unsupported",
    isSubscribed: false,
    isLoading: true,
    vapidPublicKey: null,
  });

  // Check support and current status on mount
  useEffect(() => {
    async function checkStatus() {
      // Check browser support
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          permission: "unsupported",
          isLoading: false,
        }));
        return;
      }

      try {
        // Get VAPID key and subscription status from server
        const response = await fetch("/api/push/subscribe");
        const data = await response.json();

        // Check current permission
        const permission = Notification.permission;

        // Check if we have an active subscription
        let isSubscribed = false;
        if (permission === "granted") {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          isSubscribed = !!subscription;
        }

        setState({
          isSupported: true,
          permission,
          isSubscribed: isSubscribed && data.subscribed,
          isLoading: false,
          vapidPublicKey: data.vapidPublicKey,
        });
      } catch (error) {
        console.error("Error checking push status:", error);
        setState((prev) => ({
          ...prev,
          isSupported: true,
          permission: Notification.permission,
          isLoading: false,
        }));
      }
    }

    checkStatus();
  }, []);

  /**
   * Request permission and subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !state.vapidPublicKey) {
      console.error("Push notifications not supported or not configured");
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));

      if (permission !== "granted") {
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(state.vapidPublicKey),
      });

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error("Push subscription error:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.isSupported, state.vapidPublicKey]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Remove from server
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.isSupported]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}
