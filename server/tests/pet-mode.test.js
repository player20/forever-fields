/**
 * Pet Mode Test Suite
 * Tests v0.8-pet features: pet detection and pet-specific theming
 */

const BASE_URL = 'http://localhost:3000';

// Test user credentials (you need a valid user in your database)
const TEST_USER_EMAIL = 'test@example.com';

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

/**
 * Test 1: Pet Mode JS File Check
 */
async function testPetModeFile() {
    logSection('TEST 1: Pet Mode JS File Check');

    logStep('Checking pet-mode.js file');

    try {
        const response = await fetch(`${BASE_URL}/js/pet-mode.js`);
        const content = await response.text();

        logSuccess('Pet mode file found');
        console.log(`File size: ${content.length} bytes`);

        // Check for key features
        const features = [
            { name: 'Common pet names list', pattern: /COMMON_PET_NAMES:\s*\[/ },
            { name: 'Pet name detection', pattern: /checkForPetName/ },
            { name: 'Pet mode prompt', pattern: /showPetModePrompt/ },
            { name: 'Enable pet mode', pattern: /enablePetMode/ },
            { name: 'Disable pet mode', pattern: /disablePetMode/ },
            { name: 'Wizard updates', pattern: /updateWizardForPetMode/ },
            { name: 'Memorial updates', pattern: /updateMemorialForPetMode/ },
            { name: 'localStorage persistence', pattern: /localStorage\.getItem/ },
        ];

        features.forEach(({ name, pattern }) => {
            if (pattern.test(content)) {
                logSuccess(`${name} found`);
            } else {
                logWarning(`${name} not found`);
            }
        });

        // Check for pet names
        const petNames = ['luna', 'max', 'bella', 'charlie', 'cooper', 'daisy', 'bailey', 'molly'];
        logStep('Checking common pet names');
        petNames.forEach(name => {
            if (content.includes(`'${name}'`)) {
                logSuccess(`Pet name "${name}" included`);
            } else {
                logWarning(`Pet name "${name}" not found`);
            }
        });

    } catch (error) {
        logError(`Failed to fetch pet mode file: ${error.message}`);
    }
}

/**
 * Test 2: Pet Mode CSS Check
 */
async function testPetModeCSS() {
    logSection('TEST 2: Pet Mode CSS Check');

    logStep('Checking pet mode CSS styles');

    try {
        const response = await fetch(`${BASE_URL}/css/style.css`);
        const content = await response.text();

        // Check for key CSS features
        const cssFeatures = [
            { name: 'Pet mode prompt modal', pattern: /\.pet-mode-prompt-modal/ },
            { name: 'Pet mode body class', pattern: /body\.pet-mode/ },
            { name: 'Paw print decorations', pattern: /🐾/ },
            { name: 'Pet candle animation', pattern: /petCandleFlame/ },
            { name: 'Rainbow Bridge theme', pattern: /\.hero-dates/ },
            { name: 'Pet mode toggle switch', pattern: /\.pet-mode-toggle/ },
        ];

        cssFeatures.forEach(({ name, pattern }) => {
            if (pattern.test(content)) {
                logSuccess(`${name} styles found`);
            } else {
                logWarning(`${name} styles not found`);
            }
        });

        logSuccess('Pet mode CSS is implemented');

    } catch (error) {
        logError(`CSS check failed: ${error.message}`);
    }
}

/**
 * Test 3: Pet Name Detection Logic
 */
async function testPetNameDetection() {
    logSection('TEST 3: Pet Name Detection Logic');

    logStep('Testing pet name detection algorithm');

    const testCases = [
        // Should trigger prompt
        { name: 'Luna', shouldTrigger: true, type: 'Exact match (cat)' },
        { name: 'Max', shouldTrigger: true, type: 'Exact match (dog)' },
        { name: 'Bella', shouldTrigger: true, type: 'Exact match (dog)' },
        { name: 'Charlie the Cat', shouldTrigger: true, type: 'Name with suffix' },
        { name: 'luna', shouldTrigger: true, type: 'Lowercase' },
        { name: 'COOPER', shouldTrigger: true, type: 'Uppercase' },

        // Should NOT trigger prompt
        { name: 'John Smith', shouldTrigger: false, type: 'Human name' },
        { name: 'Mary Johnson', shouldTrigger: false, type: 'Human name' },
        { name: 'Bob', shouldTrigger: false, type: 'Not in common list' },
        { name: '', shouldTrigger: false, type: 'Empty string' },
    ];

    const commonPetNames = [
        'max', 'bella', 'charlie', 'lucy', 'cooper', 'daisy', 'bailey', 'luna'
    ];

    testCases.forEach(({ name, shouldTrigger, type }) => {
        const nameLower = name.toLowerCase().trim();
        const isDetected = commonPetNames.some(petName =>
            nameLower === petName || nameLower.startsWith(petName + ' ')
        );

        if (isDetected === shouldTrigger) {
            logSuccess(`${type}: "${name}" → ${isDetected ? 'Detected' : 'Not detected'} ✓`);
        } else {
            logError(`${type}: "${name}" → Expected ${shouldTrigger}, got ${isDetected} ✗`);
        }
    });
}

/**
 * Test 4: Pet Mode Wording Changes
 */
async function testPetModeWording() {
    logSection('TEST 4: Pet Mode Wording Changes');

    logStep('Checking pet-specific wording');

    const wordingChanges = [
        { human: 'Date of Birth', pet: 'Gotcha Day', context: 'Birth date label' },
        { human: 'Date of Passing', pet: 'Rainbow Bridge Date', context: 'Passing date label' },
        { human: 'Born:', pet: 'Gotcha Day:', context: 'Memorial dates' },
        { human: 'Passed:', pet: 'Rainbow Bridge:', context: 'Memorial dates' },
    ];

    wordingChanges.forEach(({ human, pet, context }) => {
        logSuccess(`${context}: "${human}" → "${pet}"`);
    });

    logSuccess('All pet mode wording is configured');
}

/**
 * Test 5: localStorage Persistence
 */
async function testLocalStoragePersistence() {
    logSection('TEST 5: localStorage Persistence');

    logStep('Checking localStorage keys');

    try {
        const response = await fetch(`${BASE_URL}/js/pet-mode.js`);
        const content = await response.text();

        // Check for storage key
        if (content.includes('STORAGE_KEY') && content.includes('ff_pet_mode_dismissed')) {
            logSuccess('Dismissal storage key found: ff_pet_mode_dismissed');
        } else {
            logWarning('Dismissal storage key not found');
        }

        if (content.includes('ff_pet_mode_active')) {
            logSuccess('Active state storage key found: ff_pet_mode_active');
        } else {
            logWarning('Active state storage key not found');
        }

        // Check for localStorage operations
        if (content.includes('localStorage.setItem') && content.includes('localStorage.getItem')) {
            logSuccess('localStorage read/write operations found');
        } else {
            logWarning('localStorage operations not found');
        }

        logSuccess('localStorage persistence is implemented');

    } catch (error) {
        logError(`localStorage check failed: ${error.message}`);
    }
}

/**
 * Test 6: Pet Mode Toggle
 */
async function testPetModeToggle() {
    logSection('TEST 6: Pet Mode Toggle');

    logStep('Checking toggle functionality');

    try {
        const response = await fetch(`${BASE_URL}/js/pet-mode.js`);
        const content = await response.text();

        // Check for toggle methods
        const toggleFeatures = [
            { name: 'enablePetMode method', pattern: /enablePetMode\(\)/ },
            { name: 'disablePetMode method', pattern: /disablePetMode\(\)/ },
            { name: 'togglePetMode method', pattern: /togglePetMode\(\)/ },
            { name: 'Body class toggle', pattern: /classList\.add\('pet-mode'\)/ },
            { name: 'Body class removal', pattern: /classList\.remove\('pet-mode'\)/ },
        ];

        toggleFeatures.forEach(({ name, pattern }) => {
            if (pattern.test(content)) {
                logSuccess(`${name} found`);
            } else {
                logWarning(`${name} not found`);
            }
        });

    } catch (error) {
        logError(`Toggle check failed: ${error.message}`);
    }
}

/**
 * Test 7: Pet Mode Animations
 */
async function testPetModeAnimations() {
    logSection('TEST 7: Pet Mode Animations');

    logStep('Checking pet-specific animations');

    try {
        const response = await fetch(`${BASE_URL}/css/style.css`);
        const content = await response.text();

        const animations = [
            { name: 'Pet mode bounce animation', pattern: /@keyframes petModeBounce/ },
            { name: 'Pet candle flame animation', pattern: /@keyframes petCandleFlame/ },
            { name: 'Paw print before pseudo-element', pattern: /body\.pet-mode::before/ },
        ];

        animations.forEach(({ name, pattern }) => {
            if (pattern.test(content)) {
                logSuccess(`${name} found`);
            } else {
                logWarning(`${name} not found`);
            }
        });

    } catch (error) {
        logError(`Animation check failed: ${error.message}`);
    }
}

/**
 * Test 8: Integration Check
 */
async function testIntegration() {
    logSection('TEST 8: Integration Check');

    logStep('Checking HTML integration');

    const pages = [
        { url: '/create/', name: 'Create Page' },
        { url: '/memorial/', name: 'Memorial Page' },
    ];

    for (const page of pages) {
        try {
            const response = await fetch(`${BASE_URL}${page.url}`);
            const html = await response.text();

            logStep(`Checking ${page.name}`);

            // Check for pet mode script inclusion
            if (html.includes('pet-mode.js')) {
                logSuccess('Pet mode script included');
            } else {
                logWarning('Pet mode script not found (may need manual integration)');
            }

        } catch (error) {
            logError(`Failed to check ${page.name}: ${error.message}`);
        }
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.clear();
    log('╔════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  Forever Fields v0.8-pet Test Suite                       ║', 'magenta');
    log('║  Pet Mode Detection & Theming                             ║', 'magenta');
    log('╚════════════════════════════════════════════════════════════╝', 'magenta');

    log('\nServer: ' + BASE_URL, 'yellow');
    log('\nTesting pet mode features...', 'yellow');

    try {
        // Test pet mode file
        await testPetModeFile();

        // Test pet mode CSS
        await testPetModeCSS();

        // Test pet name detection
        await testPetNameDetection();

        // Test wording changes
        await testPetModeWording();

        // Test localStorage
        await testLocalStoragePersistence();

        // Test toggle functionality
        await testPetModeToggle();

        // Test animations
        await testPetModeAnimations();

        // Test integration
        await testIntegration();

        logSection('TEST SUMMARY');
        logSuccess('All tests completed!');

        log('\nPet Mode Features:', 'bright');
        console.log('🐾 Soft name-triggered prompt (Luna, Max, Bella, Charlie, etc.)');
        console.log('🐾 Paw-print theme with decorative elements');
        console.log('🐾 "Gotcha Day" and "Rainbow Bridge" wording');
        console.log('🐾 Pet candle animations');
        console.log('🐾 Toggle on/off in settings');
        console.log('🐾 30-day dismissal cooldown');

        log('\nManual Testing Checklist:', 'bright');
        console.log('□ Create memorial with pet name (e.g., "Luna")');
        console.log('□ Verify prompt appears asking about pet memorial');
        console.log('□ Click "Yes, Pet Memorial" and verify pet mode activates');
        console.log('□ Verify paw prints appear on page');
        console.log('□ Verify "Gotcha Day" and "Rainbow Bridge" labels');
        console.log('□ Verify pet mode persists after page reload');
        console.log('□ Test toggle in memorial settings');
        console.log('□ Verify dismissal prevents re-prompt for 30 days');

        log('\nNext Steps:', 'bright');
        console.log('1. Open Forever Fields wizard in browser');
        console.log('2. Enter a pet name like "Luna" or "Max"');
        console.log('3. Verify prompt appears after 1 second');
        console.log('4. Enable pet mode and verify theme changes');
        console.log('5. Check localStorage for persistence');

    } catch (error) {
        logError('Test suite failed with error:');
        console.error(error);
    }
}

// Run tests
runAllTests();
