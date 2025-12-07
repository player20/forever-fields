/**
 * Validation Utilities
 * Reusable validation functions for common patterns
 * Prevents code duplication and ensures consistency
 */

/**
 * Social Media URL Validators
 */

const URL_PATTERNS = {
  facebook: /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\/.+$/i,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/.+$/i,
  tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@.+$/i,
  twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+$/i,
  linkedin: /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/.+$/i,
  youtube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/i,
} as const;

export type SocialPlatform = keyof typeof URL_PATTERNS;

/**
 * Validate and sanitize a social media URL
 * @throws Error if URL is invalid
 */
export const validateSocialUrl = (
  url: string | null | undefined,
  platform: SocialPlatform
): string | null => {
  if (!url || url.trim() === '') {
    return null;
  }

  const trimmed = url.trim();

  // Basic URL validation
  try {
    const parsed = new URL(trimmed);

    // Must be http or https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol - must be http or https');
    }

    // Check platform-specific pattern
    if (!URL_PATTERNS[platform].test(trimmed)) {
      throw new Error(`Invalid ${platform} URL format`);
    }

    // Sanitize: remove dangerous characters
    const sanitized = trimmed.replace(/[<>"']/g, '');

    // Max length check (prevent DoS)
    if (sanitized.length > 500) {
      throw new Error('URL too long (max 500 characters)');
    }

    return sanitized;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Invalid URL format: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Validate multiple social URLs at once
 * Returns object with validated URLs or throws on first invalid URL
 */
export const validateSocialUrls = (
  urls: Partial<Record<SocialPlatform, string | null>>
): Partial<Record<SocialPlatform, string | null>> => {
  const validated: Partial<Record<SocialPlatform, string | null>> = {};

  for (const [platform, url] of Object.entries(urls)) {
    validated[platform as SocialPlatform] = validateSocialUrl(
      url,
      platform as SocialPlatform
    );
  }

  return validated;
};

/**
 * Email Validators
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || email.length > 255) return false;
  return EMAIL_REGEX.test(email);
};

/**
 * Sanitize email (lowercase, trim)
 */
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Password Validators
 */

/**
 * Check password strength
 * Returns object with validation results
 */
export const validatePasswordStrength = (
  password: string
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password123',
    'admin123',
    'qwerty123',
    'letmein123',
    '123456789',
  ];
  const lowercasePassword = password.toLowerCase();
  if (commonPasswords.some((common) => lowercasePassword.includes(common))) {
    errors.push('Password is too common');
  }

  // Check for repeating characters (e.g., "aaaaaa")
  if (/(.)\1{5,}/.test(password)) {
    errors.push('Password contains too many repeating characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * UUID Validators
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  return UUID_REGEX.test(uuid);
};

/**
 * File Validators
 */

const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
];

/**
 * Validate image file type
 */
export const isValidImageType = (mimeType: string): boolean => {
  return IMAGE_MIME_TYPES.includes(mimeType.toLowerCase());
};

/**
 * Validate audio file type
 */
export const isValidAudioType = (mimeType: string): boolean => {
  return AUDIO_MIME_TYPES.includes(mimeType.toLowerCase());
};

/**
 * Validate file size (in bytes)
 */
export const isValidFileSize = (size: number, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxSizeBytes;
};

/**
 * Date Validators
 */

/**
 * Validate date is in the past
 */
export const isDateInPast = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() < Date.now();
};

/**
 * Validate date is in the future
 */
export const isDateInFuture = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() > Date.now();
};

/**
 * Validate date range
 */
export const isValidDateRange = (
  startDate: Date | string,
  endDate: Date | string
): boolean => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  return start.getTime() < end.getTime();
};

/**
 * Sanitization Utilities
 */

/**
 * Sanitize string input (remove dangerous characters)
 */
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/['"]/g, '') // Remove quotes
    .slice(0, 1000); // Limit length
};

/**
 * Sanitize HTML (basic - for user-generated content)
 */
export const sanitizeHTML = (html: string): string => {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Strip HTML tags completely
 */
export const stripHTMLTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};
