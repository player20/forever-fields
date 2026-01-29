import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Check if demo mode is enabled
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Demo mode
    if (isDemoMode) {
      return NextResponse.json({
        id,
        title: "Demo Time Capsule",
        message: "This is a demo time capsule message.",
        recipientName: "Demo Recipient",
        status: "scheduled",
        unlockDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    // Production - require auth
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch from database
    return NextResponse.json(
      { error: "Not implemented" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error fetching time capsule:", error);
    return NextResponse.json(
      { error: "Failed to fetch time capsule" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Demo mode
    if (isDemoMode) {
      return NextResponse.json({
        id,
        ...body,
        updatedAt: new Date().toISOString(),
      });
    }

    // Production - require auth
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Not implemented" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error updating time capsule:", error);
    return NextResponse.json(
      { error: "Failed to update time capsule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Demo mode
    if (isDemoMode) {
      return NextResponse.json({ success: true, deletedId: id });
    }

    // Production - require auth
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Not implemented" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error deleting time capsule:", error);
    return NextResponse.json(
      { error: "Failed to delete time capsule" },
      { status: 500 }
    );
  }
}
