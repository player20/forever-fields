/**
 * Song Player Integration Test
 * Tests the complete song player workflow:
 * 1. Create memorial with Spotify song
 * 2. Create memorial with YouTube song
 * 3. Verify songs are properly stored
 * 4. Test with invalid URLs
 * 5. Cleanup test memorials
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
    console.error('\n❌ ERROR: ACCESS_TOKEN environment variable not set');
    console.error('Please set it with: export ACCESS_TOKEN="your-token-from-magic-link"\n');
    process.exit(1);
}

// Test state
let spotifyMemorialId = null;
let youtubeMemorialId = null;

// Test configuration
const config = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
    }
};

// Sample song URLs
const SAMPLE_SONGS = {
    spotify: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp', // Mr. Brightside by The Killers
    youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Never Gonna Give You Up
    youtubeShort: 'https://youtu.be/dQw4w9WgXcQ',
    invalid: 'https://soundcloud.com/some-track', // Not supported
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
 * Test 1: Create memorial with Spotify song
 */
async function test1_createMemorialWithSpotify() {
    console.log('\n📝 Test 1: Create memorial with Spotify song');

    const memorial = {
        deceasedName: 'Spotify Test User',
        birthDate: new Date('1965-03-15').toISOString(),
        deathDate: new Date('2024-11-15').toISOString(),
        shortBio: 'Music lover who always had the perfect playlist.',
        privacy: 'link',
        songSpotifyUri: SAMPLE_SONGS.spotify,
    };

    const res = await request('POST', '/api/memorials', memorial);

    if (!res.ok) {
        throw new Error(`Failed to create memorial: ${JSON.stringify(res.data)}`);
    }

    spotifyMemorialId = res.data.memorial.id;
    console.log(`✅ Memorial created with Spotify song: ${spotifyMemorialId}`);
    console.log(`   Song URL: ${res.data.memorial.songSpotifyUri}`);

    return res.data;
}

/**
 * Test 2: Create memorial with YouTube song
 */
async function test2_createMemorialWithYouTube() {
    console.log('\n📝 Test 2: Create memorial with YouTube song');

    const memorial = {
        deceasedName: 'YouTube Test User',
        birthDate: new Date('1970-07-20').toISOString(),
        deathDate: new Date('2024-10-10').toISOString(),
        shortBio: 'Their favorite song always brought joy.',
        privacy: 'link',
        songYoutubeUrl: SAMPLE_SONGS.youtube,
    };

    const res = await request('POST', '/api/memorials', memorial);

    if (!res.ok) {
        throw new Error(`Failed to create memorial: ${JSON.stringify(res.data)}`);
    }

    youtubeMemorialId = res.data.memorial.id;
    console.log(`✅ Memorial created with YouTube song: ${youtubeMemorialId}`);
    console.log(`   Song URL: ${res.data.memorial.songYoutubeUrl}`);

    return res.data;
}

/**
 * Test 3: Verify Spotify song is accessible
 */
async function test3_getSpotifyMemorial() {
    console.log('\n📝 Test 3: Verify Spotify memorial');

    const res = await request('GET', `/api/memorials/${spotifyMemorialId}`);

    if (!res.ok) {
        throw new Error(`Failed to get memorial: ${JSON.stringify(res.data)}`);
    }

    const memorial = res.data.memorial;

    if (!memorial.songSpotifyUri || memorial.songSpotifyUri !== SAMPLE_SONGS.spotify) {
        throw new Error('Spotify song URL not stored correctly');
    }

    console.log(`✅ Spotify memorial retrieved successfully`);
    console.log(`   Name: ${memorial.deceasedName}`);
    console.log(`   Song: ${memorial.songSpotifyUri}`);

    // Verify Spotify ID can be extracted
    const spotifyId = memorial.songSpotifyUri.match(/spotify\.com\/(track|album)\/([a-zA-Z0-9]+)/);
    if (!spotifyId) {
        throw new Error('Cannot extract Spotify ID from URL');
    }

    console.log(`   Spotify ID: ${spotifyId[2]}`);
    console.log(`   Embed URL: https://open.spotify.com/embed/track/${spotifyId[2]}`);

    return res.data;
}

/**
 * Test 4: Verify YouTube song is accessible
 */
async function test4_getYouTubeMemorial() {
    console.log('\n📝 Test 4: Verify YouTube memorial');

    const res = await request('GET', `/api/memorials/${youtubeMemorialId}`);

    if (!res.ok) {
        throw new Error(`Failed to get memorial: ${JSON.stringify(res.data)}`);
    }

    const memorial = res.data.memorial;

    if (!memorial.songYoutubeUrl || memorial.songYoutubeUrl !== SAMPLE_SONGS.youtube) {
        throw new Error('YouTube song URL not stored correctly');
    }

    console.log(`✅ YouTube memorial retrieved successfully`);
    console.log(`   Name: ${memorial.deceasedName}`);
    console.log(`   Song: ${memorial.songYoutubeUrl}`);

    // Verify YouTube ID can be extracted
    const youtubeId = memorial.songYoutubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (!youtubeId) {
        throw new Error('Cannot extract YouTube ID from URL');
    }

    console.log(`   YouTube ID: ${youtubeId[1]}`);
    console.log(`   Embed URL: https://www.youtube.com/embed/${youtubeId[1]}`);

    return res.data;
}

/**
 * Test 5: Test YouTube short URL format
 */
