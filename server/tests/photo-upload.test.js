/**
 * Photo Upload Integration Test
 * Tests the complete photo upload workflow:
 * 1. Get signed URL
 * 2. Upload to Cloudinary (simulated)
 * 3. Complete upload (creates pending item)
 * 4. Approve photo
 * 5. View approved photos on memorial
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
let pendingItemId = null;

// Test configuration
const config = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
    }
};

/**
 * Helper: Make HTTP request
 */
async function request(method, endpoint, data = null) {
    const options = {
        method,
        headers: config.headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const text = await response.text();

    let result;
    try {
        result = text ? JSON.parse(text) : {};
    } catch (e) {
        result = { message: text };
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
        deceasedName: 'Photo Test User',
        birthDate: new Date('1960-01-01').toISOString(),
        deathDate: new Date('2024-12-01').toISOString(),
        shortBio: 'Test memorial for photo upload testing',
        privacy: 'link', // Use 'link' so we can view without auth
    };

    const res = await request('POST', '/api/memorials', memorial);

    if (!res.ok) {
        throw new Error(`Failed to create memorial: ${JSON.stringify(res.data)}`);
    }

    testMemorialId = res.data.memorial.id;
    console.log(`✅ Memorial created: ${testMemorialId}`);
    return res.data;
}

/**
 * Test 2: Get signed upload URL
 */
async function test2_getSignedURL() {
    console.log('\n📝 Test 2: Get signed upload URL');

    const uploadData = {
        fileType: 'image/jpeg',
        fileName: 'test-photo.jpg',
        memorialId: testMemorialId
    };

    const res = await request('POST', '/api/uploads/sign', uploadData);

    if (!res.ok) {
        throw new Error(`Failed to get signed URL: ${JSON.stringify(res.data)}`);
    }

    console.log('✅ Signed upload URL obtained');
    console.log(`   Upload URL: ${res.data.uploadUrl.substring(0, 50)}...`);
    console.log(`   Upload params keys: ${Object.keys(res.data.uploadParams).join(', ')}`);

    return res.data;
}

/**
 * Test 3: Simulate Cloudinary upload result and complete upload
 */
async function test3_completeUpload() {
    console.log('\n📝 Test 3: Complete upload (create pending item)');

    // Simulate Cloudinary response
    const cloudinaryResult = {
        public_id: 'test-photos/photo-test-' + Date.now(),
        secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        format: 'jpg',
        width: 1920,
        height: 1080,
        bytes: 245760,
        created_at: new Date().toISOString(),
        tags: ['memorial', 'test'],
        moderation: [
            {
                status: 'approved',
                kind: 'aws_rek:explicit',
                response: {
                    moderation_labels: []
                }
            }
        ]
    };

    const res = await request('POST', '/api/uploads/complete', {
        memorialId: testMemorialId,
        cloudinaryResult: cloudinaryResult
    });

    if (!res.ok) {
        throw new Error(`Failed to complete upload: ${JSON.stringify(res.data)}`);
    }

    pendingItemId = res.data.pendingItem.id;
    console.log(`✅ Upload completed, pending item created: ${pendingItemId}`);
    console.log(`   Status: ${res.data.pendingItem.status}`);
    console.log(`   Type: ${res.data.pendingItem.type}`);

    return res.data;
}

/**
 * Test 4: Verify photo is in pending queue
 */
async function test4_checkPendingItem() {
    console.log('\n📝 Test 4: Verify photo is in pending queue');

    const res = await request('GET', `/api/pending?memorialId=${testMemorialId}`);

    if (!res.ok) {
        throw new Error(`Failed to get pending items: ${JSON.stringify(res.data)}`);
    }

    const photoInPending = res.data.pendingItems.find(
        item => item.id === pendingItemId && item.type === 'photo'
    );

    if (!photoInPending) {
        throw new Error('Photo not found in pending queue');
    }

    console.log(`✅ Photo found in pending queue`);
    console.log(`   ID: ${photoInPending.id}`);
    console.log(`   Status: ${photoInPending.status}`);
    console.log(`   Created: ${new Date(photoInPending.createdAt).toLocaleString()}`);

    return res.data;
}

/**
 * Test 5: Approve the photo
 */
async function test5_approvePhoto() {
    console.log('\n📝 Test 5: Approve the photo');

    const res = await request('POST', `/api/pending/approve/${pendingItemId}`);

    if (!res.ok) {
        throw new Error(`Failed to approve photo: ${JSON.stringify(res.data)}`);
    }

    console.log(`✅ Photo approved`);
    console.log(`   ID: ${res.data.pendingItem.id}`);
    console.log(`   New status: ${res.data.pendingItem.status}`);

    return res.data;
}

/**
 * Test 6: Get approved photos for memorial
 */
async function test6_getApprovedPhotos() {
    console.log('\n📝 Test 6: Get approved photos for memorial');

    // No auth required - public endpoint
    const res = await request('GET', `/api/uploads/memorial/${testMemorialId}`);

    if (!res.ok) {
        throw new Error(`Failed to get approved photos: ${JSON.stringify(res.data)}`);
    }

    if (res.data.photos.length === 0) {
        throw new Error('No approved photos found');
    }

    const approvedPhoto = res.data.photos.find(
        photo => photo.id === pendingItemId
    );

    if (!approvedPhoto) {
        throw new Error('Our approved photo not found in memorial photos');
    }

    console.log(`✅ Approved photo is now visible on memorial`);
    console.log(`   Total photos: ${res.data.photos.length}`);
    console.log(`   Photo URL: ${JSON.parse(approvedPhoto.dataJson).url}`);

    return res.data;
}

/**
 * Test 7: Test rejection workflow
 */
async function test7_testRejection() {
    console.log('\n📝 Test 7: Test rejection workflow');

    // Upload another photo
    const cloudinaryResult = {
        public_id: 'test-photos/photo-reject-' + Date.now(),
        secure_url: 'https://res.cloudinary.com/demo/image/upload/sample2.jpg',
        format: 'jpg',
        width: 1920,
        height: 1080,
        bytes: 245760,
        created_at: new Date().toISOString(),
        moderation: [{ status: 'approved' }]
    };

    const uploadRes = await request('POST', '/api/uploads/complete', {
        memorialId: testMemorialId,
        cloudinaryResult: cloudinaryResult
    });

    if (!uploadRes.ok) {
        throw new Error(`Failed to upload second photo: ${JSON.stringify(uploadRes.data)}`);
    }

    const rejectItemId = uploadRes.data.pendingItem.id;
    console.log(`   Created second pending item: ${rejectItemId}`);

    // Reject it
    const rejectRes = await request('POST', `/api/pending/reject/${rejectItemId}`, {
        reason: 'Test rejection'
    });

    if (!rejectRes.ok) {
        throw new Error(`Failed to reject photo: ${JSON.stringify(rejectRes.data)}`);
    }

    console.log(`✅ Photo rejected successfully`);
    console.log(`   Status: ${rejectRes.data.pendingItem.status}`);

    // Verify it doesn't appear in approved photos
    const photosRes = await request('GET', `/api/uploads/memorial/${testMemorialId}`);

    const rejectedPhotoInList = photosRes.data.photos.find(
        photo => photo.id === rejectItemId
    );

    if (rejectedPhotoInList) {
        throw new Error('Rejected photo should not appear in approved photos!');
    }

    console.log(`✅ Rejected photo correctly excluded from memorial`);

    return rejectRes.data;
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
    console.log('🧪 Forever Fields - Photo Upload Integration Tests');
    console.log('='.repeat(60));
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`Authorization: Bearer ${ACCESS_TOKEN.substring(0, 20)}...`);

    try {
        await test1_createMemorial();
        await test2_getSignedURL();
        await test3_completeUpload();
        await test4_checkPendingItem();
        await test5_approvePhoto();
        await test6_getApprovedPhotos();
        await test7_testRejection();
        await test8_cleanup();

        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL TESTS PASSED');
        console.log('='.repeat(60));
        console.log('\n✨ Photo upload workflow verified successfully!\n');

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
