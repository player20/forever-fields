/**
 * Database Keep-Alive
 * Prevents Supabase free tier from pausing by pinging every 5 minutes
 */

import { prisma } from '../config/database';

let keepAliveInterval: NodeJS.Timeout | null = null;

export const startDatabaseKeepAlive = () => {
  if (keepAliveInterval) {
    return; // Already running
  }

  console.log('[KEEP-ALIVE] Starting database keep-alive (ping every 5 minutes)');

  // Ping immediately
  pingDatabase();

  // Then ping every 5 minutes
  keepAliveInterval = setInterval(async () => {
    await pingDatabase();
  }, 5 * 60 * 1000); // 5 minutes
};

export const stopDatabaseKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('[KEEP-ALIVE] Stopped database keep-alive');
  }
};

const pingDatabase = async () => {
  try {
    // Simple query to keep connection alive
    await prisma.$queryRaw`SELECT 1`;
    console.log('[KEEP-ALIVE] Database ping successful');
  } catch (error) {
    console.error('[KEEP-ALIVE] Database ping failed:', error);
  }
};
