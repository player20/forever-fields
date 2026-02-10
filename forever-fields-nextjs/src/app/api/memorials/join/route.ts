import { NextRequest, NextResponse } from "next/server";
import { DEMO_MODE, DEMO_USER } from "@/lib/constants";

// Demo invite codes for testing
const DEMO_INVITE_CODES: Record<string, { memorialId: string; slug: string; role: string }> = {
  "ABC123": { memorialId: "demo-memorial-1", slug: "margaret-johnson", role: "editor" },
  "XYZ789": { memorialId: "demo-memorial-2", slug: "grandma-rose", role: "viewer" },
  "FAM456": { memorialId: "demo-memorial-3", slug: "uncle-john", role: "editor" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    const upperCode = inviteCode.toUpperCase().trim();

    // Demo mode - check against demo codes
    if (DEMO_MODE) {
      const invite = DEMO_INVITE_CODES[upperCode];

      if (!invite) {
        return NextResponse.json(
          { error: "Invalid invite code. Please check and try again." },
          { status: 404 }
        );
      }

      // In demo mode, simulate successful join
      return NextResponse.json({
        success: true,
        memorial: {
          id: invite.memorialId,
          slug: invite.slug,
        },
        role: invite.role,
        message: `You have been added as ${invite.role} to this memorial.`,
      });
    }

    // Production mode - query database for invite code
    // TODO: Implement actual database lookup for invite codes
    // This would check the memorial_invites table and add user to memorial_collaborators

    return NextResponse.json(
      { error: "Invite codes are not yet enabled in production" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Join memorial error:", error);
    return NextResponse.json(
      { error: "Failed to join memorial" },
      { status: 500 }
    );
  }
}
