/**
 * Production-safe logging utility
 * Only logs in development, sanitizes in production
 *
 * Usage:
 *   Logger.log('Debug message');  // Only shown in development
 *   Logger.error('Error occurred', error);  // Sanitized in production
 *   Logger.warn('Warning message');  // Only shown in development
 */
const Logger = {
  isDevelopment: window.location.hostname === 'localhost' ||
                 window.location.hostname === '127.0.0.1',

  /**
   * Log debug information (development only)
   */
  log(...args) {
    if (this.isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log errors (sanitized in production)
   */
  error(message, error) {
    if (this.isDevelopment) {
      console.error(message, error);
    } else {
      // Production: Only log generic message
      console.error(message);

      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      // this.sendToErrorTracking(message, error);
    }
  },

  /**
   * Log warnings (development only)
   */
  warn(...args) {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Sanitize sensitive data from objects
   * Never log passwords, tokens, emails, etc.
   */
  sanitize(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveFields = [
      'password',
      'token',
      'access_token',
      'refresh_token',
      'email',
      'ssn',
      'credit_card',
      'api_key',
      'secret'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  },

  /**
   * Send error to external tracking service (production)
   * @private
   */
  sendToErrorTracking(message, error) {
    // TODO: Integrate with Sentry or LogRocket
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     extra: { message }
    //   });
    // }
  }
};

// Make Logger available globally
window.Logger = Logger;
