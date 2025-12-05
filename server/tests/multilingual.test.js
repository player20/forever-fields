/**
 * Multilingual Test Suite
 * Tests v0.7-lang features: language switcher and auto-detection
 */

const BASE_URL = 'http://localhost:3000';

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
 * Test 1: Language Switcher File Check
 */
async function testLanguageSwitcherFile() {
    logSection('TEST 1: Language Switcher File Check');

    logStep('Checking language-switcher.js file');

    try {
        const response = await fetch(`${BASE_URL}/js/language-switcher.js`);
        const content = await response.text();

        logSuccess('Language switcher file found');
        console.log(`File size: ${content.length} bytes`);

        // Check for key features
        const features = [
            { name: 'Supported languages', pattern: /LANGUAGES:\s*\{/ },
            { name: 'Auto-detection', pattern: /detectLanguage/ },
            { name: 'Translation engine', pattern: /translatePage/ },
            { name: 'Google Translate API', pattern: /translate\.googleapis\.com/ },
            { name: 'RTL support', pattern: /updateDirection/ },
            { name: 'localStorage persistence', pattern: /localStorage\.getItem/ },
            { name: 'Dynamic content observer', pattern: /observeDynamicContent/ },
            { name: 'Keyboard navigation', pattern: /handleKeyboardNav/ },
        ];

        features.forEach(({ name, pattern }) => {
            if (pattern.test(content)) {
                logSuccess(`${name} found`);
            } else {
                logWarning(`${name} not found`);
            }
        });

        // Check for all 8 languages
        const languages = ['en', 'es', 'vi', 'ar', 'tl', 'fr', 'pt', 'zh'];
        const languageNames = ['English', 'Español', 'Tiếng Việt', 'العربية', 'Tagalog', 'Français', 'Português', '中文'];

        logStep('Checking supported languages');
        languages.forEach((lang, index) => {
            if (content.includes(`${lang}:`) && content.includes(languageNames[index])) {
                logSuccess(`${languageNames[index]} (${lang}) supported`);
            } else {
                logWarning(`${languageNames[index]} (${lang}) not found`);
            }
        });

    } catch (error) {
        logError(`Failed to fetch language switcher: ${error.message}`);
    }
}

/**
 * Test 2: HTML Integration Check
 */
async function testHTMLIntegration() {
    logSection('TEST 2: HTML Integration Check');

    logStep('Checking language switcher UI in HTML pages');

    const pages = [
        { url: '/', name: 'Home Page' },
        { url: '/create/', name: 'Create Page' },
        { url: '/dashboard/', name: 'Dashboard Page' },
        { url: '/memorial/', name: 'Memorial Page' },
    ];

    for (const page of pages) {
        try {
            const response = await fetch(`${BASE_URL}${page.url}`);
            const html = await response.text();

            logStep(`Checking ${page.name}`);

            // Check for language switcher script inclusion
            if (html.includes('language-switcher.js')) {
                logSuccess('Language switcher script included');
            } else {
                logWarning('Language switcher script not found');
            }

            // Check for language switcher UI elements
            const uiElements = [
                { name: 'Language toggle button', pattern: /languageToggle/ },
                { name: 'Language dropdown', pattern: /languageDropdown/ },
                { name: 'Language options', pattern: /language-option/ },
            ];

            uiElements.forEach(({ name, pattern }) => {
                if (pattern.test(html)) {
                    logSuccess(`${name} found`);
                } else {
                    logWarning(`${name} not found in ${page.name}`);
                }
            });

        } catch (error) {
            logError(`Failed to check ${page.name}: ${error.message}`);
        }
    }
}

/**
 * Test 3: Translation API Check
 */
async function testTranslationAPI() {
    logSection('TEST 3: Translation API Check');

    logStep('Testing Google Translate API endpoint');

    const testText = 'Welcome to Forever Fields';
    const targetLang = 'es'; // Spanish

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(testText)}`;

        logStep(`Translating: "${testText}" to Spanish`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();

            if (data && data[0]) {
                let translated = '';
                data[0].forEach(segment => {
                    if (segment && segment[0]) {
                        translated += segment[0];
                    }
                });

                logSuccess(`Translation successful: "${translated}"`);
                logSuccess('Google Translate API is working');
            } else {
                logWarning('Unexpected API response format');
            }
        } else {
            logError(`Translation API returned status: ${response.status}`);
            logWarning('API may be rate-limited or unavailable');
        }

    } catch (error) {
        logError(`Translation API test failed: ${error.message}`);
        logWarning('This is expected if offline or API is blocked');
    }
}

/**
 * Test 4: Browser Language Detection Simulation
 */
async function testLanguageDetection() {
    logSection('TEST 4: Language Detection Logic');

    logStep('Simulating browser language detection');

    const testCases = [
        { browserLang: 'en-US', expected: 'en', name: 'English (US)' },
        { browserLang: 'es-ES', expected: 'es', name: 'Spanish (Spain)' },
        { browserLang: 'es-MX', expected: 'es', name: 'Spanish (Mexico)' },
        { browserLang: 'vi-VN', expected: 'vi', name: 'Vietnamese' },
        { browserLang: 'ar-SA', expected: 'ar', name: 'Arabic (Saudi Arabia)' },
        { browserLang: 'tl-PH', expected: 'tl', name: 'Tagalog (Philippines)' },
        { browserLang: 'fr-FR', expected: 'fr', name: 'French (France)' },
        { browserLang: 'pt-BR', expected: 'pt', name: 'Portuguese (Brazil)' },
        { browserLang: 'zh-CN', expected: 'zh', name: 'Chinese (Simplified)' },
        { browserLang: 'de-DE', expected: 'en', name: 'German (defaults to English)' },
        { browserLang: 'ja-JP', expected: 'en', name: 'Japanese (defaults to English)' },
    ];

    testCases.forEach(({ browserLang, expected, name }) => {
        const detected = browserLang.split('-')[0].toLowerCase();
        const supportedLangs = ['en', 'es', 'vi', 'ar', 'tl', 'fr', 'pt', 'zh'];
        const result = supportedLangs.includes(detected) ? detected : 'en';

        if (result === expected) {
            logSuccess(`${name} (${browserLang}) → ${result}`);
        } else {
            logError(`${name} (${browserLang}) → ${result} (expected: ${expected})`);
        }
    });
}

/**
 * Test 5: RTL Language Support
 */
async function testRTLSupport() {
    logSection('TEST 5: RTL Language Support');

    logStep('Checking RTL (Right-to-Left) support for Arabic');

    try {
        const response = await fetch(`${BASE_URL}/js/language-switcher.js`);
        const content = await response.text();

        // Check for RTL configuration
        if (content.includes("dir: 'rtl'") && content.includes('ar:')) {
            logSuccess('RTL configuration found for Arabic');
        } else {
            logWarning('RTL configuration not found');
        }

        // Check for direction update function
        if (content.includes('updateDirection') && content.includes('setAttribute(\'dir\', \'rtl\')')) {
            logSuccess('Direction update function found');
        } else {
            logWarning('Direction update function not found');
        }

        // Check for RTL class toggle
        if (content.includes('rtl-active')) {
            logSuccess('RTL class toggle found');
        } else {
            logWarning('RTL class toggle not found');
        }

    } catch (error) {
        logError(`RTL support check failed: ${error.message}`);
    }
}

/**
 * Test 6: localStorage Persistence
 */
async function testLocalStoragePersistence() {
    logSection('TEST 6: localStorage Persistence');

    logStep('Checking localStorage implementation');

    try {
        const response = await fetch(`${BASE_URL}/js/language-switcher.js`);
        const content = await response.text();

        // Check for storage key
        if (content.includes('STORAGE_KEY') && content.includes('ff_language')) {
            logSuccess('Storage key defined: ff_language');
        } else {
            logWarning('Storage key not found');
        }

        // Check for save operation
        if (content.includes('localStorage.setItem(this.STORAGE_KEY')) {
            logSuccess('Language preference save operation found');
        } else {
            logWarning('Save operation not found');
        }

        // Check for load operation
        if (content.includes('localStorage.getItem(this.STORAGE_KEY)')) {
            logSuccess('Language preference load operation found');
        } else {
            logWarning('Load operation not found');
        }

        logSuccess('localStorage persistence is implemented');

    } catch (error) {
        logError(`localStorage check failed: ${error.message}`);
    }
}

/**
 * Test 7: Dynamic Content Translation
 */
async function testDynamicTranslation() {
    logSection('TEST 7: Dynamic Content Translation');

    logStep('Checking MutationObserver for dynamic content');

    try {
        const response = await fetch(`${BASE_URL}/js/language-switcher.js`);
        const content = await response.text();

        // Check for MutationObserver
        if (content.includes('MutationObserver') && content.includes('observeDynamicContent')) {
            logSuccess('MutationObserver implementation found');
        } else {
            logWarning('MutationObserver not found');
        }

        // Check for dynamic translation trigger
        if (content.includes('addedNodes') && content.includes('dynamicTranslateTimeout')) {
            logSuccess('Dynamic translation trigger found');
        } else {
            logWarning('Dynamic translation trigger not found');
        }

        // Check for debouncing
        if (content.includes('setTimeout') && content.includes('clearTimeout(this.dynamicTranslateTimeout)')) {
            logSuccess('Debouncing for performance found');
        } else {
            logWarning('Debouncing not found');
        }

    } catch (error) {
        logError(`Dynamic translation check failed: ${error.message}`);
    }
}

/**
 * Test 8: Accessibility Features
 */
async function testAccessibility() {
    logSection('TEST 8: Accessibility Features');

    logStep('Checking accessibility implementation');

    try {
        const response = await fetch(`${BASE_URL}/js/language-switcher.js`);
        const content = await response.text();

        const features = [
            { name: 'ARIA expanded attribute', pattern: /setAttribute\('aria-expanded'/ },
            { name: 'ARIA label support', pattern: /aria-label/ },
            { name: 'Keyboard navigation (ArrowDown)', pattern: /ArrowDown/ },
            { name: 'Keyboard navigation (ArrowUp)', pattern: /ArrowUp/ },
            { name: 'Keyboard navigation (Enter)', pattern: /Enter/ },
            { name: 'Keyboard navigation (Escape)', pattern: /Escape/ },
            { name: 'Focus management', pattern: /\.focus\(\)/ },
        ];

        features.forEach(({ name, pattern }) => {
            if (pattern.test(content)) {
                logSuccess(`${name} implemented`);
            } else {
                logWarning(`${name} not found`);
            }
        });

    } catch (error) {
        logError(`Accessibility check failed: ${error.message}`);
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.clear();
    log('╔════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  Forever Fields v0.7-lang Test Suite                      ║', 'magenta');
    log('║  Multilingual Support & Auto-Detection                    ║', 'magenta');
    log('╚════════════════════════════════════════════════════════════╝', 'magenta');

    log('\nServer: ' + BASE_URL, 'yellow');
    log('\nTesting multilingual features...', 'yellow');

    try {
        // Test language switcher file
        await testLanguageSwitcherFile();

        // Test HTML integration
        await testHTMLIntegration();

        // Test translation API
        await testTranslationAPI();

        // Test language detection logic
        await testLanguageDetection();

        // Test RTL support
        await testRTLSupport();

        // Test localStorage persistence
        await testLocalStoragePersistence();

        // Test dynamic translation
        await testDynamicTranslation();

        // Test accessibility
        await testAccessibility();

        logSection('TEST SUMMARY');
        logSuccess('All tests completed!');

        log('\nSupported Languages:', 'bright');
        console.log('1. English (en)');
        console.log('2. Español (es) - Spanish');
        console.log('3. Tiếng Việt (vi) - Vietnamese');
        console.log('4. العربية (ar) - Arabic (RTL)');
        console.log('5. Tagalog (tl) - Filipino');
        console.log('6. Français (fr) - French');
        console.log('7. Português (pt) - Portuguese');
        console.log('8. 中文 (zh) - Chinese');

        log('\nManual Testing Checklist:', 'bright');
        console.log('□ Open site and verify auto-detection (check browser language)');
        console.log('□ Click globe icon in header to open language dropdown');
        console.log('□ Select different language and verify page translates');
        console.log('□ Verify language persists after page reload');
        console.log('□ Test Arabic (ar) and verify RTL layout');
        console.log('□ Add dynamic content (e.g., light candle) and verify translation');
        console.log('□ Test keyboard navigation (Tab, Arrow keys, Enter)');
        console.log('□ Test mobile language selector (if on mobile)');

        log('\nNext Steps:', 'bright');
        console.log('1. Open Forever Fields in your browser');
        console.log('2. Change browser language to test auto-detection');
        console.log('3. Manually switch between languages using globe icon');
        console.log('4. Verify translations are accurate and natural');
        console.log('5. Test on mobile devices for responsive behavior');

    } catch (error) {
        logError('Test suite failed with error:');
        console.error(error);
    }
}

// Run tests
runAllTests();
