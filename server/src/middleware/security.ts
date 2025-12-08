/**
 * Security Middleware
 * Rate limiting, Helmet, CORS configuration
 */

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env, isProd } from '../config/env';

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
    maxAge: 31536000, // 1 year
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
  maxAge: 86400, // 24 hours
});

// ============================================
// RATE LIMITING
// ============================================

// Auth endpoints: Stricter in production, relaxed in development
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 100 : 100, // Production: 100 attempts (temporarily increased for testing), Development: 100 attempts
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  validate: { trustProxy: true }, // Trust proxy headers (matches app.ts config)
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication requests. Please try again in a few minutes.',
      retryAfter: '15 minutes',
    });
  },
});

// General API endpoints: 100 requests per 15 minutes
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true }, // Trust proxy headers (matches app.ts config)
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: '15 minutes',
    });
  },
});

// Candle lighting: 3 per minute (prevent spam)
export const candleRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: 'Please wait before lighting another candle',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true }, // Trust proxy headers (matches app.ts config)
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many candles lit',
      retryAfter: '1 minute',
    });
  },
});

// Upload endpoints: 10 per 15 minutes
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many upload requests',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true }, // Trust proxy headers (matches app.ts config)
  handler: (req, res) => {
    res.status(429).json({
      error: 'Upload rate limit exceeded',
      retryAfter: '15 minutes',
    });
  },
});

// Strict rate limiter: 10 requests per minute (for sensitive operations)
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true },
  handler: (req, res) => {
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
