/**
 * Authentication Validation Schemas
 * Using Zod for runtime type validation and security
 */

import { z } from 'zod';

/**
 * Password Requirements (Enhanced OWASP Recommendations):
 * - Minimum 12 characters (increased for better security)
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 * - No common passwords
 * - No excessive repeating characters
 */
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters for adequate security')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
  .refine(
    (val) => {
      // Check for common passwords
      const commonPasswords = [
        'password123',
        'admin123',
        'qwerty123',
        'letmein123',
        '123456789',
        'welcome123',
      ];
      return !commonPasswords.some((p) => val.toLowerCase().includes(p));
    },
    { message: 'Password is too common. Please choose a more unique password.' }
  )
  .refine(
    (val) => {
      // Check for excessive repeating characters (e.g., "aaaaaaa")
      return !/(.)\1{5,}/.test(val);
    },
    { message: 'Password contains too many repeating characters' }
  );

/**
 * Email validation with additional security checks
 */
const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()
  .transform(email => email.trim());

/**
 * Sign Up Schema
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  remember: z.boolean().optional(),
});

/**
 * Login Schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

/**
 * Forgot Password Schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset Password Schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

/**
 * Refresh Token Schema
 */
export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});
