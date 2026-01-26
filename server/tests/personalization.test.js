/**
 * Forever Fields - Personalization Features Integration Test
 * Tests memorial personalization fields end-to-end via API
 *
 * Run with: node tests/personalization.test.js
 */

const http = require('http');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // Set via environment or get from auth

// Test results
let testsPassed = 0;
let testsFailed = 0;

// Test data
let memorialId = null;
let photoId = null;
let recipeId = null;
let lifeEventId = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
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

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, testName) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  assert(passed, testName);
  if (!passed) {
    console.error(`   Expected: ${JSON.stringify(expected)}`);
    console.error(`   Actual:   ${JSON.stringify(actual)}`);
  }
}

// ============================================
// TESTS
// ============================================

async function runTests() {
  console.log('\n🧪 Running Personalization Integration Tests...\n');

  if (!ACCESS_TOKEN) {
    console.warn('⚠️  WARNING: ACCESS_TOKEN not set. Some tests may fail.');
    console.warn('   Set ACCESS_TOKEN env variable or log in first.\n');
  }

  const authHeaders = ACCESS_TOKEN
    ? { Authorization: `Bearer ${ACCESS_TOKEN}` }
    : {};

  // ============================================
  // MEMORIAL CREATION WITH PERSONALIZATION
  // ============================================

  console.log('📝 Memorial Creation Tests:');

  try {
    // Test 1: Create memorial with full personalization
    const memorialData = {
      deceasedName: 'Test Person Personalization',
      birthDate: new Date('1935-06-15T00:00:00Z').toISOString(),
      deathDate: new Date('2023-11-20T00:00:00Z').toISOString(),
      portraitUrl: 'https://example.com/portrait.jpg',
      shortBio: 'A wonderful person who loved life.',
      isPet: false,
      privacy: 'public',
      religion: 'Christian',
      gender: 'Non-Binary',
      customPronouns: 'they/them',
      restingType: 'buried',
      restingLocation: {
        lat: 34.0522,
        lng: -118.2437,
        name: 'Forest Lawn Cemetery',
        address: '1234 Memorial Dr, Los Angeles, CA 90001',
        description: 'A peaceful place overlooking the valley',
      },
    };

    const createResponse = await makeRequest(`${API_URL}/api/memorials`, {
      method: 'POST',
      headers: authHeaders,
      body: memorialData,
    });

    assert(
      createResponse.statusCode === 201,
      'Create memorial with personalization returns 201'
    );
    assert(createResponse.data?.memorial, 'Response contains memorial object');

    if (createResponse.data?.memorial) {
      const memorial = createResponse.data.memorial;
      memorialId = memorial.id;

      assertEqual(memorial.religion, 'Christian', 'Religion saved correctly');
      assertEqual(memorial.gender, 'Non-Binary', 'Gender saved correctly');
      assertEqual(
        memorial.customPronouns,
        'they/them',
        'Custom pronouns saved correctly'
      );
      assertEqual(memorial.restingType, 'buried', 'Resting type saved correctly');
      assert(memorial.restingLocation?.lat === 34.0522, 'Location latitude saved');
      assert(memorial.restingLocation?.lng === -118.2437, 'Location longitude saved');
      assert(
        memorial.restingLocation?.name === 'Forest Lawn Cemetery',
        'Location name saved'
      );
    }
  } catch (error) {
    console.error(`❌ FAIL: Create memorial - ${error.message}`);
    testsFailed++;
  }

  // Test 2: Create memorial without personalization fields
  try {
    const minimalMemorial = {
      deceasedName: 'Minimal Test Person',
      birthDate: new Date('2000-01-01T00:00:00Z').toISOString(),
      privacy: 'public',
    };

    const minimalResponse = await makeRequest(`${API_URL}/api/memorials`, {
      method: 'POST',
      headers: authHeaders,
      body: minimalMemorial,
    });

    assert(
      minimalResponse.statusCode === 201,
      'Create minimal memorial without personalization succeeds'
    );
    assert(
      !minimalResponse.data?.memorial?.religion,
      'Religion is null when not provided'
    );
  } catch (error) {
    console.error(`❌ FAIL: Create minimal memorial - ${error.message}`);
    testsFailed++;
  }

  // ============================================
  // MEMORIAL RETRIEVAL
  // ============================================

  console.log('\n🔍 Memorial Retrieval Tests:');

  if (memorialId) {
    try {
      // Test 3: Retrieve memorial with personalization
      const getResponse = await makeRequest(
        `${API_URL}/api/memorials/${memorialId}`,
        {
          method: 'GET',
        }
      );

      assert(getResponse.statusCode === 200, 'Retrieve memorial returns 200');
      assert(getResponse.data?.memorial, 'Memorial data returned');

      if (getResponse.data?.memorial) {
        const memorial = getResponse.data.memorial;

        assert(memorial.religion === 'Christian', 'Religion persisted correctly');
        assert(
          memorial.gender === 'Non-Binary',
          'Gender persisted correctly'
        );
        assert(
          memorial.customPronouns === 'they/them',
          'Pronouns persisted correctly'
        );
        assert(
          memorial.restingType === 'buried',
          'Resting type persisted correctly'
        );
        assert(
          memorial.restingLocation?.name === 'Forest Lawn Cemetery',
          'Location persisted correctly'
        );
      }
    } catch (error) {
      console.error(`❌ FAIL: Retrieve memorial - ${error.message}`);
      testsFailed++;
    }
  }

  // ============================================
  // MEMORIAL UPDATE
  // ============================================

  console.log('\n✏️  Memorial Update Tests:');

  if (memorialId) {
    try {
      // Test 4: Update personalization fields
      const updateData = {
        religion: 'Buddhist',
        gender: 'Female',
        customPronouns: null, // Clear custom pronouns
        restingType: 'cremated_scattered',
        restingLocation: {
          name: 'Pacific Ocean',
          description: 'Where they loved to swim',
          photoUrl: 'https://example.com/ocean.jpg',
        },
      };

      const updateResponse = await makeRequest(
        `${API_URL}/api/memorials/${memorialId}`,
        {
          method: 'PUT',
          headers: authHeaders,
          body: updateData,
        }
      );

      assert(
        updateResponse.statusCode === 200,
        'Update memorial personalization returns 200'
      );

      if (updateResponse.data?.memorial) {
        const updated = updateResponse.data.memorial;

        assertEqual(updated.religion, 'Buddhist', 'Religion updated correctly');
        assertEqual(updated.gender, 'Female', 'Gender updated correctly');
        assertEqual(
          updated.restingType,
          'cremated_scattered',
          'Resting type updated'
        );
        assert(
          updated.restingLocation?.name === 'Pacific Ocean',
          'Location updated'
        );
      }
    } catch (error) {
      console.error(`❌ FAIL: Update memorial - ${error.message}`);
      testsFailed++;
    }
  }

  // ============================================
  // VALIDATION TESTS (API LEVEL)
  // ============================================

  console.log('\n🛡️ API Validation Tests:');

  try {
    // Test 5: Invalid religion should be rejected
    const invalidReligion = {
      deceasedName: 'Test Invalid',
      birthDate: new Date('2000-01-01T00:00:00Z').toISOString(),
      religion: 'InvalidReligion',
      privacy: 'public',
    };

    const invalidResponse = await makeRequest(`${API_URL}/api/memorials`, {
      method: 'POST',
      headers: authHeaders,
      body: invalidReligion,
    });

    assert(
      invalidResponse.statusCode === 400,
      'Invalid religion rejected with 400'
    );
  } catch (error) {
    console.error(`❌ FAIL: Invalid religion validation - ${error.message}`);
    testsFailed++;
  }

  try {
    // Test 6: Invalid coordinates should be rejected
    const invalidCoords = {
      deceasedName: 'Test Invalid Coords',
      birthDate: new Date('2000-01-01T00:00:00Z').toISOString(),
      privacy: 'public',
      restingLocation: {
        lat: 999, // Invalid (> 90)
        lng: 0,
        name: 'Test',
      },
    };

    const coordsResponse = await makeRequest(`${API_URL}/api/memorials`, {
      method: 'POST',
      headers: authHeaders,
      body: invalidCoords,
    });

    assert(
      coordsResponse.statusCode === 400,
      'Invalid coordinates rejected with 400'
    );
  } catch (error) {
    console.error(`❌ FAIL: Invalid coordinates validation - ${error.message}`);
    testsFailed++;
  }

  // ============================================
  // PHOTOS, RECIPES, LIFE EVENTS (Already have validation)
  // ============================================

  console.log('\n📸 Additional Feature Validation:');

  if (memorialId) {
    // Test 7: Photo caption length validation
    try {
      const longCaption = 'a'.repeat(501);
      const photoResponse = await makeRequest(
        `${API_URL}/api/photos/${memorialId}`,
        {
          method: 'POST',
          headers: authHeaders,
          body: {
            url: 'https://example.com/photo.jpg',
            caption: longCaption,
          },
        }
      );

      assert(
        photoResponse.statusCode === 400,
        'Photo caption > 500 chars rejected'
      );
    } catch (error) {
      console.error(`❌ FAIL: Photo validation - ${error.message}`);
      testsFailed++;
    }

    // Test 8: Recipe name validation
    try {
      const longName = 'a'.repeat(201);
      const recipeResponse = await makeRequest(
        `${API_URL}/api/recipes/${memorialId}`,
        {
          method: 'POST',
          headers: authHeaders,
          body: {
            name: longName,
          },
        }
      );

      assert(
        recipeResponse.statusCode === 400,
        'Recipe name > 200 chars rejected'
      );
    } catch (error) {
      console.error(`❌ FAIL: Recipe validation - ${error.message}`);
      testsFailed++;
    }

    // Test 9: Life event year format validation
    try {
      const eventResponse = await makeRequest(
        `${API_URL}/api/life-events/${memorialId}`,
        {
          method: 'POST',
          headers: authHeaders,
          body: {
            year: 'ABCD', // Invalid format
            title: 'Test Event',
            description: 'Test description',
          },
        }
      );

      assert(
        eventResponse.statusCode === 400,
        'Invalid life event year format rejected'
      );
    } catch (error) {
      console.error(`❌ FAIL: Life event validation - ${error.message}`);
      testsFailed++;
    }
  }

  // ============================================
  // TEST SUMMARY
  // ============================================

  console.log('\n' + '='.repeat(50));
  console.log('📊 INTEGRATION TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(
    `Success Rate: ${(
      (testsPassed / (testsPassed + testsFailed)) *
      100
    ).toFixed(1)}%`
  );
  console.log('='.repeat(50) + '\n');

  if (testsFailed > 0) {
    console.log(
      '⚠️  Some tests failed. Check if ACCESS_TOKEN is set and server is running.\n'
    );
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
