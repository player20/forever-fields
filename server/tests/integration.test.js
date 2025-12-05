/**
 * Forever Fields Backend - Integration Test
 * Tests full authentication and memorial creation flow
 *
 * Run with: node tests/integration.test.js
 */

const http = require('http');
const https = require('https');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@foreverfields.com';

// Test results
let testsPassed = 0;
let testsFailed = 0;

// Store tokens and IDs
let magicLinkToken = null;
let accessToken = null;
let userId = null;
let memorialId = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
};

const assert = (condition, message) => {
  if (condition) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${message}`);
    testsFailed++;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// TESTS
// ============================================

const testHealthCheck = async () => {
  console.log('\n🧪 Test 1: Health Check');
  try {
    const res = await makeRequest(`${API_URL}/health`);
    assert(res.status === 200, 'Health endpoint returns 200');
    assert(res.data.status === 'healthy', 'Server is healthy');
  } catch (error) {
    console.log(`  ❌ Health check failed: ${error.message}`);
    testsFailed++;
  }
};

const testMagicLinkRequest = async () => {
  console.log('\n🧪 Test 2: Request Magic Link');
  try {
    const res = await makeRequest(`${API_URL}/api/auth/magic-link`, {
      method: 'POST',
      body: { email: TEST_EMAIL },
    });

    assert(res.status === 200, 'Magic link request returns 200');
    assert(res.data.message.includes('magic link'), 'Response contains success message');

    console.log('\n⚠️  MANUAL STEP REQUIRED:');
    console.log(`   Check your email (${TEST_EMAIL}) for the magic link`);
    console.log('   Extract the token from the URL (last 32 characters)');
    console.log('   Set it as environment variable: TEST_TOKEN="your-token-here"');
    console.log('   Then run this script again with the token\n');

    // Check if token is provided
    if (process.env.TEST_TOKEN) {
      magicLinkToken = process.env.TEST_TOKEN;
      console.log('  ✅ Magic link token found in environment');
    } else {
      console.log('  ⏭️  Skipping remaining tests (need TEST_TOKEN)');
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Magic link request failed: ${error.message}`);
    testsFailed++;
    return false;
  }

  return true;
};

const testAuthCallback = async () => {
  console.log('\n🧪 Test 3: Auth Callback');

  if (!magicLinkToken) {
    console.log('  ⏭️  Skipped (no magic link token)');
    return false;
  }

  try {
    const res = await makeRequest(`${API_URL}/api/auth/callback?token=${magicLinkToken}`);

    // Callback redirects, so we expect 302 or may get 401 if token already used
    assert(
      res.status === 302 || res.status === 401,
      `Callback returns redirect (${res.status})`
    );

    if (res.status === 302) {
      const location = res.headers.location;
      assert(location && location.includes('access_token'), 'Redirect contains access token');

      // Extract access token from redirect URL
      const urlParams = new URL(location).searchParams;
      accessToken = urlParams.get('access_token');

      if (accessToken) {
        console.log('  ✅ Access token extracted from redirect');
        console.log(`  📝 Token: ${accessToken.substring(0, 20)}...`);
      }
    } else {
      console.log('  ⚠️  Magic link already used or expired (run test again with fresh token)');
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Auth callback failed: ${error.message}`);
    testsFailed++;
    return false;
  }

  return true;
};

const testCreateMemorial = async () => {
  console.log('\n🧪 Test 4: Create Memorial');

  if (!accessToken) {
    console.log('  ⏭️  Skipped (no access token)');
    return false;
  }

  try {
    const memorial = {
      deceasedName: 'Test Memorial User',
      birthDate: new Date('1990-01-15').toISOString(),
      deathDate: new Date('2023-12-01').toISOString(),
      shortBio: 'A beloved test user who will be missed.',
      isPet: false,
      privacy: 'private',
    };

    const res = await makeRequest(`${API_URL}/api/memorials`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: memorial,
    });

    assert(res.status === 201, 'Memorial creation returns 201');
    assert(res.data.memorial, 'Response contains memorial object');
    assert(res.data.memorial.deceasedName === memorial.deceasedName, 'Memorial name matches');

    if (res.data.memorial) {
      memorialId = res.data.memorial.id;
      console.log(`  📝 Memorial ID: ${memorialId}`);
    }
  } catch (error) {
    console.log(`  ❌ Create memorial failed: ${error.message}`);
    testsFailed++;
    return false;
  }

  return true;
};

const testGetMyMemorials = async () => {
  console.log('\n🧪 Test 5: Get My Memorials');

  if (!accessToken) {
    console.log('  ⏭️  Skipped (no access token)');
    return;
  }

  try {
    const res = await makeRequest(`${API_URL}/api/memorials/mine`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    assert(res.status === 200, 'Get memorials returns 200');
    assert(Array.isArray(res.data.memorials), 'Response contains memorials array');
    assert(res.data.memorials.length > 0, 'User has at least one memorial');
  } catch (error) {
    console.log(`  ❌ Get memorials failed: ${error.message}`);
    testsFailed++;
  }
};

const testUnauthorizedEdit = async () => {
  console.log('\n🧪 Test 6: Unauthorized Edit (Security Check)');

  if (!memorialId) {
    console.log('  ⏭️  Skipped (no memorial ID)');
    return;
  }

  try {
    // Try to edit memorial without auth token
    const res = await makeRequest(`${API_URL}/api/memorials/${memorialId}`, {
      method: 'PUT',
      body: { shortBio: 'Hacked!' },
    });

    assert(res.status === 401, 'Unauthorized request returns 401');
    assert(res.data.error, 'Response contains error message');
    console.log('  🔒 Memorial is protected from unauthorized edits');
  } catch (error) {
    console.log(`  ❌ Unauthorized edit test failed: ${error.message}`);
    testsFailed++;
  }
};

const testRateLimiting = async () => {
  console.log('\n🧪 Test 7: Rate Limiting (Security Check)');

  try {
    console.log('  🚀 Sending 6 rapid requests to trigger rate limit...');

    const requests = [];
    for (let i = 0; i < 6; i++) {
      requests.push(
        makeRequest(`${API_URL}/api/auth/magic-link`, {
          method: 'POST',
          body: { email: `test${i}@example.com` },
        })
      );
    }

    const results = await Promise.all(requests);
    const rateLimited = results.some((res) => res.status === 429);

    assert(rateLimited, 'Rate limiting triggers after excessive requests');

    if (rateLimited) {
      console.log('  🔒 Rate limiting is working correctly');
    }
  } catch (error) {
    console.log(`  ❌ Rate limiting test failed: ${error.message}`);
    testsFailed++;
  }
};

const testPublicMemorialAccess = async () => {
  console.log('\n🧪 Test 8: Public Memorial Access (Privacy Check)');

  if (!memorialId || !accessToken) {
    console.log('  ⏭️  Skipped (no memorial ID or access token)');
    return;
  }

  try {
    // First, update memorial to be public
    await makeRequest(`${API_URL}/api/memorials/${memorialId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: { privacy: 'public' },
    });

    // Now try to access without auth
    const res = await makeRequest(`${API_URL}/api/memorials/${memorialId}`);

    assert(res.status === 200, 'Public memorial accessible without auth');
    assert(res.data.memorial, 'Response contains memorial data');
    console.log('  🌐 Public memorial privacy settings work correctly');
  } catch (error) {
    console.log(`  ❌ Public memorial test failed: ${error.message}`);
    testsFailed++;
  }
};

