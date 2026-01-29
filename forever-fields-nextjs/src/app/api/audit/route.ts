import { NextRequest, NextResponse } from "next/server";
import { optionalAuth } from "@/lib/supabase/server";
import {
  getAuditTrail,
  exportAuditLog,
  getAuditStats,
  AuditEventType,
} from "@/lib/audit";

// Demo mode
const DEMO_MODE = !process.env.DATABASE_URL;

/**
 * GET /api/audit - Get audit trail for a memorial
 *
 * Query params:
 * - memorialId: Required memorial ID
 * - userId: Optional filter by user
 * - eventTypes: Optional comma-separated list of event types
 * - startDate: Optional start date (ISO string)
 * - endDate: Optional end date (ISO string)
 * - format: Optional "json" or "csv" for export
 * - limit: Optional limit (default 100)
 * - offset: Optional offset for pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to view audit logs" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const memorialId = searchParams.get("memorialId");
    const userId = searchParams.get("userId");
    const eventTypesParam = searchParams.get("eventTypes");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const format = searchParams.get("format") as "json" | "csv" | null;
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Validate required params
    if (!memorialId) {
      return NextResponse.json(
        { error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    // TODO: Verify user has permission to view audit logs for this memorial
    // In production, check if user is owner, admin, or has appropriate role

    // Parse event types
    const eventTypes = eventTypesParam
      ? (eventTypesParam.split(",") as AuditEventType[])
      : undefined;

    // Parse dates
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    // If export format requested, return export
    if (format === "csv" || format === "json") {
      const exportData = await exportAuditLog(memorialId, format, {
        userId: userId || undefined,
        eventTypes,
        startDate,
        endDate,
        limit: 10000, // Higher limit for exports
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
    }

    // Get audit trail
    const logs = await getAuditTrail({
      memorialId,
      userId: userId || undefined,
      eventTypes,
      startDate,
      endDate,
      limit,
      offset,
    });

    // Get stats
    const stats = await getAuditStats(memorialId);

    return NextResponse.json({
      logs,
      stats,
      pagination: {
        offset,
        limit,
        total: logs.length, // In production, get actual total from DB
        hasMore: logs.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching audit trail:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit trail" },
      { status: 500 }
    );
  }
}
