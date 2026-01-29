import { NextRequest, NextResponse } from "next/server";
import { optionalAuth } from "@/lib/supabase/server";

// Demo mode
const DEMO_MODE = !process.env.DATABASE_URL;

export async function POST(request: NextRequest) {
  try {
    // Get current user (required for claim requests)
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to request access to a memorial" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { memorialId, relationship, message, proofDescription } = body;

    // Validate required fields
    if (!memorialId) {
      return NextResponse.json(
        { error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    if (!relationship) {
      return NextResponse.json(
        { error: "Relationship is required" },
        { status: 400 }
      );
    }

    if (!message || message.length < 20) {
      return NextResponse.json(
        { error: "Please provide a message of at least 20 characters" },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      // In demo mode, just return a success response
      return NextResponse.json({
        success: true,
        message: "Access request submitted successfully (Demo Mode)",
        claimRequest: {
          id: `demo-claim-${Date.now()}`,
          memorialId,
          relationship,
          message,
          proofDescription,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      });
    }

    // TODO: Implement actual database operations with Prisma
    // const claimRequest = await prisma.memorialClaimRequest.create({
    //   data: {
    //     memorialId,
    //     requestedBy: user.id,
    //     relationship,
    //     message,
    //     proofDescription,
    //   },
    // });

    // TODO: Send notification to memorial owner
    // await sendClaimRequestNotification(claimRequest);

    return NextResponse.json({
      success: true,
      message: "Access request submitted successfully",
      // claimRequest,
    });
  } catch (error) {
    console.error("Error creating claim request:", error);
    return NextResponse.json(
      { error: "Failed to submit access request" },
      { status: 500 }
    );
  }
}

// GET - Fetch claim requests for a memorial (for owners)
export async function GET(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to view claim requests" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const memorialId = searchParams.get("memorialId");

    if (!memorialId) {
      return NextResponse.json(
        { error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      // Return demo claim requests
      return NextResponse.json({
        claimRequests: [
          {
            id: "demo-claim-1",
            memorialId,
            requestedBy: "demo-user-1",
            requesterName: "Sarah Smith",
            requesterEmail: "sarah@example.com",
            relationship: "Daughter",
            message:
              "This is my father. I have many photos and stories I'd like to add to his memorial.",
            proofDescription:
              "I can provide birth certificate and family photos",
            status: "pending",
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          },
        ],
      });
    }

    // TODO: Implement actual database query
    // Verify user owns the memorial before showing claim requests
    // const memorial = await prisma.memorial.findUnique({
    //   where: { id: memorialId },
    // });
    //
    // if (memorial?.userId !== user.id) {
    //   return NextResponse.json(
    //     { error: "You don't have permission to view these requests" },
    //     { status: 403 }
    //   );
    // }
    //
    // const claimRequests = await prisma.memorialClaimRequest.findMany({
    //   where: { memorialId },
    //   include: { requester: true },
    //   orderBy: { createdAt: 'desc' },
    // });

    return NextResponse.json({
      claimRequests: [],
    });
  } catch (error) {
    console.error("Error fetching claim requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch claim requests" },
      { status: 500 }
    );
  }
}
