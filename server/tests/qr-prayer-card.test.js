/**
 * QR Code & Prayer Card Integration Test
 * Tests the complete QR and PDF generation workflow:
 * 1. Create test memorial
 * 2. Generate QR codes with all 4 designs
 * 3. Download prayer card PDF
 * 4. Cleanup test memorial
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
    console.error('\n❌ ERROR: ACCESS_TOKEN environment variable not set');
    console.error('Please set it with: export ACCESS_TOKEN="your-token-from-magic-link"\n');
    process.exit(1);
}

// Test state
let testMemorialId = null;

// Test configuration
const config = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
    }
};

// QR Design options
const QR_DESIGNS = ['minimalist', 'marble', 'garden', 'gold'];

/**
 * Helper: Make HTTP request
 */
async function request(method, endpoint, data = null, options = {}) {
    const requestOptions = {
        method,
        headers: { ...config.headers, ...options.headers }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

    // Handle different content types
    const contentType = response.headers.get('content-type');
    let result;

    if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
    } else if (contentType && contentType.includes('application/pdf')) {
        result = { contentType: 'application/pdf', size: response.headers.get('content-length') };
    } else if (contentType && contentType.includes('image/png')) {
        result = { contentType: 'image/png', size: response.headers.get('content-length') };
    } else {
        result = { message: await response.text() };
    }

    return {
        status: response.status,
        ok: response.ok,
        data: result
    };
}

/**
 * Test 1: Create a test memorial
 */
async function test1_createMemorial() {
    console.log('\n📝 Test 1: Create a test memorial');

    const memorial = {
        deceasedName: 'QR Test User',
        birthDate: new Date('1950-05-15').toISOString(),
        deathDate: new Date('2024-11-20').toISOString(),
        shortBio: 'A beloved member of our community, remembered for kindness and compassion.',
        privacy: 'link',
        isPet: false,
        portraitUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    };

    const res = await request('POST', '/api/memorials', memorial);

    if (!res.ok) {
        throw new Error(`Failed to create memorial: ${JSON.stringify(res.data)}`);
    }

    testMemorialId = res.data.memorial.id;
    console.log(`✅ Memorial created: ${testMemorialId}`);
    console.log(`   Name: ${res.data.memorial.deceasedName}`);
    console.log(`   Dates: ${new Date(res.data.memorial.birthDate).toLocaleDateString()} - ${new Date(res.data.memorial.deathDate).toLocaleDateString()}`);

    return res.data;
}

/**
 * Test 2: Generate QR codes with all designs
 */
async function test2_generateQRCodes() {
    console.log('\n📝 Test 2: Generate QR codes with all 4 designs');

    const results = [];

    for (const design of QR_DESIGNS) {
        console.log(`\n   Testing design: ${design}`);

        const res = await request('GET', `/api/qr/${testMemorialId}?design=${design}`, null, {
            headers: { 'Authorization': '' } // Public endpoint, no auth
        });

        if (!res.ok) {
            throw new Error(`Failed to generate QR code for design ${design}: ${JSON.stringify(res.data)}`);
        }

        console.log(`   ✅ QR code generated for "${design}" design`);
        console.log(`      URL: ${res.data.qrCode.url.substring(0, 60)}...`);
        console.log(`      Design: ${res.data.qrCode.design}`);

        results.push(res.data);
    }

    console.log(`\n✅ All ${QR_DESIGNS.length} QR code designs generated successfully`);
    return results;
}

/**
 * Test 3: Test QR code download endpoint
 */
async function test3_downloadQRCode() {
    console.log('\n📝 Test 3: Test QR code download endpoint');

    const design = 'minimalist';
    const res = await request('GET', `/api/qr/${testMemorialId}?design=${design}&download=true`, null, {
        headers: { 'Authorization': '' } // Public endpoint
    });

    if (!res.ok) {
        throw new Error(`Failed to download QR code: ${JSON.stringify(res.data)}`);
    }

    console.log(`✅ QR code download URL works`);
    console.log(`   Content-Type: ${res.data.contentType}`);

    return res.data;
}

/**
 * Test 4: Generate prayer card PDF
 */
