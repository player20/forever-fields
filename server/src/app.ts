/**
 * Express Application Setup
 * Main app configuration with all middleware and routes
 */

import express, { Request, Response, NextFunction } from 'express';
import { env, isProd } from './config/env';
import {
  helmetMiddleware,
  corsMiddleware,
  httpsRedirect,
  apiRateLimiter,
} from './middleware/security';

// Import routes
import authRoutes from './routes/auth';
import memorialRoutes from './routes/memorials';
import uploadRoutes from './routes/uploads';
import pendingRoutes from './routes/pending';
import candleRoutes from './routes/candles';
import timeCapsuleRoutes from './routes/timeCapsules';
import qrRoutes from './routes/qr';
import prayerCardRoutes from './routes/prayer-card';
import pushRoutes from './routes/push';
import guestbookRoutes from './routes/guestbook';
import memoriesRoutes from './routes/memories';
import voiceNotesRoutes from './routes/voiceNotes';
import reportsRoutes from './routes/reports';

const app = express();

// Trust proxy for Render/Cloudflare (required for rate limiting, IP detection)
app.set('trust proxy', true);

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// HTTPS redirect in production
if (isProd) {
  app.use(httpsRedirect);
}

// Helmet - Security headers
app.use(helmetMiddleware);

// CORS - Cross-origin resource sharing
app.use(corsMiddleware);

// ============================================
// BODY PARSING
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/memorials', memorialRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/pending', pendingRoutes);
app.use('/api/candles', candleRoutes);
app.use('/api/time-capsules', timeCapsuleRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/prayer-card', prayerCardRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/guestbook', guestbookRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/voice-notes', voiceNotesRoutes);
app.use('/api/reports', reportsRoutes);

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);

  // Never leak error details in production
  if (isProd) {
    return res.status(500).json({
      error: 'Internal server error',
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: err.stack,
  });
});

export default app;
