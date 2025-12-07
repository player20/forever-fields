/**
 * Cleanup Service
 * Handles periodic cleanup of expired data
 */

import { prisma } from '../config/database';

/**
 * Clean up expired magic links
 * Call this periodically to prevent database bloat
 */
export async function cleanupExpiredMagicLinks(): Promise<number> {
  try {
    const result = await prisma.magicLink.deleteMany({
      where: {
        OR: [
          // Delete expired links
          {
            expiresAt: {
              lt: new Date(),
            },
          },
          // Delete used links older than 1 day
          {
            usedAt: {
              not: null,
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    });

    const count = result.count;
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} expired/used magic links`);
    }
    return count;
  } catch (error) {
    console.error('Failed to cleanup magic links:', error);
    return 0;
  }
}

/**
 * Start periodic cleanup job (runs every hour)
 */
export function startCleanupJob(): void {
  // Run immediately on start
  cleanupExpiredMagicLinks();

  // Then run every hour
  const HOUR_MS = 60 * 60 * 1000;
  setInterval(cleanupExpiredMagicLinks, HOUR_MS);

  console.log('✅ Cleanup job started (runs hourly)');
}
