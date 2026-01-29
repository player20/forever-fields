/**
 * AI Companion Session Tracker
 *
 * Tracks AI companion sessions for safety monitoring and analytics.
 * Implements the balanced guardrails approach with gentle reminders.
 */

import { CrisisResult } from "./crisis-detection";
import { logAICompanionEvent } from "@/lib/audit";

// Demo mode
const DEMO_MODE = !process.env.DATABASE_URL;

// Session thresholds for reminders (balanced approach)
export const SESSION_THRESHOLDS = {
  // Time-based (minutes)
  breakReminderTime: 20,
  secondBreakReminderTime: 45,
  sessionWarningTime: 60,

  // Message-based
  breakReminderMessages: 15,
  secondBreakReminderMessages: 30,

  // Crisis-related
  maxCrisisEventsBeforeEscalation: 3,
};

export interface AISession {
  id: string;
  userId: string;
  memorialId: string;
  startedAt: Date;
  endedAt?: Date;
  messageCount: number;
  durationSeconds: number;
  crisisDetected: boolean;
  crisisKeywords: string[];
  crisisHandled: boolean;
  breakReminderShown: boolean;
  secondBreakReminderShown: boolean;
  resourcesShown: boolean;
  messages: SessionMessage[];
}

export interface SessionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  crisisResult?: CrisisResult;
}

// In-memory session storage for demo mode
const demoSessions: Map<string, AISession> = new Map();

/**
 * Start a new AI companion session
 */
export async function startSession(
  userId: string,
  memorialId: string,
  requestInfo?: { ipAddress?: string; userAgent?: string }
): Promise<AISession> {
  const session: AISession = {
    id: crypto.randomUUID(),
    userId,
    memorialId,
    startedAt: new Date(),
    messageCount: 0,
    durationSeconds: 0,
    crisisDetected: false,
    crisisKeywords: [],
    crisisHandled: false,
    breakReminderShown: false,
    secondBreakReminderShown: false,
    resourcesShown: false,
    messages: [],
  };

  if (DEMO_MODE) {
    demoSessions.set(session.id, session);
  }

  // Log session start
  await logAICompanionEvent(
    "AI_SESSION_STARTED",
    userId,
    memorialId,
    session.id,
    {},
    requestInfo
  );

  return session;
}

/**
 * End an AI companion session
 */
export async function endSession(
  sessionId: string,
  requestInfo?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;

  session.endedAt = new Date();
  session.durationSeconds = Math.floor(
    (session.endedAt.getTime() - session.startedAt.getTime()) / 1000
  );

  if (DEMO_MODE) {
    demoSessions.set(sessionId, session);
  }

  // Log session end
  await logAICompanionEvent(
    "AI_SESSION_ENDED",
    session.userId,
    session.memorialId,
    sessionId,
    {
      messageCount: session.messageCount,
      durationSeconds: session.durationSeconds,
      crisisDetected: session.crisisDetected,
    },
    requestInfo
  );
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<AISession | null> {
  if (DEMO_MODE) {
    return demoSessions.get(sessionId) || null;
  }

  // Production: Query database
  return null;
}

/**
 * Add a message to a session
 */
export async function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  crisisResult?: CrisisResult,
  requestInfo?: { ipAddress?: string; userAgent?: string }
): Promise<SessionMessage | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  const message: SessionMessage = {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date(),
    crisisResult,
  };

  session.messages.push(message);
  session.messageCount++;
  session.durationSeconds = Math.floor(
    (new Date().getTime() - session.startedAt.getTime()) / 1000
  );

  // Track crisis events
  if (crisisResult && crisisResult.tier > 0) {
    session.crisisDetected = true;
    session.crisisKeywords.push(...crisisResult.matchedPatterns);

    // Log crisis detection
    await logAICompanionEvent(
      "AI_CRISIS_DETECTED",
      session.userId,
      session.memorialId,
      sessionId,
      {
        tier: crisisResult.tier,
        patterns: crisisResult.matchedPatterns,
      },
      requestInfo
    );
  }

  if (DEMO_MODE) {
    demoSessions.set(sessionId, session);
  }

  // Log message (for audit trail, not content)
  await logAICompanionEvent(
    "AI_MESSAGE_SENT",
    session.userId,
    session.memorialId,
    sessionId,
    {
      role,
      messageNumber: session.messageCount,
      hasCrisisIndicator: crisisResult ? crisisResult.tier > 0 : false,
    },
    requestInfo
  );

  return message;
}

