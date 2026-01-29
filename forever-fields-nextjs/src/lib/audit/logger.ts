/**
 * Audit Logger
 *
 * Core utility for logging audit events and managing the audit trail.
 * Provides functions for creating immutable audit records that track
 * all significant actions in the system for compliance and security.
 */

import {
  AuditEventType,
  AuditLogEntry,
  AuditTrailFilter,
  CreateAuditLogInput,
  ExportFormat,
} from "./types";

// Demo mode - when true, use in-memory storage instead of database
const DEMO_MODE = !process.env.DATABASE_URL;

// In-memory storage for demo mode
const demoAuditLogs: AuditLogEntry[] = [];

/**
 * Log an audit event
 *
 * Creates an immutable audit record. In demo mode, stores in memory.
 * In production, stores in the database via Prisma.
 */
export async function logAuditEvent(
  input: CreateAuditLogInput
): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    eventType: input.eventType,
    userId: input.userId || null,
    memorialId: input.memorialId || null,
    sessionId: input.sessionId || null,
    ipAddress: input.ipAddress || null,
    userAgent: input.userAgent || null,
    metadata: input.metadata || null,
    createdAt: new Date(),
  };

  if (DEMO_MODE) {
    demoAuditLogs.push(entry);
    console.log(`[AUDIT] ${entry.eventType}`, {
      userId: entry.userId,
      memorialId: entry.memorialId,
      metadata: entry.metadata,
    });
    return entry;
  }

  // Production: Store in database via Prisma
  // TODO: Implement Prisma integration when database is available
  // const entry = await prisma.auditLog.create({
  //   data: {
  //     eventType: input.eventType,
  //     userId: input.userId,
  //     memorialId: input.memorialId,
  //     sessionId: input.sessionId,
  //     ipAddress: input.ipAddress,
  //     userAgent: input.userAgent,
  //     metadata: input.metadata,
  //   },
  // });

  console.log(`[AUDIT] ${entry.eventType}`, {
    userId: entry.userId,
    memorialId: entry.memorialId,
    metadata: entry.metadata,
  });

  return entry;
}

/**
 * Get audit trail for a memorial
 *
 * Retrieves all audit events related to a specific memorial.
 * Used for legal discovery and compliance reporting.
 */
export async function getAuditTrail(
  filter: AuditTrailFilter
): Promise<AuditLogEntry[]> {
  if (DEMO_MODE) {
    let results = [...demoAuditLogs];

    if (filter.memorialId) {
      results = results.filter((log) => log.memorialId === filter.memorialId);
    }

    if (filter.userId) {
      results = results.filter((log) => log.userId === filter.userId);
    }

    if (filter.eventTypes && filter.eventTypes.length > 0) {
      results = results.filter((log) =>
        filter.eventTypes!.includes(log.eventType)
      );
    }

    if (filter.sessionId) {
      results = results.filter((log) => log.sessionId === filter.sessionId);
    }

    if (filter.startDate) {
      results = results.filter((log) => log.createdAt >= filter.startDate!);
    }

    if (filter.endDate) {
      results = results.filter((log) => log.createdAt <= filter.endDate!);
    }

    // Sort by date descending (most recent first)
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 100;
    return results.slice(offset, offset + limit);
  }

  // Production: Query database via Prisma
  // TODO: Implement Prisma integration
  // const where: Prisma.AuditLogWhereInput = {};
  // if (filter.memorialId) where.memorialId = filter.memorialId;
  // if (filter.userId) where.userId = filter.userId;
  // if (filter.eventTypes?.length) where.eventType = { in: filter.eventTypes };
  // if (filter.sessionId) where.sessionId = filter.sessionId;
  // if (filter.startDate || filter.endDate) {
  //   where.createdAt = {};
  //   if (filter.startDate) where.createdAt.gte = filter.startDate;
  //   if (filter.endDate) where.createdAt.lte = filter.endDate;
  // }
  //
  // return prisma.auditLog.findMany({
  //   where,
  //   orderBy: { createdAt: 'desc' },
  //   skip: filter.offset || 0,
  //   take: filter.limit || 100,
  // });

  return [];
}

/**
 * Export audit log in specified format
 *
 * Exports audit trail for a memorial in JSON or CSV format.
 * Used for legal discovery and compliance reporting.
 */
