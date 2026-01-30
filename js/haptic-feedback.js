/**
 * Forever Fields - Haptic Feedback
 * Tactile feedback for mobile interactions
 */

(function() {
    'use strict';

    const HapticFeedback = {
        isSupported: 'vibrate' in navigator,

        // Light tap feedback
        light() {
            if (this.isSupported) {
                navigator.vibrate(10);
            }
        },

        // Medium feedback for selections
        medium() {
            if (this.isSupported) {
                navigator.vibrate(25);
            }
        },

        // Strong feedback for important actions
        heavy() {
            if (this.isSupported) {
                navigator.vibrate(50);
            }
        },

        // Success pattern
        success() {
            if (this.isSupported) {
                navigator.vibrate([10, 50, 10]);
            }
        },

        // Error/warning pattern
        error() {
            if (this.isSupported) {
                navigator.vibrate([50, 100, 50]);
            }
        },

        // Custom pattern
        pattern(pattern) {
            if (this.isSupported && Array.isArray(pattern)) {
                navigator.vibrate(pattern);
            }
        },

        // Initialize auto-haptics for buttons
        init() {
            document.addEventListener('click', (e) => {
                const target = e.target.closest('button, .btn, [role="button"]');
                if (target && !target.disabled) {
                    this.light();
                }
            });

            // Haptics on toggle switches
            document.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox' || e.target.type === 'radio') {
                    this.medium();
                }
            });
        }
    };

    // Auto-init on mobile
    document.addEventListener('DOMContentLoaded', () => {
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            HapticFeedback.init();
        }
    });

    window.HapticFeedback = HapticFeedback;
})();