/**
 * Mark that break reminder was shown
 */
export async function markBreakReminderShown(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;

  if (!session.breakReminderShown) {
    session.breakReminderShown = true;
  } else {
    session.secondBreakReminderShown = true;
  }

  if (DEMO_MODE) {
    demoSessions.set(sessionId, session);
  }

  await logAICompanionEvent(
    "AI_BREAK_SUGGESTED",
    session.userId,
    session.memorialId,
    sessionId,
    {
      messageCount: session.messageCount,
      durationMinutes: Math.floor(session.durationSeconds / 60),
    }
  );
}

/**
 * Mark that crisis resources were shown
 */
export async function markResourcesShown(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;

  session.resourcesShown = true;

  if (DEMO_MODE) {
    demoSessions.set(sessionId, session);
  }
}

/**
 * Mark that crisis was handled (user acknowledged resources)
 */
export async function markCrisisHandled(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;

  session.crisisHandled = true;

  if (DEMO_MODE) {
    demoSessions.set(sessionId, session);
  }
}

/**
 * Check if session needs a break reminder
 */
export function shouldShowBreakReminder(session: AISession): boolean {
  const minutesElapsed = session.durationSeconds / 60;

  // First break reminder
  if (
    !session.breakReminderShown &&
    (minutesElapsed >= SESSION_THRESHOLDS.breakReminderTime ||
      session.messageCount >= SESSION_THRESHOLDS.breakReminderMessages)
  ) {
    return true;
  }

  // Second break reminder
  if (
    session.breakReminderShown &&
    !session.secondBreakReminderShown &&
    (minutesElapsed >= SESSION_THRESHOLDS.secondBreakReminderTime ||
      session.messageCount >= SESSION_THRESHOLDS.secondBreakReminderMessages)
  ) {
    return true;
  }

  return false;
}

/**
 * Check if crisis needs escalation (multiple crisis events)
 */
export function shouldEscalateCrisis(session: AISession): boolean {
  if (!session.crisisDetected) return false;

  // Count unique crisis events
  const crisisMessages = session.messages.filter(
    (m) => m.crisisResult && m.crisisResult.tier <= 2
  );

  return (
    crisisMessages.length >= SESSION_THRESHOLDS.maxCrisisEventsBeforeEscalation
  );
}

/**
 * Get session statistics for analytics
 */
export async function getSessionStats(
  userId: string,
  memorialId?: string
): Promise<{
  totalSessions: number;
  averageDuration: number;
  averageMessageCount: number;
  crisisRate: number;
}> {
  if (DEMO_MODE) {
    const sessions = Array.from(demoSessions.values()).filter(
      (s) => s.userId === userId && (!memorialId || s.memorialId === memorialId)
    );

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageDuration: 0,
        averageMessageCount: 0,
        crisisRate: 0,
      };
    }

    const completedSessions = sessions.filter((s) => s.endedAt);
    const totalDuration = completedSessions.reduce(
      (sum, s) => sum + s.durationSeconds,
      0
    );
    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
    const crisisSessions = sessions.filter((s) => s.crisisDetected);

    return {
      totalSessions: sessions.length,
      averageDuration: completedSessions.length
        ? totalDuration / completedSessions.length
        : 0,
      averageMessageCount: sessions.length ? totalMessages / sessions.length : 0,
      crisisRate: sessions.length ? crisisSessions.length / sessions.length : 0,
    };
  }

  return {
    totalSessions: 0,
    averageDuration: 0,
    averageMessageCount: 0,
    crisisRate: 0,
  };
}
