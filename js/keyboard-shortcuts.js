/**
 * Forever Fields - Keyboard Shortcuts
 * Global keyboard navigation and shortcuts
 */

(function() {
    'use strict';

    const KeyboardShortcuts = {
        shortcuts: new Map(),
        enabled: true,

        // Register a shortcut
        register(keys, callback, description = '') {
            const normalizedKeys = this.normalizeKeys(keys);
            this.shortcuts.set(normalizedKeys, { callback, description });
        },

        // Unregister a shortcut
        unregister(keys) {
            const normalizedKeys = this.normalizeKeys(keys);
            this.shortcuts.delete(normalizedKeys);
        },

        // Normalize key combination string
        normalizeKeys(keys) {
            return keys.toLowerCase()
                .replace(/\s+/g, '')
                .split('+')
                .sort()
                .join('+');
        },

        // Get active key combination from event
        getKeysFromEvent(e) {
            const keys = [];
            if (e.ctrlKey) keys.push('ctrl');
            if (e.altKey) keys.push('alt');
            if (e.shiftKey) keys.push('shift');
            if (e.metaKey) keys.push('meta');

            const key = e.key.toLowerCase();
            if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
                keys.push(key);
            }

            return keys.sort().join('+');
        },

        // Handle keyboard event
        handleKeydown(e) {
            if (!this.enabled) return;

            // Don't trigger in input fields unless specifically allowed
            const target = e.target;
            const isInputField = target.tagName === 'INPUT' ||
                               target.tagName === 'TEXTAREA' ||
                               target.isContentEditable;

            const keys = this.getKeysFromEvent(e);
            const shortcut = this.shortcuts.get(keys);

            if (shortcut) {
                // Allow some shortcuts even in inputs
                const allowInInput = keys.includes('ctrl') || keys.includes('meta');

                if (!isInputField || allowInInput) {
                    e.preventDefault();
                    shortcut.callback(e);
                }
            }
        },

        // Get all registered shortcuts
        getAll() {
            const result = [];
            this.shortcuts.forEach((value, keys) => {
                result.push({
                    keys: keys.split('+').join(' + ').toUpperCase(),
                    description: value.description
                });
            });
            return result;
        },

        // Enable/disable shortcuts
        setEnabled(enabled) {
            this.enabled = enabled;
        },

        // Initialize
        init() {
            document.addEventListener('keydown', (e) => this.handleKeydown(e));

            // Register default shortcuts
            this.register('ctrl+/', () => this.showHelp(), 'Show keyboard shortcuts');
            this.register('escape', () => {
                // Close any open modal
                if (window.modalSystem) {
                    window.modalSystem.closeTopModal();
                }
            }, 'Close modal');
        },

        // Show shortcuts help modal
        showHelp() {
            const shortcuts = this.getAll();
            const content = shortcuts.map(s =>
                `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <kbd style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${s.keys}</kbd>
                    <span>${s.description}</span>
                </div>`
            ).join('');

            if (window.modalSystem) {
                const modal = window.modalSystem.create({
                    id: 'keyboard-shortcuts-modal',
                    title: 'Keyboard Shortcuts',
                    content: `<div style="max-height: 400px; overflow-y: auto;">${content}</div>`,
                    size: 'small'
                });
                window.modalSystem.open('keyboard-shortcuts-modal');
            }
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        KeyboardShortcuts.init();
    });

    window.KeyboardShortcuts = KeyboardShortcuts;
})();
