/**
 * Forever Fields Backend - Memorial CRUD Test
 * Tests full memorial creation, retrieval, update, and access control
 *
 * Run with: node tests/memorial-crud.test.js
 */

const http = require('http');
const https = require('https');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@foreverfields.com';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // From magic link auth

// Test results
let testsPassed = 0;
let testsFailed = 0;

// Store test data
let createdMemorialId = null;
let createdMemorial = null;

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

// ============================================
// TESTS
// ============================================

const testCreateMemorial = async () => {
  console.log('\n🧪 Test 1: Create Memorial (POST /api/memorials)');

  if (!ACCESS_TOKEN) {
    console.log('  ⏭️  Skipped (no ACCESS_TOKEN provided)');
    console.log('     Set ACCESS_TOKEN environment variable with a valid auth token');
    return false;
  }

  try {
    const memorial = {
      deceasedName: 'Test User Memorial',
      birthDate: new Date('1950-03-15').toISOString(),
      deathDate: new Date('2024-01-10').toISOString(),
      shortBio: 'A beloved test user who will be greatly missed. This is a test memorial for the Forever Fields platform.',
      isPet: false,
      privacy: 'link',
      songYoutubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      restingType: 'buried',
      restingLocation: {
        lat: 36.1699,
        lng: -115.1398,
        address: '123 Memorial Lane, Las Vegas, NV',
        name: 'Peaceful Gardens Cemetery',
      },
    };

    const res = await makeRequest(`${API_URL}/api/memorials`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: memorial,
    });

    assert(res.status === 201, 'Memorial creation returns 201');
    assert(res.data.memorial, 'Response contains memorial object');
    assert(res.data.memorial.deceasedName === memorial.deceasedName, 'Memorial name matches');
    assert(res.data.memorial.privacy === memorial.privacy, 'Privacy setting matches');
    assert(res.data.memorial.isPet === false, 'isPet flag is correct');

    if (res.data.memorial) {
      createdMemorialId = res.data.memorial.id;
      createdMemorial = res.data.memorial;
      console.log(`  📝 Memorial ID: ${createdMemorialId}`);
      console.log(`  📝 Privacy: ${createdMemorial.privacy}`);
    }

    return true;
  } catch (error) {
    console.log(`  ❌ Create memorial failed: ${error.message}`);
    testsFailed++;
    return false;
  }
};

