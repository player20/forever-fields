// Voice Notes API
// Submit and retrieve voice recordings for memorials

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, optionalAuth, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Demo voice notes store
const demoVoiceNotes: Map<string, {
  id: string;
  memorialId: string;
  url: string;
  duration: number;
  authorName: string;
  status: string;
  createdAt: string;
}[]> = new Map();

// GET /api/voice-notes - Get voice notes for a memorial
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memorialId = searchParams.get("memorialId");

  if (!memorialId) {
    return NextResponse.json(
      { error: "Memorial ID is required" },
      { status: 400 }
    );
  }

  if (DEMO_MODE) {
    const notes = demoVoiceNotes.get(memorialId) || [];
    return NextResponse.json({
      voiceNotes: notes.filter((n) => n.status === "approved"),
    });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get approved voice notes
    const { data: voiceNotes, error } = await supabase
      .from("voice_notes")
      .select("*")
      .eq("memorial_id", memorialId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching voice notes:", error);
      return NextResponse.json(
        { error: "Failed to fetch voice notes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ voiceNotes: voiceNotes || [] });
  } catch (error) {
    console.error("Voice notes fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/voice-notes - Submit a new voice note
export async function POST(request: NextRequest) {
  const { user } = await optionalAuth();

  try {
    const formData = await request.formData();
    const memorialId = formData.get("memorialId") as string;
    const audio = formData.get("audio") as File | null;
    const authorName = (formData.get("authorName") as string) || "Anonymous";
    const duration = parseInt((formData.get("duration") as string) || "0");

    if (!memorialId) {
      return NextResponse.json(
        { error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    if (!audio) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!audio.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an audio file." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (audio.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      // Simulate upload and storage
      const voiceNote = {
        id: `voice-${Date.now()}`,
        memorialId,
        url: URL.createObjectURL(audio),
        duration,
        authorName,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const existing = demoVoiceNotes.get(memorialId) || [];
      existing.push(voiceNote);
      demoVoiceNotes.set(memorialId, existing);

      return NextResponse.json({
        success: true,
        message: "Voice note submitted for review",
        voiceNote: { id: voiceNote.id },
      });
    }

    const supabase = await createServerSupabaseClient();

    // Upload audio to storage
    const fileName = `voice-notes/${memorialId}/${Date.now()}-${audio.name}`;
    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("memorial-media")
      .upload(fileName, buffer, {
        contentType: audio.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload audio" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("memorial-media")
      .getPublicUrl(uploadData.path);

    // Create pending item for moderation
    const { data: pendingItem, error: pendingError } = await supabase
      .from("pending_items")
      .insert({
        memorial_id: memorialId,
        type: "voice_note",
        status: "pending",
        submitted_by: user?.id || null,
        data_json: {
          url: urlData.publicUrl,
          fileName: uploadData.path,
          duration,
          authorName,
          submittedAt: new Date().toISOString(),
          userId: user?.id || null,
        },
      })
      .select()
      .single();

    if (pendingError) {
      console.error("Pending item error:", pendingError);
      return NextResponse.json(
        { error: "Failed to submit voice note" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Voice note submitted for review. It will appear after approval.",
      pendingItemId: pendingItem.id,
    });
  } catch (error) {
    console.error("Voice note submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/voice-notes - Delete a voice note (owner only)
export async function DELETE(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const voiceNoteId = searchParams.get("id");

  if (!voiceNoteId) {
    return NextResponse.json(
      { error: "Voice note ID is required" },
      { status: 400 }
    );
  }

  if (DEMO_MODE) {
    // Remove from all memorials
    for (const [memorialId, notes] of demoVoiceNotes.entries()) {
      const filtered = notes.filter((n) => n.id !== voiceNoteId);
      demoVoiceNotes.set(memorialId, filtered);
    }
    return NextResponse.json({ success: true });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get voice note to verify ownership
    const { data: voiceNote, error: fetchError } = await supabase
      .from("voice_notes")
      .select("*, memorials!inner(user_id)")
      .eq("id", voiceNoteId)
      .single();

    if (fetchError || !voiceNote) {
      return NextResponse.json(
        { error: "Voice note not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (voiceNote.memorials.user_id !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this voice note" },
        { status: 403 }
      );
    }

    // Delete the voice note
    const { error: deleteError } = await supabase
      .from("voice_notes")
      .delete()
      .eq("id", voiceNoteId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete voice note" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Voice note delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
