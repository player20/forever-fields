import { NextResponse } from "next/server";
import { optionalAuth } from "@/lib/supabase/server";

// Check if demo mode is enabled
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Demo mode - allow opening
    if (isDemoMode) {
      return NextResponse.json({
        success: true,
        capsule: {
          id,
          status: "opened",
          openedAt: new Date().toISOString(),
        },
      });
    }

    // Production - use optional auth (capsule recipient may not be logged in)
    const { user: _user } = await optionalAuth();

    // In production, we would:
    // 1. Fetch the capsule by ID
    // 2. Check if unlock date has passed
    // 3. Update status to "opened"
    // 4. Record openedAt timestamp
    // 5. Optionally notify the creator

    return NextResponse.json(
      { error: "Not implemented" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error opening time capsule:", error);
    return NextResponse.json(
      { error: "Failed to open time capsule" },
      { status: 500 }
    );
  }
}
