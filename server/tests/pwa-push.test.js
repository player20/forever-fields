/**
 * PWA & Push Notifications Test
 * Tests v0.6-pwa features: PWA installation and push notifications
 */

const BASE_URL = 'http://localhost:3000';

// Test user credentials (you need a valid user in your database)
const TEST_USER_EMAIL = 'test@example.com';
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
 * Test 1: Get VAPID Public Key
 */
async function testGetVapidPublicKey() {
    logSection('TEST 1: Get VAPID Public Key');

    logStep('Fetching VAPID public key for push subscriptions');

    const result = await makeRequest('/api/push/vapid-public-key', {
        method: 'GET',
    });

    if (result.ok && result.status === 200) {
        logSuccess('VAPID public key retrieved successfully');
        console.log('Public Key:', result.data.publicKey);

        if (result.data.publicKey && result.data.publicKey.length > 0) {
            logSuccess('Public key is valid');
            return result.data.publicKey;
        } else {
            logWarning('Public key is empty - VAPID keys may not be configured');
        }
    } else {
        logError(`Failed to get VAPID key: ${result.data.error || 'Unknown error'}`);
        logWarning('Run: npx web-push generate-vapid-keys');
        logWarning('Then add keys to .env file');
    }

    return null;
}

/**
 * Test 2: Subscribe to Push Notifications (requires auth)
 */
async function testPushSubscription(authToken) {
    logSection('TEST 2: Subscribe to Push Notifications');

    logStep('Subscribing to push notifications (simulated)');

    // Simulated push subscription data
    const subscriptionData = {
        endpoint: `https://fcm.googleapis.com/fcm/send/test-endpoint-${Date.now()}`,
        keys: {
            p256dh: 'BMxNcA8sQk6Xm9xVFH8h6lRNbU2f8bG5kRvd-test-key',
            auth: 'test-auth-secret-key',
        },
    };

    const result = await makeRequest('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    });

    if (result.ok && result.status === 201 || result.status === 200) {
        logSuccess('Push subscription created successfully');
        console.log('Subscription:', JSON.stringify(result.data.subscription, null, 2));
        return result.data.subscription;
    } else {
        logError(`Failed to subscribe: ${result.data.error || 'Unknown error'}`);
        logWarning('Note: This endpoint requires authentication');
    }

    return null;
}

/**
 * Test 3: Get User Subscriptions
 */
async function testGetSubscriptions(authToken) {
    logSection('TEST 3: Get User Push Subscriptions');

    logStep('Fetching all push subscriptions for current user');

    const result = await makeRequest('/api/push/subscriptions', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    });

    if (result.ok && result.status === 200) {
        logSuccess('Subscriptions retrieved successfully');
        console.log('Subscriptions:', JSON.stringify(result.data, null, 2));

        if (result.data.subscriptions && result.data.subscriptions.length > 0) {
            logSuccess(`Found ${result.data.subscriptions.length} subscription(s)`);
        } else {
            logWarning('No subscriptions found for this user');
        }
    } else {
        logError(`Failed to get subscriptions: ${result.data.error || 'Unknown error'}`);
    }
}

/**
 * Test 4: Send Push Notification (Manual Test)
 */
async function testSendPushNotification(authToken) {
    logSection('TEST 4: Send Push Notification');

    logStep('Sending test push notification');

    const notificationData = {
        memorialId: TEST_MEMORIAL_ID,
        title: '🧪 Test Notification',
        body: 'This is a test push notification from Forever Fields!',
        url: `/memorial/?id=${TEST_MEMORIAL_ID}`,
        type: 'test',
    };

    const result = await makeRequest('/api/push/send', {
        method: 'POST',
        body: JSON.stringify(notificationData),
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    });

    if (result.ok && result.status === 200) {
        logSuccess('Push notification sent successfully');
        console.log('Result:', JSON.stringify(result.data, null, 2));

        if (result.data.sent > 0) {
            logSuccess(`Successfully sent to ${result.data.sent} subscriber(s)`);
        } else {
            logWarning('No active subscriptions found');
        }

        if (result.data.failed > 0) {
            logWarning(`Failed to send to ${result.data.failed} subscriber(s)`);
        }
    } else {
        logError(`Failed to send notification: ${result.data.error || 'Unknown error'}`);
    }
}

/**
 * Test 5: Light Candle (Trigger Push Notification)
 */
async function testCandleLitPushTrigger() {
    logSection('TEST 5: Light Candle (Trigger Push)');

    logStep('Lighting a candle to trigger push notification');

    const candleData = {
        memorialId: TEST_MEMORIAL_ID,
        message: 'This candle should trigger a push notification to the memorial owner!',
        name: 'Test User',
    };

    const result = await makeRequest('/api/candles', {
        method: 'POST',
        body: JSON.stringify(candleData),
    });

    if (result.ok && result.status === 201) {
        logSuccess('Candle lit successfully');
        console.log('Response:', JSON.stringify(result.data, null, 2));
        logSuccess('Push notification should be sent to memorial owner');
        logWarning('Check your device or browser console for the notification');
    } else {
        logError(`Failed to light candle: ${result.data.error || 'Unknown error'}`);
    }
}

