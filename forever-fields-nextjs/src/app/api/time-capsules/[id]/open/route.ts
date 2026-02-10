import { NextResponse } from "next/server";
import { optionalAuth, createUntypedSupabaseClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sender";

// Check if demo mode is enabled
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Demo time capsules for testing
const DEMO_CAPSULES: Record<string, {
  id: string;
  title: string;
  message: string;
  unlock_date: string;
  status: string;
  media_urls: string[];
  voice_message_url: string | null;
  memorial: { id: string; first_name: string; last_name: string; slug: string };
  creator_user_id: string;
}> = {
  "demo-capsule-1": {
    id: "demo-capsule-1",
    title: "Happy Birthday Message",
    message: "Dearest grandchild, if you're reading this on your 18th birthday, know that I've always been so proud of you. Remember the summers we spent at the lake? Those are some of my most treasured memories. Live fully, love deeply, and never forget where you came from. With all my love, Grandma.",
    unlock_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday (already unlocked)
    status: "scheduled",
    media_urls: [],
    voice_message_url: null,
    memorial: { id: "demo-memorial-1", first_name: "Margaret", last_name: "Sullivan", slug: "margaret-rose-sullivan" },
    creator_user_id: "demo-user-123",
  },
  "demo-capsule-2": {
    id: "demo-capsule-2",
    title: "Wedding Day Wishes",
    message: "On your wedding day, I want you to know how much joy you've brought to our family...",
    unlock_date: new Date(Date.now() + 86400000 * 365).toISOString(), // Next year (locked)
    status: "scheduled",
    media_urls: [],
    voice_message_url: null,
    memorial: { id: "demo-memorial-1", first_name: "Margaret", last_name: "Sullivan", slug: "margaret-rose-sullivan" },
    creator_user_id: "demo-user-123",
  },
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Demo mode - use demo capsules
    if (isDemoMode) {
      const demoCapsule = DEMO_CAPSULES[id];

      if (!demoCapsule) {
        return NextResponse.json(
          { error: "Time capsule not found" },
          { status: 404 }
        );
      }

      // Check if already opened
      if (demoCapsule.status === "opened") {
        return NextResponse.json({
          success: true,
          capsule: { ...demoCapsule, status: "opened" },
          message: "Time capsule was already opened",
          contents: {
            message: demoCapsule.message,
            mediaUrls: demoCapsule.media_urls,
            voiceMessageUrl: demoCapsule.voice_message_url,
          },
        });
      }

      // Check if unlock date has passed
      const unlockDate = new Date(demoCapsule.unlock_date);
      const now = new Date();

      if (now < unlockDate) {
        const remainingDays = Math.ceil(
          (unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return NextResponse.json(
          {
            error: "Time capsule is not yet ready to open",
            unlockDate: demoCapsule.unlock_date,
            remainingDays,
          },
          { status: 403 }
        );
      }

      // Mark as opened in demo (doesn't persist)
      return NextResponse.json({
        success: true,
        capsule: {
          ...demoCapsule,
          status: "opened",
          opened_at: now.toISOString(),
        },
        contents: {
          message: demoCapsule.message,
          mediaUrls: demoCapsule.media_urls,
          voiceMessageUrl: demoCapsule.voice_message_url,
        },
      });
    }

    // Production - use database
    const { user } = await optionalAuth();
    const supabase = await createUntypedSupabaseClient();

    // 1. Fetch the capsule with memorial info
    const { data: capsule, error: fetchError } = await supabase
      .from("time_capsules")
      .select("*, memorial:memorials(id, slug, first_name, last_name)")
      .eq("id", id)
      .single();

    if (fetchError || !capsule) {
      return NextResponse.json(
        { error: "Time capsule not found" },
        { status: 404 }
      );
    }

    // 2. Check if already opened
    if (capsule.status === "opened") {
      return NextResponse.json({
        success: true,
        capsule,
        message: "Time capsule was already opened",
        contents: {
          message: capsule.message,
          mediaUrls: capsule.media_urls || [],
          voiceMessageUrl: capsule.voice_message_url,
        },
      });
    }

    // 3. Check if unlock date has passed
    const unlockDate = new Date(capsule.unlock_date);
    const now = new Date();

    if (now < unlockDate) {
      const remainingDays = Math.ceil(
        (unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return NextResponse.json(
        {
          error: "Time capsule is not yet ready to open",
          unlockDate: capsule.unlock_date,
          remainingDays,
        },
        { status: 403 }
      );
    }

    // 4. Update status to "opened"
    const { data: updatedCapsule, error: updateError } = await supabase
      .from("time_capsules")
      .update({
        status: "opened",
        opened_at: now.toISOString(),
        opened_by_user_id: user?.id || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating time capsule:", updateError);
      return NextResponse.json(
        { error: "Failed to open capsule" },
        { status: 500 }
      );
    }

    // 5. Notify the creator (if different from opener and we have their email)
    if (capsule.creator_user_id && capsule.creator_user_id !== user?.id) {
      // Fetch creator's email
      const { data: creator } = await supabase
        .from("users")
        .select("email, first_name")
        .eq("id", capsule.creator_user_id)
        .single();

      if (creator?.email) {
        const memorialName = capsule.memorial
          ? `${capsule.memorial.first_name} ${capsule.memorial.last_name}`
          : "your loved one";

        await sendEmail({
          to: creator.email,
          subject: `Time capsule for ${memorialName} has been opened`,
          template: "time-capsule-opened",
          data: {
            recipientName: creator.first_name || "Friend",
            capsuleTitle: capsule.title,
            memorialName,
            openedBy: user?.email || "A visitor",
            openedAt: now.toISOString(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      capsule: updatedCapsule,
      contents: {
        message: capsule.message,
        mediaUrls: capsule.media_urls || [],
        voiceMessageUrl: capsule.voice_message_url,
      },
    });
  } catch (error) {
    console.error("Error opening time capsule:", error);
    return NextResponse.json(
      { error: "Failed to open time capsule" },
      { status: 500 }
    );
  }
}
