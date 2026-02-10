"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, BellRing, Calendar, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui";

interface PushNotificationOptInProps {
  /** Memorial ID to subscribe to */
  memorialId?: string;
  /** Memorial name for personalized messaging */
  memorialName?: string;
  /** Variant: banner (bottom sheet) or inline (embedded in page) */
  variant?: "banner" | "inline" | "modal";
  /** Callback when subscription succeeds */
  onSubscribe?: (subscription: PushSubscription) => void;
  /** Callback when user dismisses */
  onDismiss?: () => void;
  /** Don't show again for this many days after dismissal */
  dismissDays?: number;
}

type PermissionState = "default" | "granted" | "denied" | "unsupported";

const NOTIFICATION_TYPES = [
  {
    id: "anniversaries",
    icon: Calendar,
    label: "Anniversary reminders",
    description: "Get notified on birthdays and memorial dates",
  },
  {
    id: "candles",
    icon: Heart,
    label: "Candle lightings",
    description: "When someone lights a candle",
  },
  {
    id: "guestbook",
    icon: MessageCircle,
    label: "Guestbook entries",
    description: "When someone leaves a message",
  },
];

export function PushNotificationOptIn({
  memorialId,
  memorialName,
  variant = "banner",
  onSubscribe,
  onDismiss,
  dismissDays = 14,
}: PushNotificationOptInProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>("default");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["anniversaries", "candles", "guestbook"]);
  const [error, setError] = useState<string | null>(null);

  // Check notification support and permission
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if push notifications are supported
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermissionState("unsupported");
      return;
    }

    // Check current permission
    setPermissionState(Notification.permission as PermissionState);

    // If already granted, don't show prompt
    if (Notification.permission === "granted") {
      return;
    }

    // If denied, don't show prompt
    if (Notification.permission === "denied") {
      return;
    }

    // Check dismissal
    const dismissedAt = localStorage.getItem("push_notification_dismissed");
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismissal = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < dismissDays) {
        return;
      }
    }

    // Show prompt after a short delay
    const timer = setTimeout(() => setShowPrompt(true), 2000);
    return () => clearTimeout(timer);
  }, [dismissDays]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem("push_notification_dismissed", new Date().toISOString());
    setShowPrompt(false);
    onDismiss?.();
  }, [onDismiss]);

  const toggleNotificationType = useCallback((typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((t) => t !== typeId)
        : [...prev, typeId]
    );
  }, []);

  const handleSubscribe = useCallback(async () => {
    setIsSubscribing(true);
    setError(null);

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPermissionState(permission as PermissionState);

      if (permission !== "granted") {
        setError("Notification permission was denied");
        setIsSubscribing(false);
        return;
      }

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const vapidResponse = await fetch("/api/push/vapid-key");
      if (!vapidResponse.ok) {
        throw new Error("Failed to get VAPID key");
      }
      const { publicKey } = await vapidResponse.json();

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          memorialId,
          notificationTypes: selectedTypes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save subscription");
      }

      // Success
      setShowPrompt(false);
      onSubscribe?.(subscription);

      // Show a test notification
      if (registration.showNotification) {
        registration.showNotification("Forever Fields", {
          body: memorialName
            ? `You'll receive updates about ${memorialName}'s memorial`
            : "You'll receive memorial updates and reminders",
          icon: "/icons/icon-192x192.png",
          badge: "/icons/badge-72x72.png",
          tag: "subscription-confirmation",
        });
      }
    } catch (err) {
      console.error("Push subscription error:", err);
      setError(err instanceof Error ? err.message : "Failed to enable notifications");
    } finally {
      setIsSubscribing(false);
    }
  }, [memorialId, memorialName, selectedTypes, onSubscribe]);

  // Don't render if not supported or already granted/denied
  if (permissionState === "unsupported" || permissionState === "granted") {
    return null;
  }

  if (permissionState === "denied") {
    // Show inline message about how to enable
    if (variant === "inline") {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Notifications blocked</p>
              <p className="text-amber-700 mt-1">
                To receive reminders, enable notifications in your browser settings.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  // Inline variant (always visible when mounted)
  if (variant === "inline") {
    return (
      <div className="bg-sage-pale/50 border border-sage-light rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-sage rounded-full flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-dark">Get notified</h3>
            <p className="text-sm text-gray-body mt-1">
              {memorialName
                ? `Receive updates about ${memorialName}'s memorial`
                : "Receive anniversary reminders and memorial updates"}
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-3"
              onClick={handleSubscribe}
              disabled={isSubscribing}
            >
              {isSubscribing ? "Enabling..." : "Enable Notifications"}
            </Button>
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Banner variant (bottom sheet)
  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe"
        >
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-sage-pale overflow-hidden">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center shrink-0">
                  <BellRing className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-semibold text-gray-dark text-lg">
                    Stay connected
                  </h3>
                  <p className="text-sm text-gray-body mt-1">
                    {memorialName
                      ? `Get notified about ${memorialName}'s memorial`
                      : "Never miss an important date or moment"}
                  </p>
                </div>
              </div>

              {/* Notification type toggles */}
              <div className="mt-4 space-y-2">
                {NOTIFICATION_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleNotificationType(type.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      selectedTypes.includes(type.id)
                        ? "bg-sage-pale border-2 border-sage"
                        : "bg-gray-50 border-2 border-transparent"
                    }`}
                  >
                    <type.icon
                      className={`w-5 h-5 ${
                        selectedTypes.includes(type.id)
                          ? "text-sage-dark"
                          : "text-gray-400"
                      }`}
                    />
                    <div className="flex-1 text-left">
                      <p
                        className={`text-sm font-medium ${
                          selectedTypes.includes(type.id)
                            ? "text-sage-dark"
                            : "text-gray-600"
                        }`}
                      >
                        {type.label}
                      </p>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedTypes.includes(type.id)
                          ? "border-sage bg-sage"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedTypes.includes(type.id) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Error message */}
              {error && (
                <p className="text-sm text-red-600 mt-3 text-center">{error}</p>
              )}

              {/* Action buttons */}
              <div className="mt-4 flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleDismiss}
                >
                  Not now
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={handleSubscribe}
                  disabled={isSubscribing || selectedTypes.length === 0}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {isSubscribing ? "Enabling..." : "Enable"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Simple hook to check push notification status
 */
export function usePushNotificationStatus() {
  const [status, setStatus] = useState<{
    supported: boolean;
    permission: PermissionState;
    subscribed: boolean;
  }>({
    supported: false,
    permission: "default",
    subscribed: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supported =
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;

    if (!supported) {
      setStatus({ supported: false, permission: "unsupported", subscribed: false });
      return;
    }

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setStatus({
          supported: true,
          permission: Notification.permission as PermissionState,
          subscribed: !!subscription,
        });
      } catch {
        setStatus({
          supported: true,
          permission: Notification.permission as PermissionState,
          subscribed: false,
        });
      }
    };

    checkSubscription();
  }, []);

  return status;
}

/**
 * Compact notification bell for header/nav
 */
export function NotificationBell({ memorialId }: { memorialId?: string }) {
  const [showOptIn, setShowOptIn] = useState(false);
  const status = usePushNotificationStatus();

  if (!status.supported) return null;

  if (status.subscribed) {
    return (
      <button
        className="relative p-2 text-sage hover:text-sage-dark transition-colors"
        aria-label="Notifications enabled"
      >
        <BellRing className="w-5 h-5" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowOptIn(true)}
        className="relative p-2 text-gray-400 hover:text-sage transition-colors"
        aria-label="Enable notifications"
      >
        <Bell className="w-5 h-5" />
      </button>

      {/* Modal opt-in */}
      <AnimatePresence>
        {showOptIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowOptIn(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <PushNotificationOptIn
                memorialId={memorialId}
                variant="banner"
                onDismiss={() => setShowOptIn(false)}
                onSubscribe={() => setShowOptIn(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
