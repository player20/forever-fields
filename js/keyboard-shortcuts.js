/**
 * Forever Fields - Keyboard Shortcuts
 * Global keyboard shortcuts for power users
 */

class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.helpVisible = false;
        this.init();
    }

    init() {
        // Register default shortcuts
        this.registerDefaultShortcuts();

        // Add global keyboard listener
        document.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        // Add help modal styles
        this.addHelpStyles();
    }

    registerDefaultShortcuts() {
        // Save (Ctrl+S / Cmd+S)
        this.register('ctrl+s', {
            description: 'Save current form',
            handler: (e) => {
                e.preventDefault();
                this.triggerSave();
            },
        });

        // Upload (Ctrl+U / Cmd+U)
        this.register('ctrl+u', {
            description: 'Open file upload',
            handler: (e) => {
                e.preventDefault();
                this.triggerUpload();
            },
        });

        // Close modal (Escape) - handled by modal system
        // Just document it here
        this.shortcuts.set('escape', {
            description: 'Close modal or dialog',
            handler: null, // Handled by modal system
        });

        // Help (Ctrl+/ or Cmd+/ or ?)
        this.register('ctrl+/', {
            description: 'Show keyboard shortcuts',
            handler: (e) => {
                e.preventDefault();
                this.toggleHelp();
            },
        });

        this.register('?', {
            description: 'Show keyboard shortcuts',
            handler: (e) => {
                // Only if not in an input field
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                e.preventDefault();
                this.toggleHelp();
            },
        });

        // Navigation shortcuts
        this.register('ctrl+home', {
            description: 'Go to homepage',
            handler: (e) => {
                e.preventDefault();
                window.location.href = '/';
            },
        });

        this.register('ctrl+d', {
            description: 'Go to dashboard',
            handler: (e) => {
                e.preventDefault();
                window.location.href = '/dashboard/';
            },
        });
    }

    /**
     * Register a new keyboard shortcut
     * @param {string} key - Key combination (e.g., 'ctrl+s', 'escape')
     * @param {Object} options - Shortcut configuration
     */
    register(key, options) {
        this.shortcuts.set(key.toLowerCase(), options);
    }

    /**
     * Handle keydown event
     */
    handleKeydown(e) {
        // Build key combination string
        const keys = [];
        if (e.ctrlKey || e.metaKey) keys.push('ctrl');
        if (e.altKey) keys.push('alt');
        if (e.shiftKey) keys.push('shift');

        // Add the actual key
        const key = e.key.toLowerCase();
        if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
            keys.push(key);
        }

        const combination = keys.join('+');

        // Check if shortcut exists
        const shortcut = this.shortcuts.get(combination);
        if (shortcut && shortcut.handler) {
            shortcut.handler(e);
        }
    }

    /**
     * Trigger save action
     */
    triggerSave() {
        // Check if there's a form on the page
        const form = document.querySelector('form[data-autosave]');
        if (form) {
            // Trigger autosave
            const autosaveEvent = new CustomEvent('trigger-autosave');
            form.dispatchEvent(autosaveEvent);

            // Show feedback
            if (window.undoSystem) {
                window.undoSystem.showSuccess('Saving...');
            }
        } else {
            console.log('No form to save');
        }
    }

    /**
     * Trigger upload action
     */
    triggerUpload() {
        // Look for file input or photo uploader
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.click();
        } else {
            console.log('No file input found');
        }
    }

    /**
     * Toggle keyboard shortcuts help
     */
    toggleHelp() {
        if (this.helpVisible) {
            this.hideHelp();
        } else {
            this.showHelp();
        }
    }

    /**
     * Show keyboard shortcuts help modal
     */
    showHelp() {
        if (this.helpVisible) return;

        const overlay = document.createElement('div');
        overlay.id = 'shortcuts-help-overlay';
        overlay.className = 'shortcuts-help-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'shortcuts-help-title');

        const shortcutsList = Array.from(this.shortcuts.entries())
            .filter(([_, shortcut]) => shortcut.description)
            .map(([key, shortcut]) => {
                const displayKey = this.formatKeyDisplay(key);
                return `
                    <div class="shortcut-item">
                        <kbd class="shortcut-key">${displayKey}</kbd>
                        <span class="shortcut-desc">${this.escapeHTML(shortcut.description)}</span>
                    </div>
                `;
            })
            .join('');

        overlay.innerHTML = `
            <div class="shortcuts-help-content">
                <button class="shortcuts-help-close" aria-label="Close help">✕</button>
                <h2 id="shortcuts-help-title">Keyboard Shortcuts</h2>
                <div class="shortcuts-list">
                    ${shortcutsList}
                </div>
                <p class="shortcuts-help-footer">
                    Press <kbd>Esc</kbd> or <kbd>?</kbd> to close this dialog
                </p>
            </div>
        `;

        document.body.appendChild(overlay);
        this.helpVisible = true;

        // Add close handlers
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideHelp();
            }
        });

        overlay.querySelector('.shortcuts-help-close').addEventListener('click', () => {
            this.hideHelp();
        });

        // Focus the close button
        setTimeout(() => {
            overlay.querySelector('.shortcuts-help-close').focus();
        }, 100);
    }

    /**
     * Hide keyboard shortcuts help
     */
    hideHelp() {
        const overlay = document.getElementById('shortcuts-help-overlay');
        if (overlay) {
            overlay.remove();
            this.helpVisible = false;
        }
    }

    /**
     * Format key combination for display
     */
    formatKeyDisplay(key) {
        return key
            .split('+')
            .map(k => {
                switch(k) {
                    case 'ctrl': return navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';
                    case 'alt': return navigator.platform.includes('Mac') ? '⌥' : 'Alt';
                    case 'shift': return '⇧';
                    case 'escape': return 'Esc';
                    case '/': return '/';
                    case 'home': return 'Home';
                    default: return k.toUpperCase();
                }
            })
            .join(' + ');
    }

    addHelpStyles() {
        if (document.getElementById('shortcuts-help-styles')) return;

        const style = document.createElement('style');
        style.id = 'shortcuts-help-styles';
        style.textContent = `
            .shortcuts-help-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: fadeIn 0.2s ease;
            }

            .shortcuts-help-content {
                background: var(--warm-white, white);
                border-radius: 20px;
                max-width: 600px;
                width: 100%;
                padding: 2rem;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.3s ease;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            }

            .shortcuts-help-content h2 {
                font-family: var(--font-serif, serif);
                font-size: 2rem;
                color: var(--gray-dark, #333);
                margin: 0 0 1.5rem 0;
                text-align: center;
            }

            .shortcuts-help-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                font-size: 1.5rem;
                color: var(--gray-light, #999);
                cursor: pointer;
                padding: 0.5rem;
                line-height: 1;
                border-radius: 8px;
                transition: all 0.2s ease;
                min-width: 44px;
                min-height: 44px;
            }

            .shortcuts-help-close:hover {
                background: var(--sage-pale, #f5f7f5);
                color: var(--error, #c62828);
            }

            .shortcuts-help-close:focus {
                outline: 3px solid var(--sage-primary, #8FA883);
                outline-offset: 2px;
            }

            .shortcuts-list {
                display: grid;
                gap: 1rem;
            }

            .shortcut-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.75rem 1rem;
                background: var(--sage-pale, #f5f7f5);
                border-radius: 12px;
            }

            .shortcut-key {
                background: white;
                border: 2px solid var(--sage-light, #d4dfd1);
                border-radius: 6px;
                padding: 0.5rem 0.75rem;
                font-family: 'Monaco', 'Courier New', monospace;
                font-size: 0.9rem;
                color: var(--gray-dark, #333);
                white-space: nowrap;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                min-width: 80px;
                text-align: center;
            }

            .shortcut-desc {
                color: var(--gray-body, #666);
                font-size: 0.95rem;
                flex: 1;
            }

            .shortcuts-help-footer {
                margin-top: 1.5rem;
                padding-top: 1.5rem;
                border-top: 1px solid var(--sage-light, #d4dfd1);
                text-align: center;
                color: var(--gray-light, #999);
                font-size: 0.875rem;
            }

            .shortcuts-help-footer kbd {
                background: white;
                border: 1px solid var(--sage-light, #d4dfd1);
                border-radius: 4px;
                padding: 0.25rem 0.5rem;
                font-family: 'Monaco', 'Courier New', monospace;
                font-size: 0.85rem;
            }

            @media (max-width: 640px) {
                .shortcuts-help-content {
                    padding: 1.5rem;
                }

                .shortcuts-help-content h2 {
                    font-size: 1.5rem;
                }

                .shortcut-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }

                .shortcut-key {
                    min-width: auto;
                }
            }

            /* Dark mode */
            @media (prefers-color-scheme: dark) {
                .shortcuts-help-content {
                    background: #1a1a1a;
                    color: #e0e0e0;
                }

                .shortcuts-help-content h2 {
                    color: #f5f5f5;
                }

                .shortcut-item {
                    background: #2a2a2a;
                }

                .shortcut-key {
                    background: #1a1a1a;
                    border-color: #404040;
                    color: #f5f5f5;
                }

                .shortcut-desc {
                    color: #b0b0b0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Initialize global keyboard shortcuts
window.keyboardShortcuts = new KeyboardShortcuts();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyboardShortcuts;
}