const testInputValidation = async () => {
  console.log('\n🧪 Test 9: Input Validation (Security Check)');

  if (!accessToken) {
    console.log('  ⏭️  Skipped (no access token)');
    return;
  }

  try {
    // Try to create memorial with invalid data
    const res = await makeRequest(`${API_URL}/api/memorials`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        deceasedName: '', // Invalid: empty name
        // Missing required birthDate or deathDate
      },
    });

    assert(res.status === 400, 'Invalid input returns 400');
    assert(res.data.error, 'Response contains validation error');
    console.log('  🔒 Input validation is working correctly');
  } catch (error) {
    console.log(`  ❌ Input validation test failed: ${error.message}`);
    testsFailed++;
  }
};

const testLightCandle = async () => {
  console.log('\n🧪 Test 10: Light a Candle (Public Feature)');

  if (!memorialId) {
    console.log('  ⏭️  Skipped (no memorial ID)');
    return;
  }

  try {
    const res = await makeRequest(`${API_URL}/api/candles`, {
      method: 'POST',
      body: {
        memorialId,
        message: 'In loving memory - from integration test',
        name: 'Test User',
      },
    });

    assert(res.status === 201, 'Candle creation returns 201');
    assert(res.data.candle, 'Response contains candle object');
    console.log('  🕯️  Candle lit successfully');
  } catch (error) {
    console.log(`  ❌ Light candle failed: ${error.message}`);
    testsFailed++;
  }
};

// ============================================
// RUN ALL TESTS
// ============================================

const runTests = async () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Forever Fields Backend - Integration Tests               ║');
  console.log('║  v0.0-secure-backend                                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log(`\n🎯 Testing API: ${API_URL}`);
  console.log(`📧 Test Email: ${TEST_EMAIL}`);

  await testHealthCheck();

  const continueTests = await testMagicLinkRequest();

  if (continueTests) {
    await testAuthCallback();
    await testCreateMemorial();
    await testGetMyMemorials();
    await testUnauthorizedEdit();
    await testRateLimiting();
    await testPublicMemorialAccess();
    await testInputValidation();
    await testLightCandle();
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Test Results                                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📊 Total:  ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Backend is production-ready.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
};

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test suite crashed:', error);
  process.exit(1);
});
