/**
 * Validators Utility Tests
 * Tests for validation functions
 */

import {
  validateSocialUrl,
  validateSocialUrls,
  isValidEmail,
  sanitizeEmail,
  validatePasswordStrength,
  isValidUUID,
  isValidImageType,
  isValidAudioType,
  isValidFileSize,
  sanitizeString,
  sanitizeHTML,
  stripHTMLTags,
} from '../../src/utils/validators';

describe('Social URL Validators', () => {
  describe('validateSocialUrl', () => {
    it('should validate correct Facebook URL', () => {
      const url = 'https://facebook.com/johndoe';
      expect(validateSocialUrl(url, 'facebook')).toBe(url);
    });

    it('should validate correct Instagram URL', () => {
      const url = 'https://instagram.com/johndoe';
      expect(validateSocialUrl(url, 'instagram')).toBe(url);
    });

    it('should validate correct TikTok URL', () => {
      const url = 'https://tiktok.com/@johndoe';
      expect(validateSocialUrl(url, 'tiktok')).toBe(url);
    });

    it('should return null for empty string', () => {
      expect(validateSocialUrl('', 'facebook')).toBeNull();
      expect(validateSocialUrl(null, 'facebook')).toBeNull();
      expect(validateSocialUrl(undefined, 'facebook')).toBeNull();
    });

    it('should reject invalid protocol', () => {
      expect(() => {
        validateSocialUrl('ftp://facebook.com/test', 'facebook');
      }).toThrow('Invalid protocol');
    });

    it('should reject invalid Facebook URL format', () => {
      expect(() => {
        validateSocialUrl('https://instagram.com/test', 'facebook');
      }).toThrow('Invalid facebook URL format');
    });

    it('should reject URL that is too long', () => {
      const longUrl = 'https://facebook.com/' + 'a'.repeat(500);
      expect(() => {
        validateSocialUrl(longUrl, 'facebook');
      }).toThrow('URL too long');
    });

    it('should sanitize dangerous characters', () => {
      const url = 'https://facebook.com/test<script>';
      const result = validateSocialUrl(url, 'facebook');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should handle URLs with www prefix', () => {
      const url = 'https://www.facebook.com/johndoe';
      expect(validateSocialUrl(url, 'facebook')).toBeTruthy();
    });

    it('should trim whitespace', () => {
      const url = '  https://facebook.com/test  ';
      const result = validateSocialUrl(url, 'facebook');
      expect(result).toBe('https://facebook.com/test');
    });
  });

  describe('validateSocialUrls', () => {
    it('should validate multiple URLs', () => {
      const urls = {
        facebook: 'https://facebook.com/test',
        instagram: 'https://instagram.com/test',
        tiktok: 'https://tiktok.com/@test',
      };

      const result = validateSocialUrls(urls);
      expect(result.facebook).toBe(urls.facebook);
      expect(result.instagram).toBe(urls.instagram);
      expect(result.tiktok).toBe(urls.tiktok);
    });

    it('should handle null values', () => {
      const urls = {
        facebook: 'https://facebook.com/test',
        instagram: null,
        tiktok: undefined,
      };

      const result = validateSocialUrls(urls);
      expect(result.facebook).toBe(urls.facebook);
      expect(result.instagram).toBeNull();
      expect(result.tiktok).toBeNull();
    });

    it('should throw on first invalid URL', () => {
      const urls = {
        facebook: 'https://facebook.com/test',
        instagram: 'invalid-url',
      };

      expect(() => {
        validateSocialUrls(urls);
      }).toThrow();
    });
  });
});

describe('Email Validators', () => {
  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test@example')).toBe(false);
    });

    it('should reject emails over 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase and trim email', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });

    it('should handle already clean email', () => {
      expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
    });
  });
});

