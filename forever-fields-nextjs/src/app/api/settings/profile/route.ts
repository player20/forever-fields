/**
 * Profile Settings API
 *
 * Update user profile information (name, email).
 *
 * Endpoints:
 * - PATCH /api/settings/profile - Update profile
 *
 * @module api/settings/profile
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// PATCH /api/settings/profile - Update profile
export async function PATCH(request: NextRequest) {
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email } = body as {
      name?: string;
      email?: string;
    };

    if (DEMO_MODE) {
      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: user.id,
          email: email || user.email,
          name: name || user.user_metadata?.full_name,
        },
      });
    }

    const supabase = await createServerSupabaseClient();

    // Build update object
    const updates: {
      email?: string;
      data?: Record<string, unknown>;
    } = {};

    if (email && email !== user.email) {
      updates.email = email;
    }

    if (name) {
      // Parse name into first/last
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      updates.data = {
        first_name: firstName,
        last_name: lastName,
        full_name: name.trim(),
      };
    }

    // Update auth user
    const { data: authData, error: authError } = await supabase.auth.updateUser(updates);

    if (authError) {
      console.error("Auth update error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Also update users table if it exists
    if (name) {
      const nameParts = name.trim().split(/\s+/);
      await supabase
        .from("users")
        .update({
          first_name: nameParts[0] || "",
          last_name: nameParts.slice(1).join(" ") || "",
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", user.id);
    }

    return NextResponse.json({
      success: true,
      message: email && email !== user.email
        ? "Profile updated. Please check your new email for verification."
        : "Profile updated successfully",
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        name: authData.user?.user_metadata?.full_name,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