const testGetMyMemorials = async () => {
  console.log('\n🧪 Test 2: Get My Memorials (GET /api/memorials/mine)');

  if (!ACCESS_TOKEN) {
    console.log('  ⏭️  Skipped (no ACCESS_TOKEN)');
    return;
  }

  try {
    const res = await makeRequest(`${API_URL}/api/memorials/mine`, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    assert(res.status === 200, 'Get memorials returns 200');
    assert(Array.isArray(res.data.memorials), 'Response contains memorials array');
    assert(res.data.memorials.length > 0, 'User has at least one memorial');

    if (createdMemorialId) {
      const found = res.data.memorials.find((m) => m.id === createdMemorialId);
      assert(found, 'Created memorial appears in user\'s list');
    }
  } catch (error) {
    console.log(`  ❌ Get memorials failed: ${error.message}`);
    testsFailed++;
  }
};

const testGetMemorialPublic = async () => {
  console.log('\n🧪 Test 3: Get Memorial Publicly (GET /api/memorials/:id)');

  if (!createdMemorialId) {
    console.log('  ⏭️  Skipped (no memorial created)');
    return;
  }

  try {
    // Try to access without authentication (should work for 'link' privacy)
    const res = await makeRequest(`${API_URL}/api/memorials/${createdMemorialId}`);

    assert(res.status === 200, 'Public memorial access returns 200');
    assert(res.data.memorial, 'Response contains memorial data');
    assert(res.data.memorial.id === createdMemorialId, 'Memorial ID matches');
    assert(res.data.memorial.deceasedName === 'Test User Memorial', 'Memorial name accessible');

    console.log('  🌐 Memorial is accessible via link (privacy: link)');
  } catch (error) {
    console.log(`  ❌ Get public memorial failed: ${error.message}`);
    testsFailed++;
  }
};

const testUpdateMemorial = async () => {
  console.log('\n🧪 Test 4: Update Memorial (PUT /api/memorials/:id)');

  if (!ACCESS_TOKEN || !createdMemorialId) {
    console.log('  ⏭️  Skipped (no ACCESS_TOKEN or memorial ID)');
    return;
  }

  try {
    const updates = {
      shortBio: 'Updated biography: A wonderful person who touched many lives.',
      privacy: 'public',
    };

    const res = await makeRequest(`${API_URL}/api/memorials/${createdMemorialId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: updates,
    });

    assert(res.status === 200, 'Memorial update returns 200');
    assert(res.data.memorial, 'Response contains updated memorial');
    assert(
      res.data.memorial.shortBio === updates.shortBio,
      'Biography was updated'
    );
    assert(res.data.memorial.privacy === 'public', 'Privacy changed to public');

    console.log('  ✏️  Memorial successfully updated');
  } catch (error) {
    console.log(`  ❌ Update memorial failed: ${error.message}`);
    testsFailed++;
  }
};

const testUnauthorizedUpdate = async () => {
  console.log('\n🧪 Test 5: Unauthorized Update (Security Test)');

  if (!createdMemorialId) {
    console.log('  ⏭️  Skipped (no memorial ID)');
    return;
  }

  try {
    // Try to update without auth token
    const res = await makeRequest(`${API_URL}/api/memorials/${createdMemorialId}`, {
      method: 'PUT',
      body: { shortBio: 'Hacked!' },
    });

    assert(res.status === 401, 'Unauthorized update returns 401');
    assert(res.data.error, 'Response contains error message');
    console.log('  🔒 Memorial is protected from unauthorized edits');
  } catch (error) {
    console.log(`  ❌ Unauthorized update test failed: ${error.message}`);
    testsFailed++;
  }
};

const testPrivateMemorialAccess = async () => {
  console.log('\n🧪 Test 6: Private Memorial Access (Privacy Test)');

  if (!ACCESS_TOKEN) {
    console.log('  ⏭️  Skipped (no ACCESS_TOKEN)');
    return;
  }

  try {
    // First create a private memorial
    const privateMemorial = {
      deceasedName: 'Private Test Memorial',
      birthDate: new Date('1960-05-20').toISOString(),
      deathDate: new Date('2024-02-15').toISOString(),
      shortBio: 'This is a private memorial for testing.',
      privacy: 'private',
    };

    const createRes = await makeRequest(`${API_URL}/api/memorials`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: privateMemorial,
    });

    if (createRes.status === 201 && createRes.data.memorial) {
      const privateMemorialId = createRes.data.memorial.id;

      // Try to access without auth
      const accessRes = await makeRequest(`${API_URL}/api/memorials/${privateMemorialId}`);

      assert(accessRes.status === 403, 'Private memorial returns 403 without auth');
      assert(
        accessRes.data.error && accessRes.data.error.includes('private'),
        'Error message indicates memorial is private'
      );

      console.log('  🔒 Private memorials are properly protected');

      // Clean up - delete the private memorial
      await makeRequest(`${API_URL}/api/memorials/${privateMemorialId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      });

      console.log('  🗑️  Cleaned up test private memorial');
    }
  } catch (error) {
    console.log(`  ❌ Private memorial test failed: ${error.message}`);
    testsFailed++;
  }
};

const testDuplicatePrevention = async () => {
  console.log('\n🧪 Test 7: Duplicate Prevention (Security Test)');

  if (!ACCESS_TOKEN) {
    console.log('  ⏭️  Skipped (no ACCESS_TOKEN)');
    return;
  }

  try {
    // Try to create a duplicate memorial with same name and date
    const duplicate = {
      deceasedName: 'Test User Memorial', // Same as first memorial
      birthDate: new Date('1950-03-15').toISOString(), // Same birth date
      deathDate: new Date('2024-01-10').toISOString(),
      shortBio: 'This should fail due to duplicate detection.',
    };

    const res = await makeRequest(`${API_URL}/api/memorials`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: duplicate,
    });

    assert(res.status === 409, 'Duplicate memorial returns 409');
    assert(
      res.data.error && res.data.error.includes('already exists'),
      'Error message indicates duplicate'
    );

    console.log('  🔒 Duplicate prevention is working');
  } catch (error) {
    console.log(`  ❌ Duplicate prevention test failed: ${error.message}`);
    testsFailed++;
  }
};

