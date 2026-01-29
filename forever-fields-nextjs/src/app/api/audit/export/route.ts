import { NextRequest, NextResponse } from "next/server";
import { optionalAuth } from "@/lib/supabase/server";
import { exportAuditLog, AuditEventType } from "@/lib/audit";

// Demo mode
const DEMO_MODE = !process.env.DATABASE_URL;

/**
 * POST /api/audit/export - Export audit trail for a memorial
 *
 * Body:
 * - memorialId: Required memorial ID
 * - format: "json" or "csv" (default: "json")
 * - userId: Optional filter by user
 * - eventTypes: Optional array of event types
 * - startDate: Optional start date (ISO string)
 * - endDate: Optional end date (ISO string)
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to export audit logs" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      memorialId,
      format = "json",
      userId,
      eventTypes,
      startDate,
      endDate,
    } = body;

    // Validate required params
    if (!memorialId) {
      return NextResponse.json(
        { error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    if (format !== "json" && format !== "csv") {
      return NextResponse.json(
        { error: "Format must be 'json' or 'csv'" },
        { status: 400 }
      );
    }

    // TODO: Verify user has permission to export audit logs for this memorial
    // In production, check if user is owner, admin, or has legal authority

    const exportData = await exportAuditLog(memorialId, format, {
      userId,
      eventTypes: eventTypes as AuditEventType[],
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: 100000, // High limit for exports
    });

    const contentType =
      format === "csv" ? "text/csv" : "application/json";
    const filename = `audit-log-${memorialId}-${new Date().toISOString().split("T")[0]}.${format}`;

    return new NextResponse(exportData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting audit trail:", error);
    return NextResponse.json(
      { error: "Failed to export audit trail" },
      { status: 500 }
    );
  }
}
