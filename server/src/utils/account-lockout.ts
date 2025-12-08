/**
 * Account Lockout Utility
 * Protects against brute force attacks by tracking failed login attempts
 */

import { prisma } from '../config/database';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

export interface LockoutStatus {
  isLocked: boolean;
  attemptsRemaining: number;
  lockoutEndsAt?: Date;
}

/**
 * Record a login attempt (success or failure)
 */
export const recordLoginAttempt = async (
  email: string,
  ipAddress: string,
  success: boolean,
  failReason?: string,
  userAgent?: string
): Promise<void> => {
  await prisma.loginAttempt.create({
    data: {
      email: email.toLowerCase(),
      ipAddress,
      userAgent,
      success,
      failReason,
    },
  });

  // Clean up old attempts (older than attempt window)
  const cutoffDate = new Date(Date.now() - ATTEMPT_WINDOW);
  await prisma.loginAttempt.deleteMany({
    where: {
      email: email.toLowerCase(),
      createdAt: { lt: cutoffDate },
    },
  });
};

/**
 * Check if an account or IP is currently locked out
 */
export const checkLockoutStatus = async (
  email: string,
  ipAddress: string
): Promise<LockoutStatus> => {
  const windowStart = new Date(Date.now() - ATTEMPT_WINDOW);

  // Get recent failed attempts by email
  const emailAttempts = await prisma.loginAttempt.findMany({
    where: {
      email: email.toLowerCase(),
      success: false,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get recent failed attempts by IP
  const ipAttempts = await prisma.loginAttempt.findMany({
    where: {
      ipAddress,
      success: false,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Check if locked by email
  if (emailAttempts.length >= MAX_FAILED_ATTEMPTS) {
    const oldestAttempt = emailAttempts[emailAttempts.length - 1];
    const lockoutEndsAt = new Date(oldestAttempt.createdAt.getTime() + LOCKOUT_DURATION);

    if (new Date() < lockoutEndsAt) {
      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockoutEndsAt,
      };
    }
  }

  // Check if locked by IP (prevents distributed brute force)
  if (ipAttempts.length >= MAX_FAILED_ATTEMPTS * 3) { // Higher threshold for IP
    const oldestAttempt = ipAttempts[ipAttempts.length - 1];
    const lockoutEndsAt = new Date(oldestAttempt.createdAt.getTime() + LOCKOUT_DURATION);

    if (new Date() < lockoutEndsAt) {
      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockoutEndsAt,
      };
    }
  }

  return {
    isLocked: false,
    attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - emailAttempts.length),
  };
};

/**
 * Clear lockout for an account (used after successful password reset or admin intervention)
 */
export const clearLockout = async (email: string): Promise<void> => {
  await prisma.loginAttempt.deleteMany({
    where: {
      email: email.toLowerCase(),
      success: false,
    },
  });
};
