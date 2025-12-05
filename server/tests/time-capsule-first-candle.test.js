/**
 * Time Capsule & First Candle Test
 * Tests v0.4-wow features: time capsules and first candle celebration
 */

const BASE_URL = 'http://localhost:3000';

// Test memorial ID (replace with actual memorial from your database)
const TEST_MEMORIAL_ID = 'test-memorial-001';

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'bright');
    console.log('='.repeat(60) + '\n');
}

function logStep(step) {
    log(`\n→ ${step}`, 'blue');
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠ ${message}`, 'yellow');
}

async function makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        return {
            status: response.status,
            ok: response.ok,
            data,
        };
    } catch (error) {
        logError(`Request failed: ${error.message}`);
        throw error;
    }
}

/**
 * Test 1: Create Time Capsule
 */
async function testCreateTimeCapsule() {
    logSection('TEST 1: Create Time Capsule');

    logStep('Creating time capsule with future unlock date');

    // Set unlock date to 1 year from now
    const unlockDate = new Date();
    unlockDate.setFullYear(unlockDate.getFullYear() + 1);

    const capsuleData = {
        memorialId: TEST_MEMORIAL_ID,
        messageText: 'This is a test time capsule message for the future. It should unlock in one year.',
        unlockDate: unlockDate.toISOString(),
    };

    const result = await makeRequest('/api/time-capsules', {
        method: 'POST',
        body: JSON.stringify(capsuleData),
    });

    if (result.ok && result.status === 201) {
        logSuccess('Time capsule created successfully');
        console.log('Response:', JSON.stringify(result.data, null, 2));

        if (result.data.pendingItem) {
            logSuccess(`Pending item created with ID: ${result.data.pendingItem.id}`);
            logSuccess(`Status: ${result.data.pendingItem.status}`);
            return result.data.pendingItem.id;
        }
    } else {
        logError(`Failed to create time capsule: ${result.data.error || 'Unknown error'}`);
        console.log('Full response:', result);
    }

    return null;
}

/**
 * Test 2: Try to retrieve time capsule (should not show - not unlocked yet)
 */
async function testGetLockedTimeCapsules() {
    logSection('TEST 2: Retrieve Locked Time Capsules');

    logStep('Attempting to get time capsules (should be empty - not unlocked)');

    const result = await makeRequest(`/api/time-capsules/${TEST_MEMORIAL_ID}`, {
        method: 'GET',
    });

    if (result.ok && result.status === 200) {
        logSuccess('Retrieved time capsules');
        console.log('Time capsules:', JSON.stringify(result.data, null, 2));

        if (result.data.timeCapsules && result.data.timeCapsules.length === 0) {
            logSuccess('Correctly filtered out locked time capsules');
        } else {
            logWarning('Expected no time capsules (they should be locked)');
        }
    } else {
        logError(`Failed to retrieve time capsules: ${result.data.error || 'Unknown error'}`);
    }
}

/**
 * Test 3: Create time capsule with past unlock date (for testing unlock)
 */
async function testCreateUnlockedTimeCapsule() {
    logSection('TEST 3: Create Time Capsule with Past Unlock Date');

    logStep('Creating time capsule with past unlock date (already unlocked)');

    // Set unlock date to yesterday
    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() - 1);

    const capsuleData = {
        memorialId: TEST_MEMORIAL_ID,
        messageText: 'This time capsule is already unlocked! You should be able to see it immediately after approval.',
        voiceUrl: 'https://example.com/voice-recording.mp3',
        videoUrl: 'https://example.com/video-message.mp4',
        unlockDate: unlockDate.toISOString(),
    };

    const result = await makeRequest('/api/time-capsules', {
        method: 'POST',
        body: JSON.stringify(capsuleData),
    });

    if (result.ok && result.status === 201) {
        logSuccess('Unlocked time capsule created successfully');
        console.log('Response:', JSON.stringify(result.data, null, 2));

        if (result.data.pendingItem) {
            logSuccess(`Pending item created with ID: ${result.data.pendingItem.id}`);
            logWarning('Note: You need to approve this in the dashboard before it shows');
            return result.data.pendingItem.id;
        }
    } else {
        logError(`Failed to create time capsule: ${result.data.error || 'Unknown error'}`);
    }

    return null;
}

/**
 * Test 4: Light First Candle
 */
async function testLightFirstCandle() {
    logSection('TEST 4: Light First Candle (Should Trigger Celebration)');

    logStep('Lighting the first candle on memorial');

    const candleData = {
        memorialId: TEST_MEMORIAL_ID,
        message: 'This is the first candle ever lit on this memorial. It should trigger a golden glow celebration!',
        name: 'Test User',
    };

    const result = await makeRequest('/api/candles', {
        method: 'POST',
        body: JSON.stringify(candleData),
    });

    if (result.ok && result.status === 201) {
        logSuccess('Candle lit successfully');
        console.log('Response:', JSON.stringify(result.data, null, 2));

        if (result.data.isFirstCandle === true) {
            logSuccess('🎉 FIRST CANDLE DETECTED! Celebration should trigger!');
            logSuccess(`Total candles: ${result.data.totalCandles}`);
        } else {
            logWarning('This was not the first candle (memorial may already have candles)');
            logWarning(`Total candles: ${result.data.totalCandles}`);
        }
    } else {
        logError(`Failed to light candle: ${result.data.error || 'Unknown error'}`);
    }
}

/**
 * Test 5: Light Second Candle (Should NOT trigger celebration)
 */
async function testLightSecondCandle() {
    logSection('TEST 5: Light Second Candle (No Celebration)');

    logStep('Lighting another candle (should not trigger celebration)');

    const candleData = {
        memorialId: TEST_MEMORIAL_ID,
        message: 'This is a regular candle. No celebration should occur.',
        name: 'Another User',
    };

    const result = await makeRequest('/api/candles', {
        method: 'POST',
        body: JSON.stringify(candleData),
    });

    if (result.ok && result.status === 201) {
        logSuccess('Candle lit successfully');
        console.log('Response:', JSON.stringify(result.data, null, 2));

        if (result.data.isFirstCandle === false) {
            logSuccess('Correctly identified as NOT the first candle');
            logSuccess(`Total candles: ${result.data.totalCandles}`);
        } else {
            logWarning('Unexpected: This should not be the first candle');
        }
    } else {
        logError(`Failed to light candle: ${result.data.error || 'Unknown error'}`);
    }
}

/**
 * Test 6: Get all candles
 */
async function testGetCandles() {
    logSection('TEST 6: Retrieve All Candles');

    logStep('Getting all candles for memorial');

    const result = await makeRequest(`/api/candles/${TEST_MEMORIAL_ID}`, {
        method: 'GET',
    });

    if (result.ok && result.status === 200) {
        logSuccess('Retrieved candles');
        console.log('Candles:', JSON.stringify(result.data, null, 2));

        if (result.data.candles && result.data.candles.length > 0) {
            logSuccess(`Total candles on memorial: ${result.data.candles.length}`);
        }
    } else {
        logError(`Failed to retrieve candles: ${result.data.error || 'Unknown error'}`);
    }
}

/**
 * Test 7: Validation Tests
 */
async function testValidation() {
    logSection('TEST 7: Validation Tests');

    logStep('Testing time capsule with past unlock date (should fail)');
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    const invalidCapsule = {
        memorialId: TEST_MEMORIAL_ID,
        messageText: 'This should fail',
        unlockDate: pastDate.toISOString(),
    };

    const result1 = await makeRequest('/api/time-capsules', {
        method: 'POST',
        body: JSON.stringify(invalidCapsule),
    });

    if (!result1.ok && result1.status === 400) {
        logSuccess('Correctly rejected time capsule with past unlock date');
    } else {
        logWarning('Expected validation error for past unlock date');
    }

    logStep('Testing time capsule on private memorial (should fail)');
    // This would require a private memorial ID - skipping for now
    logWarning('Skipping private memorial test (requires setup)');
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.clear();
    log('╔════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  Forever Fields v0.4-wow Test Suite                       ║', 'magenta');
    log('║  Time Capsules & First Candle Celebration                 ║', 'magenta');
    log('╚════════════════════════════════════════════════════════════╝', 'magenta');

    log('\nServer: ' + BASE_URL, 'yellow');
    log('Memorial ID: ' + TEST_MEMORIAL_ID, 'yellow');
    log('\nIMPORTANT: Make sure your server is running and you have a test memorial!', 'yellow');

    try {
        // Test time capsules
        const capsule1 = await testCreateTimeCapsule();
        await testGetLockedTimeCapsules();
        const capsule2 = await testCreateUnlockedTimeCapsule();

        // Test candles
        await testLightFirstCandle();
        await testLightSecondCandle();
        await testGetCandles();

        // Test validation
        await testValidation();

        logSection('TEST SUMMARY');
        logSuccess('All tests completed!');
        log('\nNext Steps:', 'bright');
        console.log('1. Check the memorial page to see the golden glow celebration');
        console.log('2. Approve the time capsules in the dashboard');
        console.log('3. Verify that unlocked time capsules appear on the memorial');

    } catch (error) {
        logError('Test suite failed with error:');
        console.error(error);
    }
}

// Run tests
runAllTests();
