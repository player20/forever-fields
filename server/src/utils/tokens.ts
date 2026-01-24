/**
 * Token Generation Utilities
 * Secure random token generation for magic links and invitations
 */

import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { customAlphabet } from 'nanoid';

// ==================================================
// CONSTANTS
// ==================================================

/** Length of secure token in bytes (32 bytes = 64 hex characters) */
const TOKEN_BYTES = 32;

/** Default length for URL-safe tokens (nanoid) */
const URL_SAFE_TOKEN_DEFAULT_LENGTH = 21;

/** Alphabet for URL-safe tokens (alphanumeric, no special characters) */
const URL_SAFE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** Magic link expiration time in minutes */
export const MAGIC_LINK_EXPIRATION_MINUTES = 15;

/** Invitation expiration time in days */
export const INVITATION_EXPIRATION_DAYS = 7;

/** Session token expiration time in minutes */
export const SESSION_TOKEN_EXPIRATION_MINUTES = 10;

// ==================================================
// TOKEN GENERATION
// ==================================================

/**
 * Generate a secure 64-character token (32 bytes = 64 hex chars)
 * Uses cryptographically secure random bytes
 */
export const generateSecureToken = (): string => {
  return randomBytes(TOKEN_BYTES).toString('hex');
};

/**
 * Hash a token using SHA-256
 * Used to store tokens securely in database
 */
export const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

/**
 * Verify a token against a hashed token using timing-safe comparison
 * Prevents timing attacks
 */
export const verifyToken = (plainToken: string, hashedToken: string): boolean => {
  try {
    const hashedPlainToken = hashToken(plainToken);
    return timingSafeEqual(
      Buffer.from(hashedPlainToken),
      Buffer.from(hashedToken)
    );
  } catch (error) {
    // Buffer lengths don't match or other error
    return false;
  }
};

/**
 * Generate a URL-safe token using nanoid
 * Useful for short codes and public identifiers
 */
export const generateUrlSafeToken = (length: number = URL_SAFE_TOKEN_DEFAULT_LENGTH): string => {
  const nanoid = customAlphabet(URL_SAFE_ALPHABET, length);
  return nanoid();
};

// ==================================================
// EXPIRATION HELPERS
// ==================================================

/**
 * Generate expiration date for magic links (15 minutes from now)
 */
export const getMagicLinkExpiration = (): Date => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + MAGIC_LINK_EXPIRATION_MINUTES);
  return expiresAt;
};

/**
 * Generate expiration date for invitations (7 days from now)
 */
export const getInvitationExpiration = (): Date => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRATION_DAYS);
  return expiresAt;
};

/**
 * Generate expiration date for session tokens (10 minutes from now)
 */
export const getSessionTokenExpiration = (): Date => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + SESSION_TOKEN_EXPIRATION_MINUTES);
  return expiresAt;
};
