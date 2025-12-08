/**
 * CSRF Protection Middleware
 * Double-submit cookie pattern for defense-in-depth
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Generate a secure CSRF token
 */
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Set CSRF token cookie for the client
 */
export const setCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
  // Generate token if not exists
  if (!req.cookies?.csrf_token) {
    const token = generateCsrfToken();

    // Set as httpOnly cookie (server-side verification)
    res.cookie('csrf_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // Also set as regular cookie (client-side access for including in requests)
    res.cookie('x_csrf_token', token, {
      httpOnly: false, // Client needs to read this
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  next();
};

/**
 * Verify CSRF token on state-changing requests (POST, PUT, DELETE, PATCH)
 */
export const verifyCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF if sameSite cookies are working (primary protection)
  // This is defense-in-depth, not the primary protection mechanism
  const sameSite = env.NODE_ENV === 'production' ? 'none' : 'lax';
  if (sameSite === 'lax' || sameSite === 'strict') {
    // SameSite provides CSRF protection, skip token verification
    return next();
  }

  // Get token from cookie (set by server)
  const cookieToken = req.cookies?.csrf_token;

  // Get token from header (sent by client)
  const headerToken = req.headers['x-csrf-token'] as string;

  // Verify tokens match
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    console.warn(`[SECURITY] CSRF token mismatch from ${req.ip}`);
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

/**
 * Combined middleware: Set and verify CSRF
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // First set the token if needed
  setCsrfToken(req, res, () => {
    // Then verify on state-changing requests
    verifyCsrfToken(req, res, next);
  });
};
