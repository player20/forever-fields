/**
 * Forever Fields - Modal System
 * Accessible confirmation modals and dialog system
 */

class ModalSystem {
    constructor() {
        this.activeModal = null;
        this.previousFocus = null;
        this.init();
    }

    init() {
        // Create modal container if it doesn't exist
        if (!document.getElementById('modal-overlay')) {
            this.createModalContainer();
        }

        // Add keyboard listener for Esc key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.closeModal();
            }
        });

        // Add styles
        this.addModalStyles();
    }

    createModalContainer() {
        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = 'modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.style.display = 'none';

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        });

        document.body.appendChild(overlay);
    }

    addModalStyles() {
        if (document.getElementById('modal-system-styles')) return;

        const style = document.createElement('style');
        style.id = 'modal-system-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: modalFadeIn 0.2s ease;
            }

            @keyframes modalFadeIn {
                from {
                    opacity: 0;
                    backdrop-filter: blur(0px);
                }
                to {
                    opacity: 1;
                    backdrop-filter: blur(4px);
                }
            }

            .modal-content {
                background: var(--warm-white, white);
                border-radius: 20px;
                max-width: 500px;
                width: 100%;
                padding: 2rem;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: modalSlideIn 0.3s ease;
                position: relative;
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .modal-header {
                margin-bottom: 1.5rem;
            }

            .modal-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
                display: block;
                text-align: center;
            }

            .modal-icon.warning {
                color: var(--error, #c62828);
            }

            .modal-icon.info {
                color: var(--sage-primary, #8FA883);
            }

            .modal-title {
                font-family: var(--font-serif, serif);
                font-size: 1.75rem;
                color: var(--gray-dark, #333);
                margin: 0 0 0.5rem 0;
                text-align: center;
            }

            .modal-message {
                color: var(--gray-body, #666);
                font-size: 1rem;
                line-height: 1.6;
                text-align: center;
                margin: 0;
            }

            .modal-actions {
                display: flex;
                gap: 1rem;
                margin-top: 2rem;
                justify-content: center;
            }

            .modal-actions button {
                min-width: 120px;
                padding: 0.875rem 1.5rem;
                border-radius: 12px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 2px solid transparent;
                min-height: 44px;
            }

            .modal-btn-cancel {
                background: var(--sage-pale, #f5f7f5);
                color: var(--gray-dark, #333);
                border-color: var(--sage-light, #d4dfd1);
            }

            .modal-btn-cancel:hover {
                background: var(--sage-light, #d4dfd1);
                transform: translateY(-2px);
            }

            .modal-btn-cancel:focus {
                outline: 3px solid var(--sage-primary, #8FA883);
                outline-offset: 3px;
            }

            .modal-btn-confirm {
                background: linear-gradient(135deg, var(--gold-primary, #b38f1f), var(--gold-dark, #8a6d17));
                color: white;
                border: none;
            }

            .modal-btn-confirm:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(179, 143, 31, 0.3);
            }

            .modal-btn-confirm:focus {
                outline: 3px solid var(--gold-dark, #8a6d17);
                outline-offset: 3px;
            }

            .modal-btn-danger {
                background: var(--error, #c62828);
                color: white;
                border: none;
            }

            .modal-btn-danger:hover {
                background: #b71c1c;
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(198, 40, 40, 0.3);
            }

            .modal-btn-danger:focus {
                outline: 3px solid var(--error, #c62828);
                outline-offset: 3px;
            }

            .modal-close {
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
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .modal-close:hover {
                background: var(--sage-pale, #f5f7f5);
                color: var(--error, #c62828);
            }

            .modal-close:focus {
                outline: 3px solid var(--sage-primary, #8FA883);
                outline-offset: 2px;
            }

            @media (max-width: 640px) {
                .modal-content {
                    padding: 1.5rem;
                }

                .modal-actions {
                    flex-direction: column;
                }

                .modal-actions button {
                    width: 100%;
                }
            }

            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .modal-overlay {
                    background: rgba(0, 0, 0, 0.8);
                }

                .modal-content {
                    background: #1a1a1a;
                    color: #e0e0e0;
                }

                .modal-title {
                    color: #f5f5f5;
                }

                .modal-message {
                    color: #b0b0b0;
                }

                .modal-btn-cancel {
                    background: #2a2a2a;
                    color: #e0e0e0;
                    border-color: #404040;
                }

                .modal-btn-cancel:hover {
                    background: #353535;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show confirmation modal
     * @param {Object} options - Modal configuration
     * @returns {Promise<boolean>} - Resolves true if confirmed, false if cancelled
     */
    confirm(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Are you sure?',
                message = 'This action cannot be undone.',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                type = 'warning', // 'warning' | 'info' | 'danger'
                icon = '⚠️',
                dangerMode = false,
            } = options;

            this.previousFocus = document.activeElement;

            const overlay = document.getElementById('modal-overlay');
            overlay.innerHTML = `
                <div class="modal-content" role="document" aria-labelledby="modal-title" aria-describedby="modal-message">
                    <button class="modal-close" aria-label="Close modal" type="button">✕</button>
                    <div class="modal-header">
                        <span class="modal-icon ${type}" aria-hidden="true">${icon}</span>
                        <h2 class="modal-title" id="modal-title">${this.escapeHTML(title)}</h2>
                        <p class="modal-message" id="modal-message">${this.escapeHTML(message)}</p>
                    </div>
                    <div class="modal-actions">
                        <button class="modal-btn-cancel" type="button" data-action="cancel">
                            ${this.escapeHTML(cancelText)}
                        </button>
                        <button class="modal-btn-${dangerMode ? 'danger' : 'confirm'}" type="button" data-action="confirm">
                            ${this.escapeHTML(confirmText)}
                        </button>
                    </div>
                </div>
            `;

            overlay.style.display = 'flex';
            this.activeModal = overlay;

            // Add event listeners
            const closeBtn = overlay.querySelector('.modal-close');
            const cancelBtn = overlay.querySelector('[data-action="cancel"]');
            const confirmBtn = overlay.querySelector('[data-action="confirm"]');

            const handleClose = (confirmed) => {
                this.closeModal();
                resolve(confirmed);
            };

            closeBtn.addEventListener('click', () => handleClose(false));
            cancelBtn.addEventListener('click', () => handleClose(false));
            confirmBtn.addEventListener('click', () => handleClose(true));

            // Focus the confirm button
            setTimeout(() => {
                confirmBtn.focus();
            }, 100);

            // Trap focus within modal
            this.trapFocus(overlay);
        });
    }

    /**
     * Show alert modal (information only, no cancel)
     */
    alert(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Notice',
                message = '',
                confirmText = 'OK',
                type = 'info',
                icon = 'ℹ️',
            } = options;

            this.previousFocus = document.activeElement;

            const overlay = document.getElementById('modal-overlay');
            overlay.innerHTML = `
                <div class="modal-content" role="document" aria-labelledby="modal-title" aria-describedby="modal-message">
                    <button class="modal-close" aria-label="Close modal" type="button">✕</button>
                    <div class="modal-header">
                        <span class="modal-icon ${type}" aria-hidden="true">${icon}</span>
                        <h2 class="modal-title" id="modal-title">${this.escapeHTML(title)}</h2>
                        <p class="modal-message" id="modal-message">${this.escapeHTML(message)}</p>
                    </div>
                    <div class="modal-actions">
                        <button class="modal-btn-confirm" type="button" data-action="confirm">
                            ${this.escapeHTML(confirmText)}
                        </button>
                    </div>
                </div>
            `;

            overlay.style.display = 'flex';
            this.activeModal = overlay;

            const closeBtn = overlay.querySelector('.modal-close');
            const confirmBtn = overlay.querySelector('[data-action="confirm"]');

            const handleClose = () => {
                this.closeModal();
                resolve(true);
            };

            closeBtn.addEventListener('click', handleClose);
            confirmBtn.addEventListener('click', handleClose);

            setTimeout(() => {
                confirmBtn.focus();
            }, 100);

            this.trapFocus(overlay);
        });
    }

    closeModal() {
        if (!this.activeModal) return;

        this.activeModal.style.display = 'none';
        this.activeModal.innerHTML = '';
        this.activeModal = null;

        // Restore focus to previous element
        if (this.previousFocus) {
            this.previousFocus.focus();
            this.previousFocus = null;
        }
    }

    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        container.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        });
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Initialize global modal system
window.modalSystem = new ModalSystem();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalSystem;
}
