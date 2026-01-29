import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Check if demo mode is enabled
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Demo capsules for demo mode
const DEMO_CAPSULES = [
  {
    id: "demo-1",
    title: "For Your 18th Birthday",
    message: "My dearest grandchild, by the time you read this, you'll be turning 18. I want you to know how proud I am of the person you're becoming. Always remember: be kind, be brave, and follow your heart. I love you more than words can say. - Grandma",
    recipientName: "Emma",
    recipientEmail: null,
    unlockDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    status: "scheduled",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    memorialId: null,
  },
  {
    id: "demo-2",
    title: "Wedding Day Wishes",
    message: "Congratulations on your wedding day! I always knew this day would come. Remember what I told you about love - it's patient, it's kind, and it grows stronger every day. Cherish each other always.",
    recipientName: "Michael",
    recipientEmail: null,
    unlockDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: "delivered",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
    memorialId: null,
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memorialId = searchParams.get("memorialId");

    // Demo mode - return demo data
    if (isDemoMode) {
      const filtered = memorialId
        ? DEMO_CAPSULES.filter((c) => c.memorialId === memorialId)
        : DEMO_CAPSULES;
      return NextResponse.json(filtered);
    }

    // Production mode - require auth
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch time capsules from database
    // Note: This requires the Prisma client to be generated
    // For now, return empty array in production
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching time capsules:", error);
    return NextResponse.json(
      { error: "Failed to fetch time capsules" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, recipientName, recipientEmail, unlockDate, memorialId } = body;

    // Validate required fields
    if (!title || !message || !recipientName || !unlockDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Demo mode - return mock created capsule
    if (isDemoMode) {
      const newCapsule = {
        id: `capsule-${Date.now()}`,
        title,
        message,
        recipientName,
        recipientEmail: recipientEmail || null,
        unlockDate: new Date(unlockDate).toISOString(),
        status: "scheduled",
        createdAt: new Date().toISOString(),
        memorialId: memorialId || null,
      };
      return NextResponse.json(newCapsule, { status: 201 });
    }

    // Production mode - require auth
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create time capsule in database
    // Note: This requires the Prisma client to be generated
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error creating time capsule:", error);
    return NextResponse.json(
      { error: "Failed to create time capsule" },
      { status: 500 }
    );
  }
}
