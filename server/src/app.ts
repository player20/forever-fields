/**
 * Express Application Setup
 * Main app configuration with all middleware and routes
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import { env, isProd } from './config/env';
import {
  helmetMiddleware,
  permissionsPolicyMiddleware,
  corsMiddleware,
  httpsRedirect,
  apiRateLimiter,
} from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { inputSanitizer, blockAttackPatterns } from './middleware/input-sanitizer';
import { requestLogger } from './middleware/request-logger';

// Import routes
// import authRoutes from './routes/auth'; // Legacy simple magic-link only
import authCompleteRoutes from './routes/auth-complete'; // Hybrid auth (magic link + password + SSO)
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
import affiliateRoutes from './routes/affiliate';
import socialLinksRoutes from './routes/social-links';
import invitationRoutes from './routes/invitations';
import userRoutes from './routes/user';
import lifeEventsRoutes from './routes/lifeEvents';
import recipesRoutes from './routes/recipes';
import photosRoutes from './routes/photos';

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

// Permissions-Policy header for additional security
app.use(permissionsPolicyMiddleware);

// CORS - Cross-origin resource sharing
app.use(corsMiddleware);

// ============================================
// BODY PARSING & COOKIES
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Parse cookies for httpOnly auth tokens

// ============================================
// REQUEST LOGGING
// ============================================

// Log all HTTP requests (structured logging)
app.use(requestLogger);

// ============================================
// INPUT SANITIZATION
// ============================================

// Sanitize all user input (defense in depth)
app.use(inputSanitizer);

// Block obvious attack patterns
app.use(blockAttackPatterns);

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

app.use('/api/auth', authCompleteRoutes); // Hybrid auth: magic link + password + SSO
// app.use('/api/auth', authRoutes); // Simple magic-link only (legacy)
app.use('/api/user', userRoutes); // User profile and account management
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
app.use('/api/affiliate', affiliateRoutes); // Affiliate partnerships (flowers, etc.)
app.use('/api/social-links', socialLinksRoutes); // Social media links for memorials
app.use('/api', invitationRoutes); // Memorial collaboration invitations (handles both /invitations and /memorials routes)
app.use('/api/life-events', lifeEventsRoutes); // Timeline life events for memorials
app.use('/api/recipes', recipesRoutes); // Famous recipes for memorials
app.use('/api/photos', photosRoutes); // Photo gallery for memorials

// ============================================
// 404 HANDLER
// ============================================

app.use(notFoundHandler);

// ============================================
// ERROR HANDLER
// ============================================

app.use(errorHandler);

export default app;
