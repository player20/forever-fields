/**
 * Structured Logger Utility
 * Replaces console.log with production-ready logging
 * Features: Log levels, timestamps, contextual data, production filtering
 */

import { env } from '../config/env';

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = env.NODE_ENV === 'development';
    this.isProduction = env.NODE_ENV === 'production';
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  /**
   * Should log based on environment and level
   */
  private shouldLog(level: LogLevel): boolean {
    // In production, only log WARN and ERROR
    if (this.isProduction) {
      return level === LogLevel.WARN || level === LogLevel.ERROR;
    }
    // In development, log everything
    return true;
  }

  /**
   * Debug level - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const formatted = this.formatMessage(LogLevel.DEBUG, message, context);
    console.log(formatted);
  }

  /**
   * Info level - general information
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const formatted = this.formatMessage(LogLevel.INFO, message, context);
    console.log(formatted);
  }

  /**
   * Warn level - warnings and potential issues
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const formatted = this.formatMessage(LogLevel.WARN, message, context);
    console.warn(formatted);
  }

  /**
   * Error level - errors and exceptions
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorContext = {
      ...context,
      errorMessage: error?.message,
      errorStack: this.isDevelopment ? error?.stack : undefined,
      errorName: error?.name,
    };

    const formatted = this.formatMessage(LogLevel.ERROR, message, errorContext);
    console.error(formatted);

    // In production, send to error tracking service (e.g., Sentry)
    if (this.isProduction && error) {
      this.sendToErrorTracking(message, error, context);
    }
  }

  /**
   * Send errors to external service (placeholder for Sentry integration)
   */
  private sendToErrorTracking(message: string, error: Error | any, context?: LogContext): void {
    // TODO: Integrate with Sentry or similar service
    // Example:
    // Sentry.captureException(error, {
    //   tags: { context: message },
    //   extra: context,
    // });
  }

  /**
   * HTTP request logging
   */
  http(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const message = `${method} ${path} ${statusCode} ${duration}ms`;

    // Log as info in development, only errors in production
    if (statusCode >= 500) {
      this.error(message, undefined, context);
    } else if (statusCode >= 400) {
      this.warn(message, context);
    } else {
      this.info(message, context);
    }
  }

  /**
   * Database query logging (for debugging)
   */
  query(operation: string, table: string, duration: number, context?: LogContext): void {
    if (!this.isDevelopment) return; // Only in development

    const message = `DB: ${operation} ${table} (${duration}ms)`;
    this.debug(message, context);
  }

  /**
   * Authentication events
   */
  auth(event: string, userId?: string, context?: LogContext): void {
    const message = `[AUTH] ${event}`;
    const authContext = { userId, ...context };
    this.info(message, authContext);
  }

  /**
   * Admin actions (always log, even in production)
   */
  admin(action: string, adminId: string, context?: LogContext): void {
    const message = `[ADMIN] ${action}`;
    const adminContext = { adminId, ...context };

    // Always log admin actions
    const formatted = this.formatMessage(LogLevel.INFO, message, adminContext);
    console.log(formatted);
  }

  /**
   * Security events (always log)
   */
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    const message = `[SECURITY] ${event}`;
    const securityContext = { severity, ...context };

    if (severity === 'critical' || severity === 'high') {
      this.error(message, undefined, securityContext);
    } else {
      this.warn(message, securityContext);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };
