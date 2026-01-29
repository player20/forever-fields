import { NextRequest, NextResponse } from "next/server";
import { optionalAuth } from "@/lib/supabase/server";

// Demo mode
const DEMO_MODE = !process.env.DATABASE_URL;

// PATCH - Approve or reject a claim request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to review claim requests" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const { action, reviewNotes } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      // In demo mode, just return a success response
      return NextResponse.json({
        success: true,
        message: `Claim request ${action}d successfully (Demo Mode)`,
        claimRequest: {
          id,
          status: action === "approve" ? "approved" : "rejected",
          reviewedAt: new Date().toISOString(),
          reviewNotes,
        },
      });
    }

    // TODO: Implement actual database operations with Prisma
    // 1. Verify user owns the memorial
    // const claimRequest = await prisma.memorialClaimRequest.findUnique({
    //   where: { id },
    //   include: { memorial: true },
    // });
    //
    // if (claimRequest?.memorial.userId !== user.id) {
    //   return NextResponse.json(
    //     { error: "You don't have permission to review this request" },
    //     { status: 403 }
    //   );
    // }
    //
    // 2. Update claim request status
    // const updatedRequest = await prisma.memorialClaimRequest.update({
    //   where: { id },
    //   data: {
    //     status: action === "approve" ? "approved" : "rejected",
    //     reviewedBy: user.id,
    //     reviewedAt: new Date(),
    //     reviewNotes,
    //   },
    // });
    //
    // 3. If approved, add user as collaborator
    // if (action === "approve") {
    //   await prisma.collaborator.create({
    //     data: {
    //       memorialId: claimRequest.memorialId,
    //       userId: claimRequest.requestedBy,
    //       role: "editor",
    //       acceptedAt: new Date(),
    //     },
    //   });
    //
    //   // Add to verified users
    //   await prisma.memorial.update({
    //     where: { id: claimRequest.memorialId },
    //     data: {
    //       verifiedByUsers: {
    //         push: claimRequest.requestedBy,
    //       },
    //     },
    //   });
    // }
    //
    // 4. Send notification to requester
    // await sendClaimDecisionNotification(updatedRequest);

    return NextResponse.json({
      success: true,
      message: `Claim request ${action}d successfully`,
    });
  } catch (error) {
    console.error("Error processing claim request:", error);
    return NextResponse.json(
      { error: "Failed to process claim request" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a claim request (by the requester)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to cancel a claim request" },
        { status: 401 }
      );
    }

    const { id: _id } = await params;

    if (DEMO_MODE) {
      return NextResponse.json({
        success: true,
        message: "Claim request cancelled (Demo Mode)",
      });
    }

    // TODO: Implement actual database operations
    // const claimRequest = await prisma.memorialClaimRequest.findUnique({
    //   where: { id },
    // });
    //
    // if (claimRequest?.requestedBy !== user.id) {
    //   return NextResponse.json(
    //     { error: "You can only cancel your own requests" },
    //     { status: 403 }
    //   );
    // }
    //
    // await prisma.memorialClaimRequest.delete({
    //   where: { id },
    // });

    return NextResponse.json({
      success: true,
      message: "Claim request cancelled",
    });
  } catch (error) {
    console.error("Error cancelling claim request:", error);
    return NextResponse.json(
      { error: "Failed to cancel claim request" },
      { status: 500 }
    );
  }
}
