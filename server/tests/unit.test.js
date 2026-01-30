/**
 * Forever Fields Backend - Unit Tests
 * Tests validation utilities without external dependencies
 *
 * Run with: node tests/unit.test.js
 */

// Test results
let testsPassed = 0;
let testsFailed = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${message}`);
    testsFailed++;
  }
};

// ============================================
// EMAIL VALIDATION TESTS
// ============================================

const testEmailValidation = () => {
  console.log('\n🧪 Email Validation');

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isValidEmail = (email) => {
    if (!email || email.length > 255) return false;
    return EMAIL_REGEX.test(email);
  };

  // Valid emails
  assert(isValidEmail('test@example.com'), 'test@example.com is valid');
  assert(isValidEmail('user.name@domain.org'), 'user.name@domain.org is valid');
  assert(isValidEmail('user+tag@example.co.uk'), 'user+tag@example.co.uk is valid');

  // Invalid emails
  assert(!isValidEmail(''), 'Empty string is invalid');
  assert(!isValidEmail('notanemail'), 'notanemail is invalid');
  assert(!isValidEmail('missing@tld'), 'missing@tld is invalid');
  assert(!isValidEmail('@nodomain.com'), '@nodomain.com is invalid');
  assert(!isValidEmail('spaces in@email.com'), 'spaces in@email.com is invalid');
  assert(!isValidEmail('a'.repeat(256) + '@example.com'), 'Too long email is invalid');
};

// ============================================
// PASSWORD VALIDATION TESTS
// ============================================

const testPasswordValidation = () => {
  console.log('\n🧪 Password Validation');

  const validatePasswordStrength = (password) => {
    const errors = [];

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Must contain lowercase');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Must contain uppercase');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Must contain number');
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      errors.push('Must contain special character');
    }

    if (/(.)\1{5,}/.test(password)) {
      errors.push('Too many repeating characters');
    }

    return { isValid: errors.length === 0, errors };
  };

  // Valid passwords
  const strongPassword = 'MyStr0ng!Pass#2024';
  assert(validatePasswordStrength(strongPassword).isValid, 'Strong password passes validation');

  // Invalid passwords
  assert(!validatePasswordStrength('short').isValid, 'Short password fails');
  assert(!validatePasswordStrength('nouppercase123!').isValid, 'Missing uppercase fails');
  assert(!validatePasswordStrength('NOLOWERCASE123!').isValid, 'Missing lowercase fails');
  assert(!validatePasswordStrength('NoNumbers!Only').isValid, 'Missing numbers fails');
  assert(!validatePasswordStrength('NoSpecial123abc').isValid, 'Missing special char fails');
  assert(!validatePasswordStrength('aaaaaaaaaaaa1A!').isValid, 'Repeating characters fails');
};

// ============================================
// UUID VALIDATION TESTS
// ============================================

const testUUIDValidation = () => {
  console.log('\n🧪 UUID Validation');

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValidUUID = (uuid) => UUID_REGEX.test(uuid);

  // Valid UUIDs
  assert(isValidUUID('550e8400-e29b-41d4-a716-446655440000'), 'Valid UUID v1 passes');
  assert(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8'), 'Valid UUID v1 variant passes');
  assert(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479'), 'Valid UUID v4 passes');

  // Invalid UUIDs
  assert(!isValidUUID(''), 'Empty string fails');
  assert(!isValidUUID('not-a-uuid'), 'Random string fails');
  assert(!isValidUUID('550e8400-e29b-41d4-a716-44665544000'), 'Too short fails');
  assert(!isValidUUID('550e8400-e29b-41d4-a716-4466554400000'), 'Too long fails');
  assert(!isValidUUID('550e8400e29b41d4a716446655440000'), 'Missing dashes fails');
};

// ============================================
// FILE TYPE VALIDATION TESTS
// ============================================

const testFileTypeValidation = () => {
  console.log('\n🧪 File Type Validation');

  const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];

  const isValidImageType = (mimeType) => IMAGE_MIME_TYPES.includes(mimeType.toLowerCase());
  const isValidAudioType = (mimeType) => AUDIO_MIME_TYPES.includes(mimeType.toLowerCase());

  // Valid image types
  assert(isValidImageType('image/jpeg'), 'JPEG is valid image');
  assert(isValidImageType('image/png'), 'PNG is valid image');
  assert(isValidImageType('image/webp'), 'WebP is valid image');
  assert(isValidImageType('IMAGE/JPEG'), 'Case insensitive image check');

  // Invalid image types
  assert(!isValidImageType('image/svg+xml'), 'SVG is not allowed');
  assert(!isValidImageType('application/pdf'), 'PDF is not an image');
  assert(!isValidImageType('text/html'), 'HTML is not an image');

  // Valid audio types
  assert(isValidAudioType('audio/mpeg'), 'MPEG audio is valid');
  assert(isValidAudioType('audio/wav'), 'WAV is valid');

  // Invalid audio types
  assert(!isValidAudioType('video/mp4'), 'MP4 video is not audio');
  assert(!isValidAudioType('audio/midi'), 'MIDI is not allowed');
};

// ============================================
// FILE SIZE VALIDATION TESTS
// ============================================

const testFileSizeValidation = () => {
  console.log('\n🧪 File Size Validation');

  const isValidFileSize = (size, maxSizeMB) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size > 0 && size <= maxSizeBytes;
  };

  // Valid sizes
  assert(isValidFileSize(1024, 10), '1KB within 10MB limit');
  assert(isValidFileSize(5 * 1024 * 1024, 10), '5MB within 10MB limit');
  assert(isValidFileSize(10 * 1024 * 1024, 10), '10MB at exact limit');

  // Invalid sizes
  assert(!isValidFileSize(0, 10), 'Zero size is invalid');
  assert(!isValidFileSize(-1, 10), 'Negative size is invalid');
  assert(!isValidFileSize(11 * 1024 * 1024, 10), '11MB exceeds 10MB limit');
};

// ============================================
// DATE VALIDATION TESTS
// ============================================

const testDateValidation = () => {
  console.log('\n🧪 Date Validation');

  const isDateInPast = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.getTime() < Date.now();
  };

  const isDateInFuture = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.getTime() > Date.now();
  };

  const isValidDateRange = (startDate, endDate) => {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    return start.getTime() < end.getTime();
  };

  // Past dates
  assert(isDateInPast('2020-01-01'), '2020-01-01 is in the past');
  assert(isDateInPast(new Date('2000-01-01')), 'Date object in past');

  // Future dates
  assert(isDateInFuture('2030-01-01'), '2030-01-01 is in the future');
  assert(!isDateInFuture('2020-01-01'), '2020-01-01 is not in future');

  // Date ranges
  assert(isValidDateRange('2020-01-01', '2020-12-31'), 'Valid date range');
  assert(!isValidDateRange('2020-12-31', '2020-01-01'), 'Invalid range (end before start)');
  assert(!isValidDateRange('2020-01-01', '2020-01-01'), 'Same date is invalid range');
};

// ============================================
// SANITIZATION TESTS
// ============================================

const testSanitization = () => {
  console.log('\n🧪 Sanitization');

  const sanitizeString = (input) => {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .replace(/['"]/g, '')
      .slice(0, 1000);
  };

  const sanitizeHTML = (html) => {
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const stripHTMLTags = (html) => html.replace(/<[^>]*>/g, '');

  // String sanitization
  assert(sanitizeString('  hello  ') === 'hello', 'Trims whitespace');
  assert(sanitizeString('<script>') === 'script', 'Removes angle brackets');
  assert(sanitizeString("test'quote") === 'testquote', 'Removes quotes');
  assert(sanitizeString('a'.repeat(2000)).length === 1000, 'Truncates to 1000 chars');

  // HTML sanitization
  assert(sanitizeHTML('<script>') === '&lt;script&gt;', 'Escapes HTML brackets');
  assert(sanitizeHTML('"test"') === '&quot;test&quot;', 'Escapes quotes');

  // HTML stripping
  assert(stripHTMLTags('<p>Hello</p>') === 'Hello', 'Strips HTML tags');
  assert(stripHTMLTags('<div><span>Nested</span></div>') === 'Nested', 'Strips nested tags');
};

// ============================================
// SOCIAL URL VALIDATION TESTS
// ============================================

const testSocialURLValidation = () => {
  console.log('\n🧪 Social URL Validation');

  const URL_PATTERNS = {
    facebook: /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\/.+$/i,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/.+$/i,
    tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@.+$/i,
    youtube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/i,
  };

  const isValidSocialUrl = (url, platform) => {
    if (!url || !url.trim()) return true; // Empty is allowed (optional)
    try {
      const parsed = new URL(url.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      return URL_PATTERNS[platform].test(url.trim());
    } catch {
      return false;
    }
  };

  // Valid URLs
  assert(isValidSocialUrl('https://facebook.com/user', 'facebook'), 'Valid Facebook URL');
  assert(isValidSocialUrl('https://www.instagram.com/user', 'instagram'), 'Valid Instagram URL');
  assert(isValidSocialUrl('https://tiktok.com/@user', 'tiktok'), 'Valid TikTok URL');
  assert(isValidSocialUrl('https://youtube.com/watch?v=123', 'youtube'), 'Valid YouTube URL');
  assert(isValidSocialUrl('', 'facebook'), 'Empty URL is allowed');
  assert(isValidSocialUrl(null, 'facebook'), 'Null URL is allowed');

  // Invalid URLs
  assert(!isValidSocialUrl('not-a-url', 'facebook'), 'Invalid URL fails');
  assert(!isValidSocialUrl('https://twitter.com/user', 'facebook'), 'Wrong platform fails');
  assert(!isValidSocialUrl('ftp://facebook.com/user', 'facebook'), 'Wrong protocol fails');
};

// ============================================
// RUN ALL TESTS
// ============================================

const runTests = () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Forever Fields Backend - Unit Tests                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  testEmailValidation();
  testPasswordValidation();
  testUUIDValidation();
  testFileTypeValidation();
  testFileSizeValidation();
  testDateValidation();
  testSanitization();
  testSocialURLValidation();

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Test Results                                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📊 Total:  ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 All unit tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
};

runTests();
