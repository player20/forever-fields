/**
 * Password Breach Checking
 * Integrates with HaveIBeenPwned API to check if passwords have been exposed in data breaches
 */

import crypto from 'crypto';

/**
 * Check if a password has been exposed in known data breaches using HaveIBeenPwned API
 * Uses k-anonymity to protect the password - only sends first 5 chars of SHA-1 hash
 */
export const checkPasswordBreach = async (password: string): Promise<boolean> => {
  try {
    // Create SHA-1 hash of password
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();

    // Send only first 5 characters (k-anonymity model)
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    // Query HaveIBeenPwned API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'Forever-Fields-Memorial-App',
      },
    });

    if (!response.ok) {
      // If API fails, allow password (don't block users due to API issues)
      console.warn('[SECURITY] HaveIBeenPwned API unavailable, skipping breach check');
      return false;
    }

    const text = await response.text();

    // Response format: [hash-suffix]:[count]\n[hash-suffix]:[count]\n...
    // Check if our suffix appears in the response
    const lines = text.split('\n');
    for (const line of lines) {
      const [hashSuffix] = line.split(':');
      if (hashSuffix === suffix) {
        return true; // Password found in breach database
      }
    }

    return false; // Password not found in breaches
  } catch (error) {
    console.error('[SECURITY] Password breach check error:', error);
    // On error, allow password (don't block users due to API issues)
    return false;
  }
};

/**
 * Get breach count for a password (for informational purposes)
 */
export const getPasswordBreachCount = async (password: string): Promise<number> => {
  try {
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'Forever-Fields-Memorial-App',
      },
    });

    if (!response.ok) {
      return 0;
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return parseInt(count, 10);
      }
    }

    return 0;
  } catch (error) {
    console.error('[SECURITY] Breach count check error:', error);
    return 0;
  }
};
