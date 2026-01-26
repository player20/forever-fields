/**
 * Application Constants
 * Centralized configuration values and magic numbers
 */

// ==================================================
// RATE LIMITING
// ==================================================

/** Rate limit window in milliseconds (15 minutes) */
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/** Rate limit window in milliseconds (1 minute) */
export const RATE_LIMIT_WINDOW_1MIN_MS = 60 * 1000;

/** Max authentication requests per window in production */
export const AUTH_RATE_LIMIT_PROD = 10;

/** Max authentication requests per window in development */
export const AUTH_RATE_LIMIT_DEV = 100;

/** Max general API requests per window */
export const API_RATE_LIMIT = 100;

/** Max candle lighting requests per minute */
export const CANDLE_RATE_LIMIT = 3;

/** Max upload requests per window */
export const UPLOAD_RATE_LIMIT = 10;

/** Max strict rate limit requests per minute */
export const STRICT_RATE_LIMIT = 10;

// ==================================================
// SECURITY HEADERS
// ==================================================

/** HSTS max age in seconds (1 year) */
export const HSTS_MAX_AGE = 31536000;

/** CORS max age in seconds (24 hours) */
export const CORS_MAX_AGE = 86400;

// ==================================================
// PAGINATION
// ==================================================

/** Default page size for list endpoints */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum page size for list endpoints */
export const MAX_PAGE_SIZE = 100;

// ==================================================
// STRING LENGTHS
// ==================================================

/** Maximum length for user name */
export const MAX_NAME_LENGTH = 100;

/** Maximum length for email */
export const MAX_EMAIL_LENGTH = 255;

/** Maximum length for memorial title */
export const MAX_MEMORIAL_TITLE_LENGTH = 100;

/** Maximum length for memorial description */
export const MAX_MEMORIAL_DESCRIPTION_LENGTH = 2000;

/** Maximum length for memory text */
export const MAX_MEMORY_TEXT_LENGTH = 5000;

// ==================================================
// PASSWORD REQUIREMENTS
// ==================================================

/** Minimum password length */
export const MIN_PASSWORD_LENGTH = 8;

/** Maximum password length */
export const MAX_PASSWORD_LENGTH = 128;

// ==================================================
// FILE UPLOADS
// ==================================================

/** Maximum file size in bytes (5 MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Maximum image size in bytes (10 MB) */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/** Allowed image MIME types */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/** Allowed audio MIME types */
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/webm'];
