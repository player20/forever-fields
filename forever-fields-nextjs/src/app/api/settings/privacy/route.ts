/**
 * Privacy Settings API
 *
 * Get and update privacy settings.
 *
 * Endpoints:
 * - GET  /api/settings/privacy - Get settings
 * - PATCH /api/settings/privacy - Update settings
 *
 * @module api/settings/privacy
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Default privacy settings
const DEFAULT_SETTINGS = {
  showProfilePublicly: false,
  allowSearchEngines: false,
  shareActivityWithFamily: true,
};

// Demo privacy store
const demoPrivacy: Map<string, typeof DEFAULT_SETTINGS> = new Map();

// GET /api/settings/privacy - Get settings
export async function GET() {
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (DEMO_MODE) {
    const settings = demoPrivacy.get(user.id) || DEFAULT_SETTINGS;
    return NextResponse.json({ settings });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get from user_preferences table or user metadata
    const { data: userPrefs } = await supabase
      .from("user_preferences")
      .select("privacy_settings")
      .eq("user_id", user.id)
      .single();

    if (userPrefs?.privacy_settings) {
      return NextResponse.json({
        settings: {
          ...DEFAULT_SETTINGS,
          ...userPrefs.privacy_settings,
        },
      });
    }

    // Fall back to user metadata
    const privacySettings = user.user_metadata?.privacy_settings;
    return NextResponse.json({
      settings: privacySettings
        ? { ...DEFAULT_SETTINGS, ...privacySettings }
        : DEFAULT_SETTINGS,
    });
  } catch (error) {
    console.error("Get privacy settings error:", error);
    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  }
}

// PATCH /api/settings/privacy - Update settings
export async function PATCH(request: NextRequest) {
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const settings = body as Partial<typeof DEFAULT_SETTINGS>;

    // Validate keys
    const validKeys = Object.keys(DEFAULT_SETTINGS);
    const invalidKeys = Object.keys(settings).filter((k) => !validKeys.includes(k));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Invalid setting keys: ${invalidKeys.join(", ")}` },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      const existing = demoPrivacy.get(user.id) || DEFAULT_SETTINGS;
      const updated = { ...existing, ...settings };
      demoPrivacy.set(user.id, updated);
      return NextResponse.json({
        success: true,
        message: "Privacy settings saved",
        settings: updated,
      });
    }

    const supabase = await createServerSupabaseClient();

    // Try to update user_preferences table
    const { error: upsertError } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        privacy_settings: settings,
        updated_at: new Date().toISOString(),
      } as never, {
        onConflict: "user_id",
      });

    if (upsertError) {
      // Fall back to storing in user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          privacy_settings: settings,
        },
      });

      if (metadataError) {
        console.error("Update privacy error:", metadataError);
        return NextResponse.json(
          { error: "Failed to save settings" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Privacy settings saved",
      settings,
    });
  } catch (error) {
    console.error("Update privacy error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
