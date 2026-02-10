// ======================
// API Module Barrel Export
// ======================

// Error handling
export { handleApiError, createErrorResponse } from "./error-handler";

// Response helpers
export {
  apiSuccess,
  apiCreated,
  apiNoContent,
  apiPaginated,
  apiError,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiConflict,
  apiValidationError,
  apiRateLimited,
  apiInternalError,
  apiServiceUnavailable,
} from "./responses";

// Middleware
export {
  withAuth,
  withOptionalAuth,
  withRateLimit,
  withValidation,
  withErrorHandling,
  withRequestId,
  compose,
  type ApiHandler,
  type ApiMiddleware,
} from "./middleware";

// Rate limiting
export {
  checkRateLimit,
  RateLimitPresets,
  type RateLimitConfig,
  type RateLimitResult,
} from "./rate-limit";