const testInputValidation = async () => {
  console.log('\n🧪 Test 8: Input Validation (Security Test)');

  if (!ACCESS_TOKEN) {
    console.log('  ⏭️  Skipped (no ACCESS_TOKEN)');
    return;
  }

  try {
    // Try to create memorial with invalid data
    const invalid = {
      deceasedName: '', // Empty name
      // Missing required birthDate or deathDate
    };

    const res = await makeRequest(`${API_URL}/api/memorials`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: invalid,
    });

    assert(res.status === 400, 'Invalid input returns 400');
    assert(res.data.error, 'Response contains validation error');

    console.log('  🔒 Input validation is working');
  } catch (error) {
    console.log(`  ❌ Input validation test failed: ${error.message}`);
    testsFailed++;
  }
};

const testLightCandle = async () => {
  console.log('\n🧪 Test 9: Light a Candle (Public Feature)');

  if (!createdMemorialId) {
    console.log('  ⏭️  Skipped (no memorial ID)');
    return;
  }

  try {
    const candle = {
      memorialId: createdMemorialId,
      name: 'Test User',
      message: 'Sending love and light from the test suite.',
    };

    const res = await makeRequest(`${API_URL}/api/candles`, {
      method: 'POST',
      body: candle,
    });

    assert(res.status === 201, 'Candle creation returns 201');
    assert(res.data.candle, 'Response contains candle object');

    console.log('  🕯️  Candle lit successfully (no auth required)');

    // Get candles to verify
    const getCandlesRes = await makeRequest(`${API_URL}/api/candles/${createdMemorialId}`);

    assert(getCandlesRes.status === 200, 'Get candles returns 200');
    assert(Array.isArray(getCandlesRes.data.candles), 'Response contains candles array');
    assert(getCandlesRes.data.candles.length > 0, 'At least one candle exists');

    console.log(`  🕯️  ${getCandlesRes.data.candles.length} candle(s) found`);
  } catch (error) {
    console.log(`  ❌ Candle test failed: ${error.message}`);
    testsFailed++;
  }
};

const testDeleteMemorial = async () => {
  console.log('\n🧪 Test 10: Delete Memorial (Cleanup)');

  if (!ACCESS_TOKEN || !createdMemorialId) {
    console.log('  ⏭️  Skipped (no ACCESS_TOKEN or memorial ID)');
    return;
  }

  try {
    const res = await makeRequest(`${API_URL}/api/memorials/${createdMemorialId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    assert(res.status === 200, 'Memorial deletion returns 200');
    assert(res.data.message, 'Response contains success message');

    console.log('  🗑️  Memorial deleted successfully');

    // Verify it's gone
    const getRes = await makeRequest(`${API_URL}/api/memorials/${createdMemorialId}`);
    assert(getRes.status === 404, 'Deleted memorial returns 404');

    console.log('  ✅ Memorial no longer accessible');
  } catch (error) {
    console.log(`  ❌ Delete memorial failed: ${error.message}`);
    testsFailed++;
  }
};

// ============================================
// RUN ALL TESTS
// ============================================

const runTests = async () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Forever Fields - Memorial CRUD Tests                     ║');
  console.log('║  v0.1-memorial                                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log(`\n🎯 Testing API: ${API_URL}`);
  console.log(`📧 Test Email: ${TEST_EMAIL}`);

  if (!ACCESS_TOKEN) {
    console.log('\n⚠️  WARNING: No ACCESS_TOKEN provided!');
    console.log('Set ACCESS_TOKEN environment variable to run authenticated tests.');
    console.log('Example: ACCESS_TOKEN="your-token" node tests/memorial-crud.test.js\n');
  }

  const continueTests = await testCreateMemorial();

  if (continueTests) {
    await testGetMyMemorials();
    await testGetMemorialPublic();
    await testUpdateMemorial();
    await testUnauthorizedUpdate();
    await testPrivateMemorialAccess();
    await testDuplicatePrevention();
    await testInputValidation();
    await testLightCandle();
    await testDeleteMemorial();
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Test Results                                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📊 Total:  ${testsPassed + testsFailed}`);

  if (testsFailed === 0 && testsPassed > 0) {
    console.log('\n🎉 All tests passed! Memorial CRUD is production-ready.\n');
    process.exit(0);
  } else if (testsPassed === 0) {
    console.log('\n⚠️  No tests ran. Check ACCESS_TOKEN.\n');
    process.exit(1);
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