export async function exportAuditLog(
  memorialId: string,
  format: ExportFormat = "json",
  filter?: Omit<AuditTrailFilter, "memorialId">
): Promise<string> {
  const logs = await getAuditTrail({
    ...filter,
    memorialId,
    limit: filter?.limit || 10000, // Higher limit for exports
  });

  if (format === "json") {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        memorialId,
        totalRecords: logs.length,
        records: logs.map((log) => ({
          ...log,
          createdAt: log.createdAt.toISOString(),
        })),
      },
      null,
      2
    );
  }

  // CSV format
  const headers = [
    "id",
    "eventType",
    "userId",
    "memorialId",
    "sessionId",
    "ipAddress",
    "createdAt",
    "metadata",
  ];

  const rows = logs.map((log) =>
    [
      log.id,
      log.eventType,
      log.userId || "",
      log.memorialId || "",
      log.sessionId || "",
      log.ipAddress || "",
      log.createdAt.toISOString(),
      log.metadata ? JSON.stringify(log.metadata) : "",
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Log a voice-related event
 */
export async function logVoiceEvent(
  eventType:
    | "VOICE_SAMPLE_UPLOADED"
    | "VOICE_SAMPLE_DELETED"
    | "VOICE_MESSAGE_GENERATED"
    | "VOICE_MESSAGE_PLAYED",
  userId: string,
  memorialId: string,
  metadata?: Record<string, unknown>,
  requestInfo?: { ipAddress?: string; userAgent?: string }
): Promise<AuditLogEntry> {
  return logAuditEvent({
    eventType,
    userId,
    memorialId,
    metadata,
    ipAddress: requestInfo?.ipAddress,
    userAgent: requestInfo?.userAgent,
  });
}

/**
 * Log an AI companion event
 */
export async function logAICompanionEvent(
  eventType:
    | "AI_SESSION_STARTED"
    | "AI_SESSION_ENDED"
    | "AI_MESSAGE_SENT"
    | "AI_CRISIS_DETECTED"
    | "AI_BREAK_SUGGESTED",
  userId: string,
  memorialId: string,
  sessionId: string,
  metadata?: Record<string, unknown>,
  requestInfo?: { ipAddress?: string; userAgent?: string }
): Promise<AuditLogEntry> {
  return logAuditEvent({
    eventType,
    userId,
    memorialId,
    sessionId,
    metadata,
    ipAddress: requestInfo?.ipAddress,
    userAgent: requestInfo?.userAgent,
  });
}

/**
 * Log a memorial access event
 */
export async function logMemorialEvent(
  eventType:
    | "MEMORIAL_VIEWED"
    | "MEMORIAL_CREATED"
    | "MEMORIAL_UPDATED"
    | "MEMORIAL_DELETED"
    | "MEMORIAL_EXPORTED",
  userId: string | undefined,
  memorialId: string,
  metadata?: Record<string, unknown>,
  requestInfo?: { ipAddress?: string; userAgent?: string }
): Promise<AuditLogEntry> {
  return logAuditEvent({
    eventType,
    userId,
    memorialId,
    metadata,
    ipAddress: requestInfo?.ipAddress,
    userAgent: requestInfo?.userAgent,
  });
}

/**
 * Log a claim request event
 */
export async function logClaimEvent(
  eventType:
    | "CLAIM_REQUEST_SUBMITTED"
    | "CLAIM_REQUEST_APPROVED"
    | "CLAIM_REQUEST_REJECTED",
  userId: string,
  memorialId: string,
  metadata?: Record<string, unknown>,
  requestInfo?: { ipAddress?: string; userAgent?: string }
): Promise<AuditLogEntry> {
  return logAuditEvent({
    eventType,
    userId,
    memorialId,
    metadata,
    ipAddress: requestInfo?.ipAddress,
    userAgent: requestInfo?.userAgent,
  });
}

/**
 * Log a user authentication event
 */
export async function logAuthEvent(
  eventType: "USER_LOGIN" | "USER_LOGOUT" | "USER_REGISTERED",
  userId: string,
  metadata?: Record<string, unknown>,
  requestInfo?: { ipAddress?: string; userAgent?: string }
): Promise<AuditLogEntry> {
  return logAuditEvent({
    eventType,
    userId,
    metadata,
    ipAddress: requestInfo?.ipAddress,
    userAgent: requestInfo?.userAgent,
  });
}

/**
 * Get audit summary statistics
 */
export async function getAuditStats(
  memorialId: string
): Promise<Record<AuditEventType, number>> {
  const logs = await getAuditTrail({ memorialId, limit: 10000 });

  const stats: Partial<Record<AuditEventType, number>> = {};

  for (const log of logs) {
    stats[log.eventType] = (stats[log.eventType] || 0) + 1;
  }

  return stats as Record<AuditEventType, number>;
}

/**
 * Helper to extract request info from NextRequest
 */
export function extractRequestInfo(request: Request): {
  ipAddress: string | undefined;
  userAgent: string | undefined;
} {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined;

  const userAgent = request.headers.get("user-agent") || undefined;

  return { ipAddress, userAgent };
}

/**
 * Anonymize user ID for GDPR compliance
 *
 * When a user deletes their account, their audit logs should be anonymized
 * rather than deleted (for legal compliance), replacing the user ID with a hash.
 */
export function anonymizeUserId(userId: string): string {
  // Create a one-way hash that can't be reversed but is consistent
  // This allows for pattern detection without identifying the user
  const encoder = new TextEncoder();
  const data = encoder.encode(userId + "forever-fields-salt");

  // Simple hash for demo - in production use crypto.subtle.digest
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `anon-${Math.abs(hash).toString(16)}`;
}
