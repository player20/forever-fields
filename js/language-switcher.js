/**
 * Forever Fields - Language Switcher
 * Internationalization support
 */

(function() {
    'use strict';

    const LanguageSwitcher = {
        currentLanguage: 'en',
        supportedLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt'],
        translations: {},

        async init() {
            // Get saved language or detect from browser
            this.currentLanguage = await this.getSavedLanguage() ||
                                   this.detectBrowserLanguage() ||
                                   'en';

            // Load translations
            await this.loadTranslations(this.currentLanguage);

            // Setup switcher UI
            this.setupSwitcher();

            // Apply translations
            this.applyTranslations();
        },

        async getSavedLanguage() {
            if (window.db) {
                return await window.db.getPreference('language');
            }
            return localStorage.getItem('ff-language');
        },

        async saveLanguage(lang) {
            if (window.db) {
                await window.db.setPreference('language', lang);
            }
            localStorage.setItem('ff-language', lang);
        },

        detectBrowserLanguage() {
            const browserLang = navigator.language.split('-')[0];
            return this.supportedLanguages.includes(browserLang) ? browserLang : null;
        },

        async loadTranslations(lang) {
            try {
                // Try to fetch translations file
                const response = await fetch(`/translations/${lang}.json`);
                if (response.ok) {
                    this.translations = await response.json();
                } else {
                    // Fallback to English
                    this.translations = this.getDefaultTranslations();
                }
            } catch (error) {
                console.log('[i18n] Using default translations');
                this.translations = this.getDefaultTranslations();
            }
        },

        getDefaultTranslations() {
            return {
                'nav.home': 'Home',
                'nav.create': 'Create Memorial',
                'nav.login': 'Sign In',
                'nav.dashboard': 'My Memorials',
                'hero.title': 'Honor Their Memory',
                'hero.subtitle': 'Create a beautiful, lasting digital memorial',
                'button.getStarted': 'Get Started',
                'button.learnMore': 'Learn More',
                'footer.copyright': '© 2025 Forever Fields. All rights reserved.',
                'offline.message': 'You are currently offline',
                'error.generic': 'Something went wrong. Please try again.'
            };
        },

        t(key, params = {}) {
            let text = this.translations[key] || key;

            // Replace parameters
            Object.keys(params).forEach(param => {
                text = text.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
            });

            return text;
        },

        applyTranslations() {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.dataset.i18n;
                el.textContent = this.t(key);
            });

            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.dataset.i18nPlaceholder;
                el.placeholder = this.t(key);
            });

            document.querySelectorAll('[data-i18n-title]').forEach(el => {
                const key = el.dataset.i18nTitle;
                el.title = this.t(key);
            });

            // Update lang attribute
            document.documentElement.lang = this.currentLanguage;
        },

        setupSwitcher() {
            const switchers = document.querySelectorAll('[data-language-switcher]');

            switchers.forEach(switcher => {
                // Create dropdown if it's a select
                if (switcher.tagName === 'SELECT') {
                    switcher.innerHTML = this.supportedLanguages.map(lang =>
                        `<option value="${lang}" ${lang === this.currentLanguage ? 'selected' : ''}>
                            ${this.getLanguageName(lang)}
                        </option>`
                    ).join('');

                    switcher.addEventListener('change', (e) => {
                        this.setLanguage(e.target.value);
                    });
                }
            });
        },

        getLanguageName(code) {
            const names = {
                'en': 'English',
                'es': 'Español',
                'fr': 'Français',
                'de': 'Deutsch',
                'zh': '中文',
                'ja': '日本語',
                'ko': '한국어',
                'pt': 'Português'
            };
            return names[code] || code;
        },

        async setLanguage(lang) {
            if (!this.supportedLanguages.includes(lang)) return;

            this.currentLanguage = lang;
            await this.saveLanguage(lang);
            await this.loadTranslations(lang);
            this.applyTranslations();

            // Dispatch event
            document.dispatchEvent(new CustomEvent('language:changed', {
                detail: { language: lang }
            }));
        },

        getLanguage() {
            return this.currentLanguage;
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        LanguageSwitcher.init();
    });

    // Global translate function
    window.t = (key, params) => LanguageSwitcher.t(key, params);
    window.LanguageSwitcher = LanguageSwitcher;
})();
