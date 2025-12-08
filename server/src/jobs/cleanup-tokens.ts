/**
 * Token Cleanup Job
 * Removes expired/used tokens from the database to maintain performance
 */

import { prisma } from '../config/database';

/**
 * Clean up expired magic links
 */
export const cleanupExpiredMagicLinks = async (): Promise<number> => {
  const result = await prisma.magicLink.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } }, // Expired
        {
          AND: [
            { usedAt: { not: null } }, // Used
            { usedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // More than 24h ago
          ],
        },
      ],
    },
  });

  return result.count;
};

/**
 * Clean up expired invitations
 */
export const cleanupExpiredInvitations = async (): Promise<number> => {
  const result = await prisma.invitation.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } }, // Expired
        {
          AND: [
            { usedAt: { not: null } }, // Used
            { usedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // More than 7 days ago
          ],
        },
      ],
    },
  });

  return result.count;
};

/**
 * Clean up old login attempts (keep last 30 days)
 */
export const cleanupOldLoginAttempts = async (): Promise<number> => {
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days

  const result = await prisma.loginAttempt.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
};

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = async (): Promise<number> => {
  const result = await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } }, // Expired
        { revokedAt: { not: null, lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Revoked > 24h ago
      ],
    },
  });

  return result.count;
};

/**
 * Clean up old audit logs (keep last 90 days)
 */
export const cleanupOldAuditLogs = async (): Promise<number> => {
  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
};

/**
 * Run all cleanup tasks
 */
export const runCleanupJob = async (): Promise<void> => {
  console.log('[CLEANUP] Starting token cleanup job...');

  try {
    const [magicLinks, invitations, loginAttempts, sessions, auditLogs] = await Promise.all([
      cleanupExpiredMagicLinks(),
      cleanupExpiredInvitations(),
      cleanupOldLoginAttempts(),
      cleanupExpiredSessions(),
      cleanupOldAuditLogs(),
    ]);

    console.log(`[CLEANUP] Completed:
      - Magic links: ${magicLinks} removed
      - Invitations: ${invitations} removed
      - Login attempts: ${loginAttempts} removed
      - Sessions: ${sessions} removed
      - Audit logs: ${auditLogs} removed
    `);
  } catch (error) {
    console.error('[CLEANUP] Error during cleanup job:', error);
  }
};

/**
 * Schedule cleanup job to run periodically
 * Runs every 6 hours
 */
export const scheduleCleanupJob = (): NodeJS.Timeout => {
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  const STARTUP_DELAY = 30 * 1000; // 30 seconds

  console.log('[CLEANUP] Token cleanup job scheduled (first run in 30 seconds)...');

  // Delay first run to give database time to wake up from Supabase free tier pause
  setTimeout(() => {
    console.log('[CLEANUP] Running first cleanup job...');
    runCleanupJob();
  }, STARTUP_DELAY);

  // Then run every 6 hours
  return setInterval(runCleanupJob, SIX_HOURS);
};
