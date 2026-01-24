// Error types and utilities for Forever Fields

// Custom error classes
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = "UNKNOWN_ERROR",
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class NetworkError extends AppError {
  constructor(message: string = "Network request failed", context?: Record<string, unknown>) {
    super(message, "NETWORK_ERROR", 0, true, context);
    this.name = "NetworkError";
  }
}

export class ApiError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "API_ERROR",
    context?: Record<string, unknown>
  ) {
    super(message, code, statusCode, true, context);
    this.name = "ApiError";
  }
}

export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]>;

  constructor(
    message: string = "Validation failed",
    fields: Record<string, string[]> = {},
    context?: Record<string, unknown>
  ) {
    super(message, "VALIDATION_ERROR", 400, true, context);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required", context?: Record<string, unknown>) {
    super(message, "AUTH_ERROR", 401, true, context);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied", context?: Record<string, unknown>) {
    super(message, "FORBIDDEN", 403, true, context);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource", context?: Record<string, unknown>) {
    super(`${resource} not found`, "NOT_FOUND", 404, true, context);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(retryAfter?: number, context?: Record<string, unknown>) {
    super("Too many requests. Please try again later.", "RATE_LIMIT", 429, true, context);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = "Request timed out", context?: Record<string, unknown>) {
    super(message, "TIMEOUT", 408, true, context);
    this.name = "TimeoutError";
  }
}

// Error code to user-friendly message mapping
const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: "Unable to connect. Please check your internet connection.",
  API_ERROR: "Something went wrong on our end. Please try again.",
  VALIDATION_ERROR: "Please check your input and try again.",
  AUTH_ERROR: "Please sign in to continue.",
  FORBIDDEN: "You don't have permission to do this.",
  NOT_FOUND: "The requested item could not be found.",
  RATE_LIMIT: "Too many requests. Please wait a moment.",
  TIMEOUT: "The request took too long. Please try again.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
};

// Get user-friendly error message
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return ERROR_MESSAGES[error.code] || error.message;
  }

  if (error instanceof Error) {
    // Handle common browser errors
    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (error.name === "AbortError") {
      return "The request was cancelled.";
    }
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

// Check if error is retryable
export function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof TimeoutError) return true;
  if (error instanceof ApiError && error.statusCode >= 500) return true;
  if (error instanceof RateLimitError) return true;

  if (error instanceof Error) {
    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      return true;
    }
  }

  return false;
}

// Parse error from API response
export async function parseApiError(response: Response): Promise<AppError> {
  let body: { error?: string; message?: string; code?: string; fields?: Record<string, string[]> };

  try {
    body = await response.json();
  } catch {
    body = {};
  }

  const message = body.error || body.message || response.statusText || "Request failed";
  const code = body.code || `HTTP_${response.status}`;

  switch (response.status) {
    case 400:
      if (body.fields) {
        return new ValidationError(message, body.fields);
      }
      return new ApiError(message, 400, "BAD_REQUEST");

    case 401:
      return new AuthenticationError(message);

    case 403:
      return new AuthorizationError(message);

    case 404:
      return new NotFoundError(message);

    case 429:
      const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
      return new RateLimitError(retryAfter);

    case 408:
      return new TimeoutError(message);

    default:
      return new ApiError(message, response.status, code);
  }
}

// Log error (can be extended to send to monitoring service)
export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", error);
    if (context) {
      console.error("Context:", context);
    }
  }

  // TODO: Send to error monitoring service (Sentry, etc.)
  // if (process.env.NODE_ENV === "production") {
  //   Sentry.captureException(error, { extra: context });
  // }
}
