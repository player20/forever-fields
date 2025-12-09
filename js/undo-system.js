/**
 * Forever Fields - Undo System
 * 30-second soft-delete with undo functionality
 */

class UndoSystem {
    constructor() {
        this.undoQueue = [];
        this.undoTimeout = 30000; // 30 seconds
        this.init();
    }

    init() {
        this.addUndoStyles();
    }

    addUndoStyles() {
        if (document.getElementById('undo-system-styles')) return;

        const style = document.createElement('style');
        style.id = 'undo-system-styles';
        style.textContent = `
            .undo-toast-container {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 500px;
                width: calc(100% - 40px);
            }

            .undo-toast {
                background: #323232;
                color: white;
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                animation: undoSlideIn 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            @keyframes undoSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .undo-toast.removing {
                animation: undoSlideOut 0.3s ease;
            }

            @keyframes undoSlideOut {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(20px);
                }
            }

            .undo-toast-message {
                flex: 1;
                font-size: 0.95rem;
                line-height: 1.5;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .undo-toast-icon {
                font-size: 1.25rem;
            }

            .undo-toast-actions {
                display: flex;
                gap: 12px;
                align-items: center;
            }

            .undo-btn {
                background: var(--gold-primary, #b38f1f);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 44px;
                min-height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .undo-btn:hover {
                background: var(--gold-dark, #8a6d17);
                transform: scale(1.05);
            }

            .undo-btn:focus {
                outline: 3px solid white;
                outline-offset: 2px;
            }

            .undo-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 1.25rem;
                cursor: pointer;
                padding: 4px;
                line-height: 1;
                transition: color 0.2s ease;
                min-width: 32px;
                min-height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .undo-close:hover {
                color: white;
            }

            .undo-close:focus {
                outline: 2px solid rgba(255, 255, 255, 0.5);
                outline-offset: 2px;
                border-radius: 4px;
            }

            .undo-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: var(--gold-primary, #b38f1f);
                width: 100%;
                transform-origin: left;
                animation: undoProgress 30s linear;
            }

            @keyframes undoProgress {
                from {
                    transform: scaleX(1);
                }
                to {
                    transform: scaleX(0);
                }
            }

            @media (max-width: 640px) {
                .undo-toast-container {
                    bottom: 10px;
                }

                .undo-toast {
                    padding: 12px 16px;
                }

                .undo-toast-message {
                    font-size: 0.875rem;
                }

                .undo-btn {
                    padding: 6px 12px;
                    font-size: 0.85rem;
                }
            }

            /* Dark mode already dark, no changes needed */
        `;
        document.head.appendChild(style);
    }

    /**
     * Create undo toast container if it doesn't exist
     */
    getToastContainer() {
        let container = document.getElementById('undo-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'undo-toast-container';
            container.className = 'undo-toast-container';
            container.setAttribute('role', 'status');
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Show undo toast for a deletion action
     * @param {Object} options - Undo configuration
     * @returns {Promise} - Resolves when action is committed or undone
     */
    showUndo(options = {}) {
        return new Promise((resolve, reject) => {
            const {
                message = 'Item deleted',
                icon = '🗑️',
                onUndo = null,
                onCommit = null,
                timeout = this.undoTimeout,
            } = options;

            const undoId = `undo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const container = this.getToastContainer();

            // Create toast
            const toast = document.createElement('div');
            toast.id = undoId;
            toast.className = 'undo-toast';
            toast.setAttribute('role', 'alert');
            toast.innerHTML = `
                <div class="undo-toast-message">
                    <span class="undo-toast-icon" aria-hidden="true">${icon}</span>
                    <span>${this.escapeHTML(message)}</span>
                </div>
                <div class="undo-toast-actions">
                    <button class="undo-btn" data-action="undo" aria-label="Undo deletion">
                        Undo
                    </button>
                    <button class="undo-close" data-action="close" aria-label="Dismiss">
                        ✕
                    </button>
                </div>
                <div class="undo-progress" aria-hidden="true"></div>
            `;

            container.appendChild(toast);

            // Track undo item
            const undoItem = {
                id: undoId,
                toast,
                timeout: null,
                onUndo,
                onCommit,
            };

            this.undoQueue.push(undoItem);

            // Add event listeners
            const undoBtn = toast.querySelector('[data-action="undo"]');
            const closeBtn = toast.querySelector('[data-action="close"]');

            undoBtn.addEventListener('click', () => {
                this.executeUndo(undoId);
                resolve({ undone: true });
            });

            closeBtn.addEventListener('click', () => {
                this.commitAction(undoId);
                resolve({ undone: false });
            });

            // Set timeout to commit action
            undoItem.timeout = setTimeout(() => {
                this.commitAction(undoId);
                resolve({ undone: false });
            }, timeout);
        });
    }

    /**
     * Execute undo action
     */
    async executeUndo(undoId) {
        const undoItem = this.undoQueue.find(item => item.id === undoId);
        if (!undoItem) return;

        // Clear timeout
        if (undoItem.timeout) {
            clearTimeout(undoItem.timeout);
        }

        // Execute undo callback
        if (undoItem.onUndo) {
            try {
                await undoItem.onUndo();
            } catch (error) {
                console.error('Undo error:', error);
                this.showError('Failed to undo action');
            }
        }

        // Remove toast
        this.removeToast(undoId);
    }

    /**
     * Commit the deletion action (can't be undone after this)
     */
    async commitAction(undoId) {
        const undoItem = this.undoQueue.find(item => item.id === undoId);
        if (!undoItem) return;

        // Clear timeout
        if (undoItem.timeout) {
            clearTimeout(undoItem.timeout);
        }

        // Execute commit callback
        if (undoItem.onCommit) {
            try {
                await undoItem.onCommit();
            } catch (error) {
                console.error('Commit error:', error);
            }
        }

        // Remove toast
        this.removeToast(undoId);
    }

    /**
     * Remove toast from UI
     */
    removeToast(undoId) {
        const undoItem = this.undoQueue.find(item => item.id === undoId);
        if (!undoItem) return;

        // Add removing animation
        undoItem.toast.classList.add('removing');

        setTimeout(() => {
            undoItem.toast.remove();
            this.undoQueue = this.undoQueue.filter(item => item.id !== undoId);

            // Clean up container if empty
            const container = document.getElementById('undo-toast-container');
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }

    /**
     * Show error toast
     */
    showError(message) {
        const container = this.getToastContainer();
        const toast = document.createElement('div');
        toast.className = 'undo-toast';
        toast.style.background = 'var(--error, #c62828)';
        toast.innerHTML = `
            <div class="undo-toast-message">
                <span class="undo-toast-icon" aria-hidden="true">⚠️</span>
                <span>${this.escapeHTML(message)}</span>
            </div>
            <button class="undo-close" aria-label="Dismiss">✕</button>
        `;

        container.appendChild(toast);

        toast.querySelector('.undo-close').addEventListener('click', () => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        });

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    /**
     * Show success toast
     */
    showSuccess(message) {
        const container = this.getToastContainer();
        const toast = document.createElement('div');
        toast.className = 'undo-toast';
        toast.style.background = 'var(--success, #2e7d32)';
        toast.innerHTML = `
            <div class="undo-toast-message">
                <span class="undo-toast-icon" aria-hidden="true">✓</span>
                <span>${this.escapeHTML(message)}</span>
            </div>
            <button class="undo-close" aria-label="Dismiss">✕</button>
        `;

        container.appendChild(toast);

        toast.querySelector('.undo-close').addEventListener('click', () => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        });

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Initialize global undo system
window.undoSystem = new UndoSystem();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UndoSystem;
}
