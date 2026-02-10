// ======================
// API Error Handler
// Converts error classes to standardized API responses
// ======================

import { NextResponse } from "next/server";
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  TimeoutError,
  logError,
} from "@/lib/errors";
import { ERROR_CODES, HTTP_STATUS, IS_DEVELOPMENT } from "@/lib/constants";
import type { ApiErrorResponse } from "@/types/api";

/**
 * Handles any error and converts it to a standardized API error response.
 *
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   try {
 *     // ... business logic
 *   } catch (error) {
 *     return handleApiError(error);
 *   }
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  context?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  // Always log the error
  logError(error, context);

  // Handle ValidationError with field details
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: error.message,
          fields: error.fields,
        },
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  // Handle AuthenticationError
  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: error.message,
        },
      },
      { status: HTTP_STATUS.UNAUTHORIZED }
    );
  }

  // Handle AuthorizationError
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: error.message,
        },
      },
      { status: HTTP_STATUS.FORBIDDEN }
    );
  }

  // Handle NotFoundError
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: error.message,
        },
      },
      { status: HTTP_STATUS.NOT_FOUND }
    );
  }

  // Handle RateLimitError
  if (error instanceof RateLimitError) {
    const headers = new Headers();
    if (error.retryAfter) {
      headers.set("Retry-After", String(error.retryAfter));
    }

    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: ERROR_CODES.RATE_LIMITED,
          message: error.message,
          details: error.retryAfter ? { retryAfter: error.retryAfter } : undefined,
        },
      },
      { status: HTTP_STATUS.TOO_MANY_REQUESTS, headers }
    );
  }

  // Handle TimeoutError
  if (error instanceof TimeoutError) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: ERROR_CODES.TIMEOUT,
          message: error.message,
        },
      },
      { status: HTTP_STATUS.SERVICE_UNAVAILABLE }
    );
  }

  // Handle generic AppError
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: error.code,
          message: error.message,
          details: IS_DEVELOPMENT ? error.context : undefined,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle unknown errors - don't leak details in production
  const message = IS_DEVELOPMENT && error instanceof Error
    ? error.message
    : "An unexpected error occurred. Please try again.";

  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message,
        details: IS_DEVELOPMENT && error instanceof Error
          ? { stack: error.stack }
          : undefined,
      },
    },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  );
}

/**
 * Creates an error response without throwing (useful for early returns)
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}
