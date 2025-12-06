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
});

// ============================================
// CORS - Cross-Origin Resource Sharing
// ============================================

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [env.FRONTEND_URL];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

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

// Auth endpoints: 5 requests per 15 minutes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  validate: { trustProxy: false }, // Disable trust proxy validation for Render
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
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
  validate: { trustProxy: false }, // Disable trust proxy validation for Render
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
  validate: { trustProxy: false }, // Disable trust proxy validation for Render
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
  validate: { trustProxy: false }, // Disable trust proxy validation for Render
  handler: (req, res) => {
    res.status(429).json({
      error: 'Upload rate limit exceeded',
      retryAfter: '15 minutes',
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
