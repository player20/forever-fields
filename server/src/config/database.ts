/**
 * Database Configuration
 * Prisma Client singleton instance with connection health checks
 */

import { PrismaClient } from '@prisma/client';
import { env, isDev } from './env';

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['query', 'error', 'warn'] : ['error'],
  });

if (isDev) globalForPrisma.prisma = prisma;

/**
 * Check if database is reachable
 * Returns true if connection successful, false otherwise
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('[DATABASE] Connection check failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