async function test4_generatePrayerCard() {
    console.log('\n📝 Test 4: Generate prayer card PDF');

    const res = await request('GET', `/api/prayer-card/${testMemorialId}`, null, {
        headers: { 'Authorization': '' } // Public endpoint
    });

    if (!res.ok) {
        throw new Error(`Failed to generate prayer card: ${JSON.stringify(res.data)}`);
    }

    console.log(`✅ Prayer card PDF generated successfully`);
    console.log(`   Content-Type: ${res.data.contentType}`);
    console.log(`   Expected format: 4x6" double-sided PDF`);

    return res.data;
}

/**
 * Test 5: Test prayer card with design parameter
 */
async function test5_prayerCardWithDesign() {
    console.log('\n📝 Test 5: Test prayer card with design parameter');

    const design = 'marble';
    const res = await request('GET', `/api/prayer-card/${testMemorialId}?design=${design}`, null, {
        headers: { 'Authorization': '' }
    });

    if (!res.ok) {
        throw new Error(`Failed to generate prayer card with design: ${JSON.stringify(res.data)}`);
    }

    console.log(`✅ Prayer card with design parameter works`);
    console.log(`   Design: ${design}`);

    return res.data;
}

/**
 * Test 6: Test rate limiting (public endpoints)
 */
async function test6_testRateLimiting() {
    console.log('\n📝 Test 6: Test rate limiting on public endpoints');

    // Make multiple rapid requests
    const requests = [];
    for (let i = 0; i < 3; i++) {
        requests.push(
            request('GET', `/api/qr/${testMemorialId}?design=minimalist`, null, {
                headers: { 'Authorization': '' }
            })
        );
    }

    const results = await Promise.all(requests);
    const successfulRequests = results.filter(r => r.ok).length;

    console.log(`✅ Made ${requests.length} rapid requests`);
    console.log(`   Successful: ${successfulRequests}/${requests.length}`);
    console.log(`   Rate limiting is ${successfulRequests === requests.length ? 'permissive' : 'active'}`);

    return results;
}

/**
 * Test 7: Test with non-existent memorial
 */
async function test7_testNotFound() {
    console.log('\n📝 Test 7: Test with non-existent memorial ID');

    const fakeId = 'non-existent-memorial-id';

    // Test QR endpoint
    const qrRes = await request('GET', `/api/qr/${fakeId}`, null, {
        headers: { 'Authorization': '' }
    });

    if (qrRes.status !== 404) {
        throw new Error('Expected 404 for non-existent memorial QR code');
    }

    // Test prayer card endpoint
    const prayerRes = await request('GET', `/api/prayer-card/${fakeId}`, null, {
        headers: { 'Authorization': '' }
    });

    if (prayerRes.status !== 404) {
        throw new Error('Expected 404 for non-existent memorial prayer card');
    }

    console.log(`✅ Both endpoints correctly return 404 for non-existent memorial`);
    console.log(`   QR endpoint: ${qrRes.status}`);
    console.log(`   Prayer card endpoint: ${prayerRes.status}`);
}

/**
 * Test 8: Cleanup - delete test memorial
 */
async function test8_cleanup() {
    console.log('\n📝 Test 8: Cleanup test memorial');

    const res = await request('DELETE', `/api/memorials/${testMemorialId}`);

    if (!res.ok) {
        throw new Error(`Failed to delete memorial: ${JSON.stringify(res.data)}`);
    }

    console.log(`✅ Test memorial deleted`);

    return res.data;
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 Forever Fields - QR & Prayer Card Integration Tests');
    console.log('='.repeat(60));
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`Authorization: Bearer ${ACCESS_TOKEN.substring(0, 20)}...`);

    try {
        await test1_createMemorial();
        await test2_generateQRCodes();
        await test3_downloadQRCode();
        await test4_generatePrayerCard();
        await test5_prayerCardWithDesign();
        await test6_testRateLimiting();
        await test7_testNotFound();
        await test8_cleanup();

        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL TESTS PASSED');
        console.log('='.repeat(60));
        console.log('\n✨ QR code & prayer card generation verified successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ TEST FAILED');
        console.error('='.repeat(60));
        console.error('\nError:', error.message);
        console.error('\n');

        // Cleanup on failure
        if (testMemorialId) {
            console.log('🧹 Attempting cleanup...');
            try {
                await request('DELETE', `/api/memorials/${testMemorialId}`);
                console.log('✅ Cleanup successful');
            } catch (cleanupError) {
                console.error('⚠️  Cleanup failed:', cleanupError.message);
            }
        }

        process.exit(1);
    }
}

// Run tests
runTests();
