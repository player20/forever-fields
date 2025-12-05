/**
 * Token Generation Utilities
 * Secure random token generation for magic links and invitations
 */

import { randomBytes } from 'crypto';
import { customAlphabet } from 'nanoid';

/**
 * Generate a secure 32-character token
 * Uses cryptographically secure random bytes
 */
export const generateSecureToken = (): string => {
  return randomBytes(32).toString('hex').substring(0, 32);
};

/**
 * Generate a URL-safe token using nanoid
 * Useful for short codes and public identifiers
 */
export const generateUrlSafeToken = (length: number = 21): string => {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const nanoid = customAlphabet(alphabet, length);
  return nanoid();
};

/**
 * Generate expiration date for magic links (15 minutes from now)
 */
export const getMagicLinkExpiration = (): Date => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);
  return expiresAt;
};

/**
 * Generate expiration date for invitations (7 days from now)
 */
export const getInvitationExpiration = (): Date => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
};