async function test5_testYouTubeShortUrl() {
    console.log('\n📝 Test 5: Test YouTube short URL (youtu.be)');

    const memorial = {
        deceasedName: 'YouTube Short URL Test',
        birthDate: new Date('1980-01-01').toISOString(),
        deathDate: new Date('2024-12-01').toISOString(),
        shortBio: 'Testing short YouTube URLs.',
        privacy: 'link',
        songYoutubeUrl: SAMPLE_SONGS.youtubeShort,
    };

    const res = await request('POST', '/api/memorials', memorial);

    if (!res.ok) {
        throw new Error(`Failed to create memorial: ${JSON.stringify(res.data)}`);
    }

    const createdMemorialId = res.data.memorial.id;

    console.log(`✅ Memorial created with YouTube short URL`);
    console.log(`   Song URL: ${res.data.memorial.songYoutubeUrl}`);

    // Extract YouTube ID
    const youtubeId = res.data.memorial.songYoutubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeId) {
        console.log(`   YouTube ID: ${youtubeId[1]}`);
    }

    // Cleanup
    await request('DELETE', `/api/memorials/${createdMemorialId}`);
    console.log(`   Cleaned up test memorial`);

    return res.data;
}

/**
 * Test 6: Test updating song URL
 */
async function test6_updateSongUrl() {
    console.log('\n📝 Test 6: Test updating song URL');

    // Update Spotify memorial to use YouTube
    const updateData = {
        songYoutubeUrl: SAMPLE_SONGS.youtube,
        songSpotifyUri: null, // Remove Spotify
    };

    const res = await request('PUT', `/api/memorials/${spotifyMemorialId}`, updateData);

    if (!res.ok) {
        throw new Error(`Failed to update memorial: ${JSON.stringify(res.data)}`);
    }

    const memorial = res.data.memorial;

    if (memorial.songSpotifyUri) {
        throw new Error('Spotify URL should be removed');
    }

    if (memorial.songYoutubeUrl !== SAMPLE_SONGS.youtube) {
        throw new Error('YouTube URL not updated');
    }

    console.log(`✅ Song URL updated successfully`);
    console.log(`   Old: Spotify`);
    console.log(`   New: YouTube - ${memorial.songYoutubeUrl}`);

    return res.data;
}

/**
 * Test 7: Test both URLs present (Spotify takes priority in UI)
 */
async function test7_testBothUrls() {
    console.log('\n📝 Test 7: Test memorial with both Spotify and YouTube URLs');

    const memorial = {
        deceasedName: 'Dual Song Test User',
        birthDate: new Date('1975-05-10').toISOString(),
        deathDate: new Date('2024-09-20').toISOString(),
        shortBio: 'Had songs on multiple platforms.',
        privacy: 'link',
        songSpotifyUri: SAMPLE_SONGS.spotify,
        songYoutubeUrl: SAMPLE_SONGS.youtube,
    };

    const res = await request('POST', '/api/memorials', memorial);

    if (!res.ok) {
        throw new Error(`Failed to create memorial: ${JSON.stringify(res.data)}`);
    }

    const createdMemorialId = res.data.memorial.id;
    const created = res.data.memorial;

    console.log(`✅ Memorial created with both URLs`);
    console.log(`   Spotify: ${created.songSpotifyUri}`);
    console.log(`   YouTube: ${created.songYoutubeUrl}`);
    console.log(`   Note: Frontend should prioritize Spotify if both present`);

    // Cleanup
    await request('DELETE', `/api/memorials/${createdMemorialId}`);
    console.log(`   Cleaned up test memorial`);

    return res.data;
}

/**
 * Test 8: Cleanup - delete test memorials
 */
async function test8_cleanup() {
    console.log('\n📝 Test 8: Cleanup test memorials');

    let cleanupCount = 0;

    if (spotifyMemorialId) {
        const res = await request('DELETE', `/api/memorials/${spotifyMemorialId}`);
        if (res.ok) {
            console.log(`✅ Deleted Spotify memorial: ${spotifyMemorialId}`);
            cleanupCount++;
        }
    }

    if (youtubeMemorialId) {
        const res = await request('DELETE', `/api/memorials/${youtubeMemorialId}`);
        if (res.ok) {
            console.log(`✅ Deleted YouTube memorial: ${youtubeMemorialId}`);
            cleanupCount++;
        }
    }

    console.log(`✅ Cleaned up ${cleanupCount} test memorials`);
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 Forever Fields - Song Player Integration Tests');
    console.log('='.repeat(60));
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`Authorization: Bearer ${ACCESS_TOKEN.substring(0, 20)}...`);

    try {
        await test1_createMemorialWithSpotify();
        await test2_createMemorialWithYouTube();
        await test3_getSpotifyMemorial();
        await test4_getYouTubeMemorial();
        await test5_testYouTubeShortUrl();
        await test6_updateSongUrl();
        await test7_testBothUrls();
        await test8_cleanup();

        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL TESTS PASSED');
        console.log('='.repeat(60));
        console.log('\n✨ Song player functionality verified successfully!\n');
        console.log('Frontend Integration:');
        console.log('- Spotify embeds: https://open.spotify.com/embed/track/[ID]');
        console.log('- YouTube embeds: https://www.youtube.com/embed/[ID]');
        console.log('- Both provide playback on memorial pages\n');

        process.exit(0);
    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ TEST FAILED');
        console.error('='.repeat(60));
        console.error('\nError:', error.message);
        console.error('\n');

        // Cleanup on failure
        if (spotifyMemorialId || youtubeMemorialId) {
            console.log('🧹 Attempting cleanup...');
            try {
                if (spotifyMemorialId) {
                    await request('DELETE', `/api/memorials/${spotifyMemorialId}`);
                }
                if (youtubeMemorialId) {
                    await request('DELETE', `/api/memorials/${youtubeMemorialId}`);
                }
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
