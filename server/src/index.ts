/**
 * Forever Fields Backend
 * Entry point - starts the Express server
 */

import app from './app';
import { env, isDev } from './config/env';
import { prisma } from './config/database';
import { scheduleCleanupJob } from './jobs/cleanup-tokens';
import { startDatabaseKeepAlive, stopDatabaseKeepAlive } from './utils/keep-alive';

const PORT = parseInt(env.PORT);

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Forever Fields Backend');
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Server: ${env.API_URL}`);
  console.log(`🎯 Port: ${PORT}`);
  console.log(`✅ Ready to serve requests`);
  console.log('');

  // Start background cleanup job (runs every 6 hours)
  // Note: First run delayed by 30s to allow database to wake from Supabase free tier pause
  scheduleCleanupJob();

  // Start database keep-alive (prevents Supabase free tier from pausing)
  // Note: First ping may fail if DB is asleep, but will succeed on subsequent pings
  startDatabaseKeepAlive();
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');

  // Stop keep-alive
  stopDatabaseKeepAlive();

  server.close(async () => {
    console.log('📡 HTTP server closed');

    // Disconnect Prisma
    await prisma.$disconnect();
    console.log('🗄️  Database disconnected');

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (!isDev) {
    shutdown();
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  if (!isDev) {
    shutdown();
  }
});
