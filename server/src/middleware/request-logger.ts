/**
 * Request Logging Middleware
 * Logs all HTTP requests with timing and context
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  // Override end to log after response
  res.end = function (chunk?: any, encoding?: any, callback?: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const method = req.method;
    const path = req.path;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = (req.ip || req.connection.remoteAddress || 'unknown').replace('::ffff:', '');

    // Log the request
    logger.http(method, path, statusCode, duration, {
      ip,
      userAgent,
      userId: req.user?.id,
    });

    // Call original end
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};
