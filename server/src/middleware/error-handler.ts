/**
 * Global Error Handler
 * Provides consistent error responses without leaking sensitive information
 */

import { Request, Response, NextFunction } from 'express';
import { isProd } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handler middleware
 * Must be placed after all routes
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for debugging (server-side only)
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
    message: err.message,
    stack: isProd ? undefined : err.stack, // Only log stack in development
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Prepare error response
  const errorResponse: any = {
    error: getPublicErrorMessage(statusCode, err.message),
    statusCode,
    timestamp: new Date().toISOString(),
  };

  // Include stack trace only in development
  if (!isProd && err.stack) {
    errorResponse.stack = err.stack;
    errorResponse.originalMessage = err.message;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Get user-safe error message
 * Never leak sensitive information to clients
 */
function getPublicErrorMessage(statusCode: number, originalMessage?: string): string {
  // In production, only return generic messages for 5xx errors
  if (isProd && statusCode >= 500) {
    return 'Internal server error. Please try again later.';
  }

  // For 4xx errors, we can be more specific
  switch (statusCode) {
    case 400:
      return originalMessage || 'Bad request. Please check your input.';
    case 401:
      return 'Authentication required. Please log in.';
    case 403:
      return 'Access denied. You do not have permission to access this resource.';
    case 404:
      return 'Resource not found.';
    case 409:
      return originalMessage || 'Conflict. The resource already exists.';
    case 422:
      return originalMessage || 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please slow down and try again later.';
    default:
      return originalMessage || 'An error occurred. Please try again.';
  }
}

/**
 * 404 Not Found handler
 * Must be placed before error handler but after all routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    statusCode: 404,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Create operational error (expected errors)
 */
export class OperationalError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error creators
 */
export const createError = {
  badRequest: (message: string = 'Bad request') =>
    new OperationalError(message, 400),

  unauthorized: (message: string = 'Unauthorized') =>
    new OperationalError(message, 401),

  forbidden: (message: string = 'Forbidden') =>
    new OperationalError(message, 403),

  notFound: (message: string = 'Not found') =>
    new OperationalError(message, 404),

  conflict: (message: string = 'Conflict') =>
    new OperationalError(message, 409),

  validationError: (message: string = 'Validation failed') =>
    new OperationalError(message, 422),

  tooManyRequests: (message: string = 'Too many requests') =>
    new OperationalError(message, 429),

  internal: (message: string = 'Internal server error') =>
    new OperationalError(message, 500),
};