describe('Password Validators', () => {
  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = validatePasswordStrength('MySecureP@ssw0rd123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = validatePasswordStrength('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 12 characters long'
      );
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('ALLUPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter'
      );
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('alllowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('NoNumbersHere!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one number'
      );
    });

    it('should reject password without special character', () => {
      const result = validatePasswordStrength('NoSpecialChars123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one special character'
      );
    });

    it('should reject common passwords', () => {
      const result = validatePasswordStrength('Password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is too common');
    });

    it('should reject passwords with repeating characters', () => {
      const result = validatePasswordStrength('Aaaaaa123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password contains too many repeating characters'
      );
    });

    it('should reject password over 128 characters', () => {
      const longPassword = 'A1!' + 'a'.repeat(130);
      const result = validatePasswordStrength(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must be less than 128 characters'
      );
    });
  });
});

describe('UUID Validators', () => {
  it('should validate correct UUIDs', () => {
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('should reject invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false); // Too short
    expect(isValidUUID('123e4567-e89b-12d3-a456-4266141740000')).toBe(false); // Too long
    expect(isValidUUID('')).toBe(false);
  });
});

describe('File Validators', () => {
  describe('isValidImageType', () => {
    it('should accept valid image MIME types', () => {
      expect(isValidImageType('image/jpeg')).toBe(true);
      expect(isValidImageType('image/png')).toBe(true);
      expect(isValidImageType('image/gif')).toBe(true);
      expect(isValidImageType('image/webp')).toBe(true);
    });

    it('should reject invalid MIME types', () => {
      expect(isValidImageType('application/pdf')).toBe(false);
      expect(isValidImageType('text/plain')).toBe(false);
      expect(isValidImageType('audio/mpeg')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isValidImageType('IMAGE/JPEG')).toBe(true);
    });
  });

  describe('isValidAudioType', () => {
    it('should accept valid audio MIME types', () => {
      expect(isValidAudioType('audio/mpeg')).toBe(true);
      expect(isValidAudioType('audio/mp3')).toBe(true);
      expect(isValidAudioType('audio/wav')).toBe(true);
    });

    it('should reject invalid MIME types', () => {
      expect(isValidAudioType('image/jpeg')).toBe(false);
      expect(isValidAudioType('video/mp4')).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('should accept files within size limit', () => {
      const oneMB = 1024 * 1024;
      expect(isValidFileSize(oneMB, 5)).toBe(true); // 1MB file, 5MB limit
      expect(isValidFileSize(oneMB * 5, 5)).toBe(true); // Exactly at limit
    });

    it('should reject files over size limit', () => {
      const sixMB = 6 * 1024 * 1024;
      expect(isValidFileSize(sixMB, 5)).toBe(false);
    });

    it('should reject zero or negative size', () => {
      expect(isValidFileSize(0, 5)).toBe(false);
      expect(isValidFileSize(-100, 5)).toBe(false);
    });
  });
});

describe('Sanitization Utilities', () => {
  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  test  ')).toBe('test');
    });

    it('should remove HTML brackets', () => {
      expect(sanitizeString('test<script>alert(1)</script>'))
        .not.toContain('<');
      expect(sanitizeString('test<script>alert(1)</script>'))
        .not.toContain('>');
    });

    it('should remove quotes', () => {
      const result = sanitizeString('test"quoted\'text');
      expect(result).not.toContain('"');
      expect(result).not.toContain("'");
    });

    it('should limit length to 1000 characters', () => {
      const longString = 'a'.repeat(2000);
      expect(sanitizeString(longString)).toHaveLength(1000);
    });
  });

  describe('sanitizeHTML', () => {
    it('should escape HTML entities', () => {
      const result = sanitizeHTML('<script>alert("XSS")</script>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&quot;');
    });

    it('should handle already safe text', () => {
      expect(sanitizeHTML('safe text')).toBe('safe text');
    });
  });

  describe('stripHTMLTags', () => {
    it('should remove all HTML tags', () => {
      const result = stripHTMLTags('<p>Hello <strong>world</strong></p>');
      expect(result).toBe('Hello world');
    });

    it('should handle text without tags', () => {
      expect(stripHTMLTags('plain text')).toBe('plain text');
    });
  });
});
