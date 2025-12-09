/**
 * Haptic Feedback Manager for Forever Fields
 * Provides subtle vibrations for user interactions on mobile devices
 */

class HapticFeedbackManager {
    constructor() {
        this.enabled = this.isSupported();
        this.userPreference = this.loadPreference();

        console.log('[Haptic] Feedback initialized:', this.enabled && this.userPreference);
    }

    /**
     * Check if Vibration API is supported
     */
    isSupported() {
        return 'vibrate' in navigator || 'mozVibrate' in navigator || 'webkitVibrate' in navigator;
    }

    /**
     * Load user preference from localStorage
     */
    loadPreference() {
        const pref = localStorage.getItem('haptic_feedback_enabled');
        return pref === null ? true : pref === 'true'; // Enabled by default
    }

    /**
     * Save user preference
     */
    savePreference(enabled) {
        this.userPreference = enabled;
        localStorage.setItem('haptic_feedback_enabled', enabled.toString());
    }

    /**
     * Vibrate with pattern
     */
    vibrate(pattern) {
        if (!this.enabled || !this.userPreference) {
            return false;
        }

        try {
            if (navigator.vibrate) {
                navigator.vibrate(pattern);
                return true;
            } else if (navigator.mozVibrate) {
                navigator.mozVibrate(pattern);
                return true;
            } else if (navigator.webkitVibrate) {
                navigator.webkitVibrate(pattern);
                return true;
            }
        } catch (error) {
            console.error('[Haptic] Vibration failed:', error);
        }

        return false;
    }

    /**
     * Light tap (button press)
     */
    tap() {
        return this.vibrate(10);
    }

    /**
     * Success feedback
     */
    success() {
        return this.vibrate([50, 30, 50]);
    }

    /**
     * Error feedback
     */
    error() {
        return this.vibrate([100, 50, 100]);
    }

    /**
     * Warning feedback
     */
    warning() {
        return this.vibrate([30, 20, 30, 20, 30]);
    }

    /**
     * Selection feedback (subtle)
     */
    select() {
        return this.vibrate(5);
    }

    /**
     * Heavy impact (important action)
     */
    impact() {
        return this.vibrate([25, 15, 50]);
    }

    /**
     * Candle lighting special pattern
     */
    candleLit() {
        // Gentle pulse like a candle flickering
        return this.vibrate([100, 50, 100, 50, 150]);
    }

    /**
     * Photo upload complete
     */
    uploadComplete() {
        return this.vibrate([50, 30, 100]);
    }

    /**
     * Undo action
     */
    undo() {
        return this.vibrate([30, 15, 30]);
    }

    /**
     * Delete action
     */
    delete() {
        return this.vibrate([25, 20, 50, 20, 75]);
    }

    /**
     * Enable haptic feedback
     */
    enable() {
        this.savePreference(true);
        this.tap(); // Give immediate feedback
    }

    /**
     * Disable haptic feedback
     */
    disable() {
        this.savePreference(false);
    }

    /**
     * Toggle haptic feedback
     */
    toggle() {
        if (this.userPreference) {
            this.disable();
            return false;
        } else {
            this.enable();
            return true;
        }
    }

    /**
     * Check if haptic feedback is currently enabled
     */
    isEnabled() {
        return this.enabled && this.userPreference;
    }
}

// Initialize global haptic feedback manager
window.haptic = new HapticFeedbackManager();

// Auto-attach to common elements
document.addEventListener('DOMContentLoaded', () => {
    // Add tap feedback to all buttons
    document.querySelectorAll('button, .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.haptic.tap();
        }, { passive: true });
    });

    // Add select feedback to form inputs
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('focus', () => {
            window.haptic.select();
        }, { passive: true });
    });

    // Add feedback to checkboxes and radios
    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
        input.addEventListener('change', () => {
            window.haptic.select();
        }, { passive: true });
    });

    console.log('[Haptic] Auto-attached to interactive elements');
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HapticFeedbackManager;
}

console.log('[Haptic] Feedback manager loaded');
