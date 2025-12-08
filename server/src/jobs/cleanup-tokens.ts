/**
 * Token Cleanup Job
 * Removes expired/used tokens from the database to maintain performance
 */

import { prisma, checkDatabaseConnection } from '../config/database';

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
 * Run all cleanup tasks with database connectivity check
 */
export const runCleanupJob = async (): Promise<void> => {
  console.log('[CLEANUP] Starting token cleanup job...');

  // Check database connection first
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.warn('[CLEANUP] Skipping cleanup - database not reachable. Will retry on next schedule.');
    return;
  }

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
    console.error('[CLEANUP] Error during cleanup job:', error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Schedule cleanup job to run periodically
 * Waits 30 seconds after startup, then runs every 6 hours
 */
export const scheduleCleanupJob = (): NodeJS.Timeout => {
  const STARTUP_DELAY = 30 * 1000; // 30 seconds
  const SIX_HOURS = 6 * 60 * 60 * 1000;

  console.log('[CLEANUP] Cleanup job scheduled - will run in 30 seconds, then every 6 hours');

  // Wait 30 seconds after startup to ensure database is ready
  setTimeout(() => {
    runCleanupJob();
  }, STARTUP_DELAY);

  // Then run every 6 hours
  return setInterval(runCleanupJob, SIX_HOURS);
};
