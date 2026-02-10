// ======================
// Forever Fields Constants
// Centralized configuration values
// ======================

// ======================
// Environment
// ======================
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

// ======================
// File Upload Limits
// ======================
export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 10 * 1024 * 1024,      // 10MB
  AUDIO_MAX_SIZE: 50 * 1024 * 1024,      // 50MB
  DOCUMENT_MAX_SIZE: 25 * 1024 * 1024,   // 25MB
  VIDEO_MAX_SIZE: 100 * 1024 * 1024,     // 100MB

  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"] as const,
  ALLOWED_AUDIO_TYPES: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"] as const,
  ALLOWED_DOCUMENT_TYPES: ["application/pdf"] as const,
} as const;

// ======================
// API Configuration
// ======================
export const API_CONFIG = {
  DEFAULT_TIMEOUT: 30_000,      // 30 seconds
  AI_TIMEOUT: 60_000,           // 60 seconds for AI operations
  STREAMING_TIMEOUT: 120_000,   // 2 minutes for streaming
  DEFAULT_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 4000] as const,
} as const;

// ======================
// Rate Limits
// ======================
export const RATE_LIMITS = {
  AI: { requests: 10, window: "1m" },           // AI endpoints
  AI_STREAMING: { requests: 5, window: "1m" },  // Streaming AI
  STANDARD: { requests: 100, window: "1m" },    // Normal endpoints
  AUTH: { requests: 5, window: "5m" },          // Auth attempts
} as const;

// ======================
// Validation Rules
// ======================
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 5000,
  STORY_MAX_LENGTH: 10_000,
  GUESTBOOK_MAX_LENGTH: 2000,
  OBITUARY_MAX_LENGTH: 20_000,
  EMAIL_MAX_LENGTH: 254,
} as const;

// ======================
// Pagination
// ======================
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ======================
// Demo User (for development)
// ======================
export const DEMO_USER = {
  id: "demo-user-123",
  email: "demo@foreverfields.com",
  name: "Demo User",
  subscriptionTier: "heritage" as const,
} as const;

// ======================
// Error Codes
// ======================
export const ERROR_CODES = {
  // Auth errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  SESSION_EXPIRED: "SESSION_EXPIRED",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Rate limiting
  RATE_LIMITED: "RATE_LIMITED",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  TIMEOUT: "TIMEOUT",

  // External service errors
  AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
  PAYMENT_ERROR: "PAYMENT_ERROR",
  STORAGE_ERROR: "STORAGE_ERROR",
} as const;

// ======================
// HTTP Status Codes
// ======================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ======================
// Subscription Tier Hierarchy
// ======================
export const TIER_HIERARCHY = ["free", "remember", "heritage", "legacy"] as const;

export type SubscriptionTier = (typeof TIER_HIERARCHY)[number];

export function tierMeetsRequirement(
  userTier: SubscriptionTier | undefined,
  requiredTier: SubscriptionTier
): boolean {
  const userIndex = TIER_HIERARCHY.indexOf(userTier || "free");
  const requiredIndex = TIER_HIERARCHY.indexOf(requiredTier);
  return userIndex >= requiredIndex;
}
