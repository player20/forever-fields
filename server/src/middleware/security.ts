/**
 * Security Middleware
 * Rate limiting, Helmet, CORS configuration
 */

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env, isProd } from '../config/env';
import {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_WINDOW_1MIN_MS,
  AUTH_RATE_LIMIT_PROD,
  AUTH_RATE_LIMIT_DEV,
  API_RATE_LIMIT,
  CANDLE_RATE_LIMIT,
  UPLOAD_RATE_LIMIT,
  STRICT_RATE_LIMIT,
  HSTS_MAX_AGE,
  CORS_MAX_AGE,
} from '../config/constants';

// ============================================
// HELMET - Security Headers
// ============================================

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'", env.SUPABASE_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'https://res.cloudinary.com'],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: isProd ? [] : null, // Upgrade HTTP to HTTPS in production
    },
  },
  hsts: {
    maxAge: HSTS_MAX_AGE,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin', // Privacy protection
  },
  dnsPrefetchControl: { allow: false }, // Prevent DNS prefetching
  ieNoOpen: true, // Prevent IE from executing downloads
  hidePoweredBy: true, // Remove X-Powered-By header
});

/**
 * Permissions-Policy Header
 * Restricts browser features for security and privacy
 */
export const permissionsPolicyMiddleware = (_req: any, res: any, next: any) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()'
  );
  next();
};

// ============================================
// CORS - Cross-Origin Resource Sharing
// ============================================

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [env.FRONTEND_URL];

    // Add development origins if in dev mode
    if (env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
    }

    // Handle no-origin requests (same-origin, tools, health checks, etc.)
    if (!origin) {
      // Allow no-origin requests (health checks, same-origin, curl, etc.)
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: CORS_MAX_AGE,
});

// ============================================
// RATE LIMITING
// ============================================

// Auth endpoints: Stricter in production, relaxed in development
export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: isProd ? AUTH_RATE_LIMIT_PROD : AUTH_RATE_LIMIT_DEV,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  validate: { trustProxy: true }, // Trust proxy headers (matches app.ts config)
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too many authentication requests. Please try again in a few minutes.',
      retryAfter: '15 minutes',
    });
  },
});

// General API endpoints: 100 requests per 15 minutes
export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: API_RATE_LIMIT,
  message: 'Too many requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true }, // Trust proxy headers (matches app.ts config)
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: '15 minutes',
    });
  },
});

// Candle lighting: 3 per minute (prevent spam)
export const candleRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_1MIN_MS,
  max: CANDLE_RATE_LIMIT,
  message: 'Please wait before lighting another candle',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true }, // Trust proxy headers (matches app.ts config)
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too many candles lit',
      retryAfter: '1 minute',
    });
  },
});

// Upload endpoints: 10 per 15 minutes
export const uploadRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: UPLOAD_RATE_LIMIT,
  message: 'Too many upload requests',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true }, // Trust proxy headers (matches app.ts config)
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Upload rate limit exceeded',
      retryAfter: '15 minutes',
    });
  },
});

// Strict rate limiter: 10 requests per minute (for sensitive operations)
export const strictRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_1MIN_MS,
  max: STRICT_RATE_LIMIT,
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true },
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: '1 minute',
    });
  },
});

// ============================================
// HTTPS ENFORCEMENT
// ============================================

export const httpsRedirect = (req: any, res: any, next: any) => {
  if (isProd && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }
  next();
};
