/**
 * Notification Settings API
 *
 * Get and update notification preferences.
 *
 * Endpoints:
 * - GET  /api/settings/notifications - Get preferences
 * - PATCH /api/settings/notifications - Update preferences
 *
 * @module api/settings/notifications
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Default notification preferences
const DEFAULT_PREFERENCES = {
  emailMemorialUpdates: true,
  emailNewCollaborators: true,
  emailWeeklyDigest: false,
  emailMarketingUpdates: false,
  pushCandles: true,
  pushGuestbook: true,
  pushMilestones: true,
};

// Demo preferences store
const demoPreferences: Map<string, typeof DEFAULT_PREFERENCES> = new Map();

// GET /api/settings/notifications - Get preferences
export async function GET() {
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (DEMO_MODE) {
    const prefs = demoPreferences.get(user.id) || DEFAULT_PREFERENCES;
    return NextResponse.json({ preferences: prefs });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get from user_preferences table or user metadata
    const { data: userPrefs } = await supabase
      .from("user_preferences")
      .select("notification_preferences")
      .eq("user_id", user.id)
      .single();

    if (userPrefs?.notification_preferences) {
      return NextResponse.json({
        preferences: {
          ...DEFAULT_PREFERENCES,
          ...userPrefs.notification_preferences,
        },
      });
    }

    // Fall back to user metadata
    const notificationPrefs = user.user_metadata?.notification_preferences;
    return NextResponse.json({
      preferences: notificationPrefs
        ? { ...DEFAULT_PREFERENCES, ...notificationPrefs }
        : DEFAULT_PREFERENCES,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    // Return defaults on error
    return NextResponse.json({ preferences: DEFAULT_PREFERENCES });
  }
}

// PATCH /api/settings/notifications - Update preferences
export async function PATCH(request: NextRequest) {
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const preferences = body as Partial<typeof DEFAULT_PREFERENCES>;

    // Validate keys
    const validKeys = Object.keys(DEFAULT_PREFERENCES);
    const invalidKeys = Object.keys(preferences).filter((k) => !validKeys.includes(k));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Invalid preference keys: ${invalidKeys.join(", ")}` },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      const existing = demoPreferences.get(user.id) || DEFAULT_PREFERENCES;
      const updated = { ...existing, ...preferences };
      demoPreferences.set(user.id, updated);
      return NextResponse.json({
        success: true,
        message: "Notification preferences saved",
        preferences: updated,
      });
    }

    const supabase = await createServerSupabaseClient();

    // Try to update user_preferences table
    const { error: upsertError } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        notification_preferences: preferences,
        updated_at: new Date().toISOString(),
      } as never, {
        onConflict: "user_id",
      });

    if (upsertError) {
      // Fall back to storing in user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          notification_preferences: preferences,
        },
      });

      if (metadataError) {
        console.error("Update notifications error:", metadataError);
        return NextResponse.json(
          { error: "Failed to save preferences" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notification preferences saved",
      preferences,
    });
  } catch (error) {
    console.error("Update notifications error:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
