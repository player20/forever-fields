// Push Notification Service
// Web Push API implementation for browser notifications

import { DEMO_MODE } from "@/lib/constants";

// Types
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export interface SendPushResult {
  success: boolean;
  error?: string;
}

// VAPID keys - generate with: npx web-push generate-vapid-keys
// Store these in environment variables:
// - NEXT_PUBLIC_VAPID_PUBLIC_KEY
// - VAPID_PRIVATE_KEY
// - VAPID_SUBJECT (e.g., "mailto:support@foreverfields.com")

/**
 * Get VAPID public key for client-side subscription
 */
export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  );
}

/**
 * Send push notification to a subscription
 * This should only be called on the server side
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushNotificationPayload
): Promise<SendPushResult> {
  if (DEMO_MODE) {
    console.log("[Push] Demo mode - notification logged:", {
      endpoint: subscription.endpoint.slice(0, 50) + "...",
      payload,
    });
    return { success: true };
  }

  if (!isPushConfigured()) {
    console.warn("[Push] VAPID keys not configured");
    return { success: false, error: "Push notifications not configured" };
  }

  try {
    // Dynamic import web-push (server-side only)
    // Use webpackIgnore to prevent bundling - package is optional
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let webpush: any;
    try {
      webpush = await import(/* webpackIgnore: true */ "web-push");
    } catch {
      console.warn("[Push] web-push package not installed - using demo mode");
      console.log("[Push] Would send notification:", {
        endpoint: subscription.endpoint.slice(0, 50) + "...",
        payload,
      });
      return { success: true };
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      JSON.stringify(payload)
    );

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Push] Send failed:", errorMessage);

    // Check for module not found (package not installed)
    if (errorMessage.includes("Cannot find module") || errorMessage.includes("MODULE_NOT_FOUND")) {
      console.warn("[Push] web-push package not installed");
      return { success: true }; // Graceful fallback
    }

    // Check for expired subscription
    if (errorMessage.includes("410") || errorMessage.includes("expired")) {
      return { success: false, error: "subscription_expired" };
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Send push notification to multiple subscriptions
 */
export async function sendBulkPushNotifications(
  subscriptions: PushSubscriptionData[],
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; expired: string[] }> {
  const results = {
    sent: 0,
    failed: 0,
    expired: [] as string[],
  };

  const promises = subscriptions.map(async (sub) => {
    const result = await sendPushNotification(sub, payload);
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      if (result.error === "subscription_expired") {
        results.expired.push(sub.endpoint);
      }
    }
  });

  await Promise.all(promises);

  return results;
}

/**
 * Predefined notification templates
 */
export const pushTemplates = {
  candleLit: (
    memorialName: string,
    lighterName: string,
    memorialUrl: string
  ): PushNotificationPayload => ({
    title: "Candle Lit",
    body: `${lighterName} lit a candle for ${memorialName}`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    tag: "candle-lit",
    data: { url: memorialUrl },
    actions: [
      { action: "view", title: "View Memorial" },
    ],
  }),

  memoryShared: (
    memorialName: string,
    authorName: string,
    memorialUrl: string
  ): PushNotificationPayload => ({
    title: "New Memory Shared",
    body: `${authorName} shared a memory about ${memorialName}`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    tag: "memory-shared",
    data: { url: memorialUrl },
    actions: [
      { action: "view", title: "Read Memory" },
    ],
  }),

  anniversaryReminder: (
    memorialName: string,
    eventType: string,
    daysUntil: number,
    memorialUrl: string
  ): PushNotificationPayload => ({
    title: `Remembering ${memorialName}`,
    body: daysUntil === 0
      ? `Today is ${memorialName}'s ${eventType}`
      : `${memorialName}'s ${eventType} is in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    tag: "anniversary",
    data: { url: memorialUrl },
    requireInteraction: true,
    actions: [
      { action: "view", title: "Visit Memorial" },
      { action: "light", title: "Light a Candle" },
    ],
  }),

  collaboratorInvite: (
    memorialName: string,
    inviterName: string,
    inviteUrl: string
  ): PushNotificationPayload => ({
    title: "Memorial Collaboration Invite",
    body: `${inviterName} invited you to contribute to ${memorialName}'s memorial`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    tag: "invite",
    data: { url: inviteUrl },
    requireInteraction: true,
    actions: [
      { action: "accept", title: "Accept" },
      { action: "view", title: "View Details" },
    ],
  }),

  timeCapsuleReady: (
    memorialName: string,
    capsuleTitle: string,
    memorialUrl: string
  ): PushNotificationPayload => ({
    title: "Time Capsule Ready",
    body: `A message from ${memorialName} is now available: "${capsuleTitle}"`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    tag: "time-capsule",
    data: { url: memorialUrl },
    requireInteraction: true,
    actions: [
      { action: "open", title: "Open Capsule" },
    ],
  }),

  donationReceived: (
    memorialName: string,
    donorName: string,
    amount: string,
    memorialUrl: string
  ): PushNotificationPayload => ({
    title: "Donation Received",
    body: `${donorName} donated ${amount} in memory of ${memorialName}`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    tag: "donation",
    data: { url: memorialUrl },
    actions: [
      { action: "view", title: "View Donation" },
    ],
  }),
};
