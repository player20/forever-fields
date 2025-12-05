/**
 * Forever Fields - Language Switcher Module
 * Multilingual support with Google Translate integration
 *
 * Supports: English, Spanish, Vietnamese, Arabic (RTL), Tagalog, French, Portuguese, Chinese
 */

(function() {
    'use strict';

    // =====================================================
    // CONFIGURATION
    // =====================================================

    const FFLang = {
        // Supported languages with metadata
        LANGUAGES: {
            en: { name: 'English', nativeName: 'English', dir: 'ltr', code: 'EN' },
            es: { name: 'Spanish', nativeName: 'Español', dir: 'ltr', code: 'ES' },
            vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', dir: 'ltr', code: 'VI' },
            ar: { name: 'Arabic', nativeName: 'العربية', dir: 'rtl', code: 'AR' },
            tl: { name: 'Tagalog', nativeName: 'Tagalog', dir: 'ltr', code: 'TL' },
            fr: { name: 'French', nativeName: 'Français', dir: 'ltr', code: 'FR' },
            pt: { name: 'Portuguese', nativeName: 'Português', dir: 'ltr', code: 'PT' },
            zh: { name: 'Chinese', nativeName: '中文', dir: 'ltr', code: 'ZH' }
        },

        // localStorage key for persistence
        STORAGE_KEY: 'ff_language',

        // Pre-translated CSS content for pseudo-elements
        CSS_TRANSLATIONS: {
            en: {
                '--i18n-pending-approval': 'Awaiting approval',
                '--i18n-pending-own': 'Submitted - waiting for family approval'
            },
            es: {
                '--i18n-pending-approval': 'Esperando aprobación',
                '--i18n-pending-own': 'Enviado - esperando aprobación de la familia'
            },
            vi: {
                '--i18n-pending-approval': 'Đang chờ phê duyệt',
                '--i18n-pending-own': 'Đã gửi - đang chờ gia đình phê duyệt'
            },
            ar: {
                '--i18n-pending-approval': 'في انتظار الموافقة',
                '--i18n-pending-own': 'تم الإرسال - في انتظار موافقة العائلة'
            },
            tl: {
                '--i18n-pending-approval': 'Naghihintay ng pag-apruba',
                '--i18n-pending-own': 'Naisumite - naghihintay ng pag-apruba ng pamilya'
            },
            fr: {
                '--i18n-pending-approval': 'En attente d\'approbation',
                '--i18n-pending-own': 'Soumis - en attente de l\'approbation de la famille'
            },
            pt: {
                '--i18n-pending-approval': 'Aguardando aprovação',
                '--i18n-pending-own': 'Enviado - aguardando aprovação da família'
            },
            zh: {
                '--i18n-pending-approval': '等待批准',
                '--i18n-pending-own': '已提交 - 等待家人批准'
            }
        },

        // Current state
        currentLang: 'en',
        originalTexts: new Map(),
        isTranslating: false,

        // =====================================================
        // INITIALIZATION
        // =====================================================

        init() {
            // Detect and set initial language
            this.currentLang = this.detectLanguage();

            // Initialize UI components
            this.initDropdown();
            this.initMobileSelect();

            // Apply saved language if not English
            if (this.currentLang !== 'en') {
                this.setLanguage(this.currentLang, false);
            }

            // Update UI to reflect current language
            this.updateUI();

            // Monitor for dynamic content
            this.observeDynamicContent();

            console.log('[FFLang] Initialized with language:', this.currentLang);
        },

        // =====================================================
        // LANGUAGE DETECTION
        // =====================================================

        detectLanguage() {
            // 1. Check localStorage first
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved && this.LANGUAGES[saved]) {
                return saved;
            }

            // 2. Check browser language
            const browserLang = navigator.language || navigator.userLanguage || '';
            const shortLang = browserLang.split('-')[0].toLowerCase();

            if (this.LANGUAGES[shortLang]) {
                return shortLang;
            }

            // 3. Default to English
            return 'en';
        },

        // =====================================================
        // DROPDOWN INITIALIZATION
        // =====================================================

        initDropdown() {
            const toggle = document.getElementById('languageToggle');
            const dropdown = document.getElementById('languageDropdown');

            if (!toggle || !dropdown) {
                // Language switcher not present on this page
                return;
            }

            // Toggle dropdown on click
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.contains('active');

                if (isOpen) {
                    this.closeDropdown();
                } else {
                    this.openDropdown();
                }
            });

            // Language selection
            dropdown.querySelectorAll('.language-option').forEach(option => {
                option.addEventListener('click', () => {
                    const lang = option.dataset.lang;
                    if (lang && lang !== this.currentLang) {
                        this.setLanguage(lang);
                    }
                    this.closeDropdown();
                });
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.language-switcher')) {
                    this.closeDropdown();
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeDropdown();
                }
            });

            // Keyboard navigation within dropdown
            dropdown.addEventListener('keydown', (e) => {
                this.handleKeyboardNav(e, dropdown);
            });
        },

        openDropdown() {
            const toggle = document.getElementById('languageToggle');
            const dropdown = document.getElementById('languageDropdown');

            if (toggle) toggle.setAttribute('aria-expanded', 'true');
            if (dropdown) {
                dropdown.classList.add('active');
                // Focus first option for accessibility
                const firstOption = dropdown.querySelector('.language-option');
                if (firstOption) firstOption.focus();
            }
        },

        closeDropdown() {
            const toggle = document.getElementById('languageToggle');
            const dropdown = document.getElementById('languageDropdown');

            if (toggle) toggle.setAttribute('aria-expanded', 'false');
            if (dropdown) dropdown.classList.remove('active');
        },

        handleKeyboardNav(e, dropdown) {
            const options = Array.from(dropdown.querySelectorAll('.language-option'));
            const currentIndex = options.indexOf(document.activeElement);

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % options.length;
                    options[nextIndex].focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    const prevIndex = (currentIndex - 1 + options.length) % options.length;
                    options[prevIndex].focus();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (document.activeElement.classList.contains('language-option')) {
                        document.activeElement.click();
                    }
                    break;
            }
        },

        // =====================================================
        // MOBILE SELECT INITIALIZATION
        // =====================================================

        initMobileSelect() {
            const select = document.getElementById('mobileLangSelect');
            if (!select) return;

            select.value = this.currentLang;

            select.addEventListener('change', () => {
                this.setLanguage(select.value);
            });
        },

        // =====================================================
        // LANGUAGE SWITCHING
        // =====================================================

        async setLanguage(lang, save = true) {
            if (!this.LANGUAGES[lang] || this.isTranslating) return;

            const previousLang = this.currentLang;
            this.currentLang = lang;

            // Save preference to localStorage
            if (save) {
                localStorage.setItem(this.STORAGE_KEY, lang);
            }

            // Show loading state
            this.setLoadingState(true);

            try {
                // Handle RTL direction
                this.updateDirection(lang);

                // Translate content
                if (lang === 'en') {
                    this.restoreOriginalTexts();
                } else {
                    await this.translatePage(lang);
                }

                // Update CSS custom properties for pseudo-elements
                this.updateCSSTranslations(lang);

                // Update UI elements
                this.updateUI();

                // Dispatch custom event for other modules
                document.dispatchEvent(new CustomEvent('languageChanged', {
                    detail: { from: previousLang, to: lang }
                }));

                console.log('[FFLang] Language changed:', previousLang, '->', lang);

            } catch (error) {
                console.error('[FFLang] Translation error:', error);
                // Fallback to English on error
                if (lang !== 'en') {
                    this.restoreOriginalTexts();
                    this.currentLang = 'en';
                    localStorage.setItem(this.STORAGE_KEY, 'en');
                    this.updateUI();
                    // Show error toast if available
                    if (typeof window.showToast === 'function') {
                        window.showToast('Translation unavailable. Using English.', 'warning');
                    }
                }
            } finally {
                this.setLoadingState(false);
            }
        },

        // =====================================================
        // TRANSLATION ENGINE
        // =====================================================

        async translatePage(targetLang) {
            this.isTranslating = true;

            // Collect all translatable elements
            const elements = this.getTranslatableElements();

            // Store original texts if not already stored
            elements.forEach(el => {
                if (!this.originalTexts.has(el)) {
                    this.originalTexts.set(el, {
                        text: this.getDirectTextContent(el),
                        placeholder: el.placeholder || null,
                        title: el.title || null,
                        ariaLabel: el.getAttribute('aria-label') || null
                    });
                }
            });

            // Batch translate for efficiency
            const textsToTranslate = [];
            const elementMap = [];

            elements.forEach(el => {
                const original = this.originalTexts.get(el);
                if (original.text && original.text.trim()) {
                    textsToTranslate.push(original.text);
                    elementMap.push({ el, type: 'text' });
                }
                if (original.placeholder) {
                    textsToTranslate.push(original.placeholder);
                    elementMap.push({ el, type: 'placeholder' });
                }
                if (original.title) {
                    textsToTranslate.push(original.title);
                    elementMap.push({ el, type: 'title' });
                }
                if (original.ariaLabel) {
                    textsToTranslate.push(original.ariaLabel);
                    elementMap.push({ el, type: 'ariaLabel' });
                }
            });

            if (textsToTranslate.length === 0) {
                this.isTranslating = false;
                return;
            }

            // Translate in batches (Google has limits)
            const batchSize = 50;
            const translations = [];

            for (let i = 0; i < textsToTranslate.length; i += batchSize) {
                const batch = textsToTranslate.slice(i, i + batchSize);
                const translated = await this.translateBatch(batch, targetLang);
                translations.push(...translated);
            }

            // Apply translations with smooth transition
            elementMap.forEach((item, index) => {
                const translated = translations[index];
                if (!translated) return;

                // Add translating class for CSS transition
                item.el.classList.add('translating');

                // Apply translation after brief delay for visual effect
                setTimeout(() => {
                    switch (item.type) {
                        case 'text':
                            this.setDirectTextContent(item.el, translated);
                            break;
                        case 'placeholder':
                            item.el.placeholder = translated;
                            break;
                        case 'title':
                            item.el.title = translated;
                            break;
                        case 'ariaLabel':
                            item.el.setAttribute('aria-label', translated);
                            break;
                    }
                    item.el.classList.remove('translating');
                }, 50);
            });

            this.isTranslating = false;
        },

        async translateBatch(texts, targetLang) {
            try {
                const translations = await Promise.all(
                    texts.map(text => this.translateText(text, targetLang))
                );
                return translations;
            } catch (error) {
                console.error('[FFLang] Batch translation failed:', error);
                return texts; // Return original on failure
            }
        },

        async translateText(text, targetLang) {
            if (!text || !text.trim()) return text;

            try {
                // Free Google Translate API endpoint
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Translation API error: ${response.status}`);
                }

                const data = await response.json();

                // Parse response - format: [[["translated","original",...],...]...]
                if (data && data[0]) {
                    let translated = '';
                    data[0].forEach(segment => {
                        if (segment && segment[0]) {
                            translated += segment[0];
                        }
                    });
                    return translated || text;
                }

                return text;
            } catch (error) {
                console.error('[FFLang] Translation failed for:', text.substring(0, 50), error);
                return text;
            }
        },

        // =====================================================
        // DOM TRAVERSAL
        // =====================================================

        getTranslatableElements() {
            const elements = [];
            const selector = [
                // Common translatable elements
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'p', 'span', 'a', 'button', 'label',
                'li', 'td', 'th', 'dt', 'dd',
                // Form elements with placeholders
                'input[placeholder]',
                'textarea[placeholder]',
                // Specific classes
                '.btn'
            ].join(', ');

            document.querySelectorAll(selector).forEach(el => {
                // Skip if marked as no-translate
                if (this.shouldSkipElement(el)) return;

                // Skip empty elements
                const text = this.getDirectTextContent(el);
                if (!text.trim() && !el.placeholder) return;

                elements.push(el);
            });

            return elements;
        },

        shouldSkipElement(el) {
            // Check for no-translate markers
            if (el.hasAttribute('data-no-translate')) return true;
            if (el.closest('[data-no-translate]')) return true;

            // Skip language switcher itself
            if (el.closest('.language-switcher')) return true;
            if (el.closest('#languageSwitcher')) return true;

            // Skip scripts, styles, noscript
            if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE'].includes(el.tagName)) return true;

            // Skip user-generated content
            if (el.closest('[data-user-content]')) return true;

            // Skip proper names and dates (memorial specific)
            if (el.classList.contains('hero-name')) return true;
            if (el.classList.contains('hero-dates')) return true;
            if (el.classList.contains('memorial-name')) return true;
            if (el.classList.contains('memorial-dates')) return true;
            if (el.closest('.user-name')) return true;
            if (el.closest('.memory-author')) return true;

            // Skip elements that look like dates or emails
            const text = el.textContent.trim();
            if (this.looksLikeDate(text) || this.looksLikeEmail(text)) return true;

            return false;
        },

        looksLikeDate(text) {
            // Simple date pattern detection
            const datePatterns = [
                /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
                /^\d{4}-\d{2}-\d{2}$/,
                /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}$/i,
                /^\d{4}\s*[-–]\s*\d{4}$/,
                /^\d{4}$/
            ];
            return datePatterns.some(pattern => pattern.test(text.trim()));
        },

        looksLikeEmail(text) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
        },

        getDirectTextContent(el) {
            // Get only direct text content, not from child elements
            let text = '';
            for (const node of el.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                }
            }
            return text.trim();
        },

        setDirectTextContent(el, newText) {
            // Set only direct text content, preserving child elements
            for (const node of el.childNodes) {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    node.textContent = newText;
                    return;
                }
            }
            // If no text node found, and element has no children, set textContent
            if (el.children.length === 0) {
                el.textContent = newText;
            }
        },

        // =====================================================
        // RESTORE ORIGINAL TEXTS
        // =====================================================

        restoreOriginalTexts() {
            this.originalTexts.forEach((original, el) => {
                // Check if element still exists in DOM
                if (!document.body.contains(el)) {
                    this.originalTexts.delete(el);
                    return;
                }

                if (original.text) this.setDirectTextContent(el, original.text);
                if (original.placeholder) el.placeholder = original.placeholder;
                if (original.title) el.title = original.title;
                if (original.ariaLabel) el.setAttribute('aria-label', original.ariaLabel);
            });
        },

        // =====================================================
        // CSS PSEUDO-ELEMENT TRANSLATIONS
        // =====================================================

        updateCSSTranslations(lang) {
            const translations = this.CSS_TRANSLATIONS[lang] || this.CSS_TRANSLATIONS.en;
            const root = document.documentElement;

            Object.entries(translations).forEach(([property, value]) => {
                // Set CSS variable with quoted string for content property
                root.style.setProperty(property, `'${value}'`);
            });
        },

        // =====================================================
        // RTL SUPPORT
        // =====================================================

        updateDirection(lang) {
            const langConfig = this.LANGUAGES[lang];
            const html = document.documentElement;
            const body = document.body;

            if (langConfig && langConfig.dir === 'rtl') {
                html.setAttribute('dir', 'rtl');
                html.setAttribute('lang', lang);
                body.classList.add('rtl-active');
            } else {
                html.setAttribute('dir', 'ltr');
                html.setAttribute('lang', lang);
                body.classList.remove('rtl-active');
            }
        },

        // =====================================================
        // UI UPDATES
        // =====================================================

        updateUI() {
            const langConfig = this.LANGUAGES[this.currentLang];
            if (!langConfig) return;

            // Update current language code display
            const codeDisplay = document.querySelector('.current-lang-code');
            if (codeDisplay) {
                codeDisplay.textContent = langConfig.code;
            }

            // Update dropdown options - highlight active
            document.querySelectorAll('.language-option').forEach(option => {
                option.classList.remove('active');
                if (option.dataset.lang === this.currentLang) {
                    option.classList.add('active');
                }
            });

            // Update mobile select if present
            const mobileSelect = document.getElementById('mobileLangSelect');
            if (mobileSelect) {
                mobileSelect.value = this.currentLang;
            }

            // Update html lang attribute
            document.documentElement.setAttribute('lang', this.currentLang);
        },

        setLoadingState(loading) {
            const toggle = document.getElementById('languageToggle');
            if (toggle) {
                toggle.classList.toggle('loading', loading);
            }
        },

        // =====================================================
        // DYNAMIC CONTENT OBSERVER
        // =====================================================

        observeDynamicContent() {
            // Watch for dynamically added content and translate if needed
            const observer = new MutationObserver((mutations) => {
                if (this.currentLang === 'en' || this.isTranslating) return;

                let hasNewContent = false;
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE &&
                            !node.closest('[data-no-translate]') &&
                            !node.closest('.language-switcher')) {
                            hasNewContent = true;
                        }
                    });
                });

                if (hasNewContent) {
                    // Debounce translation of new content
                    clearTimeout(this.dynamicTranslateTimeout);
                    this.dynamicTranslateTimeout = setTimeout(() => {
                        this.translatePage(this.currentLang);
                    }, 500);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },

        // =====================================================
        // PUBLIC API
        // =====================================================

        getCurrentLanguage() {
            return this.currentLang;
        },

        getLanguageConfig(lang) {
            return this.LANGUAGES[lang] || null;
        },

        getSupportedLanguages() {
            return Object.keys(this.LANGUAGES);
        },

        // Translate a specific element (for dynamic content)
        async translateElement(element) {
            if (this.currentLang === 'en') return;
            if (this.shouldSkipElement(element)) return;

            const text = this.getDirectTextContent(element);
            if (text) {
                const translated = await this.translateText(text, this.currentLang);
                this.setDirectTextContent(element, translated);
            }
        }
    };

    // =====================================================
    // INITIALIZATION ON DOM READY
    // =====================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => FFLang.init());
    } else {
        FFLang.init();
    }

    // Expose globally for other modules
    window.FFLang = FFLang;
    window.ForeverFieldsLanguage = FFLang;

})();
