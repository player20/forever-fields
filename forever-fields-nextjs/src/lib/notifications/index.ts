// In-App Notification Service
// Helper functions for creating notifications

import { DEMO_MODE } from "@/lib/constants";

// Notification types matching the schema
export type NotificationType =
  | "ANNIVERSARY_BIRTH"
  | "ANNIVERSARY_DEATH"
  | "NEW_GUESTBOOK_ENTRY"
  | "NEW_STORY"
  | "NEW_PHOTO"
  | "NEW_VIDEO"
  | "CANDLE_LIT"
  | "TIME_CAPSULE_OPENED"
  | "MEMORIAL_VIEW_MILESTONE"
  | "DONATION_RECEIVED"
  | "COLLABORATOR_INVITE"
  | "CLAIM_REQUEST"
  | "SYSTEM_ANNOUNCEMENT";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  linkText?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create an in-app notification for a user
 * This should be called from server-side code
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<{ success: boolean; error?: string }> {
  if (DEMO_MODE) {
    console.log("[Notification] Demo mode - notification logged:", params);
    return { success: true };
  }

  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (!internalSecret) {
    console.warn("[Notification] INTERNAL_API_SECRET not configured");
    return { success: false, error: "Internal API not configured" };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": internalSecret,
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || "Failed to create notification" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Notification] Create error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Notification templates for common events
 */
export const notificationTemplates = {
  candleLit: (
    userId: string,
    memorialName: string,
    lighterName: string,
    memorialUrl: string
  ): CreateNotificationParams => ({
    userId,
    type: "CANDLE_LIT",
    title: "Candle Lit",
    message: `${lighterName} lit a candle for ${memorialName}`,
    linkUrl: memorialUrl,
    linkText: "View Memorial",
    metadata: { lighterName },
  }),

  memoryShared: (
    userId: string,
    memorialName: string,
    authorName: string,
    memorialUrl: string
  ): CreateNotificationParams => ({
    userId,
    type: "NEW_STORY",
    title: "New Memory Shared",
    message: `${authorName} shared a memory about ${memorialName}`,
    linkUrl: `${memorialUrl}?tab=memories`,
    linkText: "Read Memory",
    metadata: { authorName },
  }),

  photoAdded: (
    userId: string,
    memorialName: string,
    uploaderName: string,
    memorialUrl: string
  ): CreateNotificationParams => ({
    userId,
    type: "NEW_PHOTO",
    title: "New Photo Added",
    message: `${uploaderName} added a photo to ${memorialName}'s memorial`,
    linkUrl: `${memorialUrl}?tab=photos`,
    linkText: "View Photo",
    metadata: { uploaderName },
  }),

  guestbookEntry: (
    userId: string,
    memorialName: string,
    authorName: string,
    memorialUrl: string
  ): CreateNotificationParams => ({
    userId,
    type: "NEW_GUESTBOOK_ENTRY",
    title: "New Guestbook Entry",
    message: `${authorName} signed the guestbook for ${memorialName}`,
    linkUrl: `${memorialUrl}?tab=guestbook`,
    linkText: "View Entry",
    metadata: { authorName },
  }),

  anniversaryReminder: (
    userId: string,
    memorialName: string,
    eventType: "birth" | "death",
    daysUntil: number,
    memorialUrl: string
  ): CreateNotificationParams => ({
    userId,
    type: eventType === "birth" ? "ANNIVERSARY_BIRTH" : "ANNIVERSARY_DEATH",
    title: "Anniversary Reminder",
    message:
      daysUntil === 0
        ? eventType === "birth"
          ? `Today is ${memorialName}'s birthday`
          : `Today marks the anniversary of ${memorialName}'s passing`
        : eventType === "birth"
        ? `${memorialName}'s birthday is in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`
        : `The anniversary of ${memorialName}'s passing is in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
    linkUrl: memorialUrl,
    linkText: "Visit Memorial",
    metadata: { eventType, daysUntil },
  }),

  timeCapsuleReady: (
    userId: string,
    memorialName: string,
    capsuleTitle: string,
    memorialUrl: string
  ): CreateNotificationParams => ({
    userId,
    type: "TIME_CAPSULE_OPENED",
    title: "Time Capsule Ready",
    message: `A message from ${memorialName} is now available: "${capsuleTitle}"`,
    linkUrl: memorialUrl,
    linkText: "Open Capsule",
    metadata: { capsuleTitle },
  }),

  collaboratorInvite: (
    userId: string,
    memorialName: string,
    inviterName: string,
    inviteUrl: string
  ): CreateNotificationParams => ({
    userId,
    type: "COLLABORATOR_INVITE",
    title: "Collaboration Invite",
    message: `${inviterName} invited you to contribute to ${memorialName}'s memorial`,
    linkUrl: inviteUrl,
    linkText: "View Invite",
    metadata: { inviterName },
  }),

  donationReceived: (
    userId: string,
    memorialName: string,
    donorName: string,
    amount: string,
    memorialUrl: string
  ): CreateNotificationParams => ({
    userId,
    type: "DONATION_RECEIVED",
    title: "Donation Received",
    message: `${donorName} donated ${amount} in memory of ${memorialName}`,
    linkUrl: memorialUrl,
    linkText: "View Donation",
    metadata: { donorName, amount },
  }),

  viewMilestone: (
    userId: string,
    memorialName: string,
    viewCount: number,
    memorialUrl: string
  ): CreateNotificationParams => ({
    userId,
    type: "MEMORIAL_VIEW_MILESTONE",
    title: "View Milestone!",
    message: `${memorialName}'s memorial has reached ${viewCount.toLocaleString()} views`,
    linkUrl: memorialUrl,
    linkText: "View Memorial",
    metadata: { viewCount },
  }),

  systemAnnouncement: (
    userId: string,
    title: string,
    message: string,
    linkUrl?: string,
    linkText?: string
  ): CreateNotificationParams => ({
    userId,
    type: "SYSTEM_ANNOUNCEMENT",
    title,
    message,
    linkUrl,
    linkText,
  }),
};
