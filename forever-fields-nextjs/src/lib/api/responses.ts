// ======================
// API Response Helpers
// Standardized success/error response builders
// ======================

import { NextResponse } from "next/server";
import { ERROR_CODES, HTTP_STATUS } from "@/lib/constants";
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiMeta,
  PaginationMeta,
} from "@/types/api";

// ======================
// Success Responses
// ======================

/**
 * Creates a successful API response
 */
export function apiSuccess<T>(
  data: T,
  meta?: ApiMeta,
  status: number = HTTP_STATUS.OK
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

/**
 * Creates a successful response for resource creation
 */
export function apiCreated<T>(
  data: T,
  meta?: ApiMeta
): NextResponse<ApiSuccessResponse<T>> {
  return apiSuccess(data, meta, HTTP_STATUS.CREATED);
}

/**
 * Creates a successful response with no content
 */
export function apiNoContent(): NextResponse {
  return new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT });
}

/**
 * Creates a paginated success response
 */
export function apiPaginated<T>(
  items: T[],
  pagination: PaginationMeta
): NextResponse<ApiSuccessResponse<T[]>> {
  return apiSuccess(items, { pagination });
}

// ======================
// Error Responses
// ======================

/**
 * Creates an error response
 */
export function apiError(
  code: string,
  message: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const errorObj: { code: string; message: string; details?: Record<string, unknown> } = {
    code,
    message,
  };
  if (details) {
    errorObj.details = details;
  }
  return NextResponse.json(
    {
      success: false as const,
      error: errorObj,
    },
    { status }
  );
}

/**
 * Creates a 400 Bad Request error
 */
export function apiBadRequest(
  message: string = "Invalid request",
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  return apiError(ERROR_CODES.INVALID_INPUT, message, HTTP_STATUS.BAD_REQUEST, details);
}

/**
 * Creates a 401 Unauthorized error
 */
export function apiUnauthorized(
  message: string = "Authentication required"
): NextResponse<ApiErrorResponse> {
  return apiError(ERROR_CODES.UNAUTHORIZED, message, HTTP_STATUS.UNAUTHORIZED);
}

/**
 * Creates a 403 Forbidden error
 */
export function apiForbidden(
  message: string = "Access denied"
): NextResponse<ApiErrorResponse> {
  return apiError(ERROR_CODES.FORBIDDEN, message, HTTP_STATUS.FORBIDDEN);
}

/**
 * Creates a 404 Not Found error
 */
export function apiNotFound(
  resource: string = "Resource"
): NextResponse<ApiErrorResponse> {
  return apiError(
    ERROR_CODES.NOT_FOUND,
    `${resource} not found`,
    HTTP_STATUS.NOT_FOUND
  );
}

/**
 * Creates a 409 Conflict error
 */
export function apiConflict(
  message: string = "Resource already exists"
): NextResponse<ApiErrorResponse> {
  return apiError(ERROR_CODES.CONFLICT, message, HTTP_STATUS.CONFLICT);
}

/**
 * Creates a 422 Validation error with field details
 */
export function apiValidationError(
  message: string = "Validation failed",
  fields?: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message,
        ...(fields && { fields }),
      },
    },
    { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }
  );
}

/**
 * Creates a 429 Rate Limit error
 */
export function apiRateLimited(
  retryAfter?: number
): NextResponse<ApiErrorResponse> {
  const headers = new Headers();
  if (retryAfter) {
    headers.set("Retry-After", String(retryAfter));
  }

  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: ERROR_CODES.RATE_LIMITED,
        message: "Too many requests. Please try again later.",
        ...(retryAfter && { details: { retryAfter } }),
      },
    },
    { status: HTTP_STATUS.TOO_MANY_REQUESTS, headers }
  );
}

/**
 * Creates a 500 Internal Server Error
 */
export function apiInternalError(
  message: string = "An unexpected error occurred"
): NextResponse<ApiErrorResponse> {
  return apiError(ERROR_CODES.INTERNAL_ERROR, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

/**
 * Creates a 503 Service Unavailable error
 */
export function apiServiceUnavailable(
  message: string = "Service temporarily unavailable"
): NextResponse<ApiErrorResponse> {
  return apiError(ERROR_CODES.SERVICE_UNAVAILABLE, message, HTTP_STATUS.SERVICE_UNAVAILABLE);
}
