/**
 * Input Sanitization Middleware
 * Strips dangerous characters from user input to prevent injection attacks
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Sanitize string input by removing/escaping dangerous characters
 */
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str;

  return str
    .trim()
    // Remove null bytes (can cause issues in C-based systems)
    .replace(/\0/g, '')
    // Remove common SQL injection patterns (defense in depth - Prisma already handles this)
    .replace(/--/g, '')
    .replace(/;--/g, '')
    // Remove potential NoSQL injection patterns
    .replace(/\$where/gi, '')
    .replace(/\$ne/gi, '');
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Skip __proto__ and constructor to prevent prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Middleware to sanitize request body, query, and params
 * Place after body parsers but before validation
 */
export const inputSanitizer = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('[Input Sanitizer] Error sanitizing input:', error);
    // Don't block request if sanitization fails - log and continue
    next();
  }
};

/**
 * Validate that input doesn't contain common attack patterns
 */
export const validateNoAttackPatterns = (input: string): boolean => {
  if (typeof input !== 'string') return true;

  const attackPatterns = [
    /<script/i,                    // XSS
    /javascript:/i,                // XSS via protocol
    /on\w+\s*=/i,                  // Event handlers (onclick, onerror, etc)
    /eval\s*\(/i,                  // Code execution
    /expression\s*\(/i,            // CSS expression
    /import\s+/i,                  // ES6 imports
    /\bexec\b/i,                   // Command execution
    /\bunion\b.*\bselect\b/i,      // SQL injection
    /\bdrop\b.*\btable\b/i,        // SQL injection
    /\.\.\/\.\.\//,                // Path traversal
    /\0/,                          // Null bytes
  ];

  for (const pattern of attackPatterns) {
    if (pattern.test(input)) {
      return false;
    }
  }

  return true;
};

/**
 * Middleware to block requests with obvious attack patterns
 */
export const blockAttackPatterns = (req: Request, res: Response, next: NextFunction) => {
  const checkValue = (value: any, path: string = ''): boolean => {
    if (typeof value === 'string') {
      if (!validateNoAttackPatterns(value)) {
        console.warn(`[Security] Attack pattern detected in ${path}:`, value.substring(0, 100));
        return false;
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        if (!checkValue(value[key], `${path}.${key}`)) {
          return false;
        }
      }
    }
    return true;
  };

  // Check body
  if (req.body && !checkValue(req.body, 'body')) {
    return res.status(400).json({
      error: 'Invalid input detected. Please check your request.',
    });
  }

  // Check query
  if (req.query && !checkValue(req.query, 'query')) {
    return res.status(400).json({
      error: 'Invalid input detected. Please check your request.',
    });
  }

  // Check params
  if (req.params && !checkValue(req.params, 'params')) {
    return res.status(400).json({
      error: 'Invalid input detected. Please check your request.',
    });
  }

  next();
};