/**
 * Test 6: Unsubscribe from Push
 */
async function testUnsubscribe(authToken, endpoint) {
    logSection('TEST 6: Unsubscribe from Push Notifications');

    logStep('Unsubscribing from push notifications');

    const result = await makeRequest('/api/push/unsubscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint }),
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    });

    if (result.ok && result.status === 200) {
        logSuccess('Unsubscribed successfully');
        console.log('Result:', JSON.stringify(result.data, null, 2));
    } else {
        logError(`Failed to unsubscribe: ${result.data.error || 'Unknown error'}`);
    }
}

/**
 * Test 7: PWA Manifest Check
 */
async function testPWAManifest() {
    logSection('TEST 7: PWA Manifest Check');

    logStep('Checking PWA manifest.json');

    try {
        const response = await fetch(`${BASE_URL}/manifest.json`);
        const manifest = await response.json();

        logSuccess('Manifest found and valid');
        console.log('Manifest:', JSON.stringify(manifest, null, 2));

        // Check required fields
        const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
        const missingFields = requiredFields.filter(field => !manifest[field]);

        if (missingFields.length === 0) {
            logSuccess('All required manifest fields present');
        } else {
            logWarning(`Missing fields: ${missingFields.join(', ')}`);
        }

        // Check icons
        if (manifest.icons && manifest.icons.length > 0) {
            logSuccess(`Found ${manifest.icons.length} icon(s)`);
        } else {
            logWarning('No icons defined in manifest');
        }

    } catch (error) {
        logError(`Failed to fetch manifest: ${error.message}`);
    }
}

/**
 * Test 8: Service Worker Check
 */
async function testServiceWorker() {
    logSection('TEST 8: Service Worker Check');

    logStep('Checking service-worker.js');

    try {
        const response = await fetch(`${BASE_URL}/service-worker.js`);
        const sw = await response.text();

        logSuccess('Service worker file found');
        console.log(`Service worker size: ${sw.length} bytes`);

        // Check for key features
        const features = [
            { name: 'Install handler', pattern: /addEventListener\('install'/ },
            { name: 'Activate handler', pattern: /addEventListener\('activate'/ },
            { name: 'Fetch handler', pattern: /addEventListener\('fetch'/ },
            { name: 'Push handler', pattern: /addEventListener\('push'/ },
            { name: 'Notification click', pattern: /addEventListener\('notificationclick'/ },
        ];

        features.forEach(({ name, pattern }) => {
            if (pattern.test(sw)) {
                logSuccess(`${name} found`);
            } else {
                logWarning(`${name} not found`);
            }
        });

    } catch (error) {
        logError(`Failed to fetch service worker: ${error.message}`);
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.clear();
    log('╔════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  Forever Fields v0.6-pwa Test Suite                       ║', 'magenta');
    log('║  PWA Installation & Push Notifications                    ║', 'magenta');
    log('╚════════════════════════════════════════════════════════════╝', 'magenta');

    log('\nServer: ' + BASE_URL, 'yellow');
    log('Memorial ID: ' + TEST_MEMORIAL_ID, 'yellow');
    log('\nIMPORTANT: Make sure your server is running and VAPID keys are configured!', 'yellow');

    try {
        // Test VAPID key
        const vapidKey = await testGetVapidPublicKey();

        // Test PWA files
        await testPWAManifest();
        await testServiceWorker();

        // Auth required tests (skip if no auth token)
        logWarning('\nThe following tests require authentication:');
        logWarning('- Push subscription');
        logWarning('- Get subscriptions');
        logWarning('- Send push notification');
        logWarning('- Unsubscribe');
        logWarning('\nTo run these tests, you need to:');
        logWarning('1. Create a user account');
        logWarning('2. Get an auth token (magic link or other method)');
        logWarning('3. Update this test file with the token');

        // Test candle trigger (public endpoint)
        await testCandleLitPushTrigger();

        logSection('TEST SUMMARY');
        logSuccess('All available tests completed!');
        log('\nNext Steps:', 'bright');
        console.log('1. Configure VAPID keys in .env file (if not done)');
        console.log('2. Open your site in a browser and test PWA installation');
        console.log('3. Subscribe to push notifications from the UI');
        console.log('4. Light a candle and check if notification is received');
        console.log('5. Test offline functionality by disconnecting internet');

        log('\nManual Testing Checklist:', 'bright');
        console.log('□ PWA install banner appears after 10 seconds on mobile');
        console.log('□ PWA can be installed and runs standalone');
        console.log('□ Service worker caches assets for offline use');
        console.log('□ Push notification permission prompt works');
        console.log('□ Push notifications are received when candles are lit');
        console.log('□ Clicking notification opens the memorial page');
        console.log('□ App works offline (cached pages load)');

    } catch (error) {
        logError('Test suite failed with error:');
        console.error(error);
    }
}

// Run tests
runAllTests();
