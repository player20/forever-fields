/**
 * Confirmation Modal Utility
 * Provides elegant confirmation dialogs for destructive actions
 * $0 cost - Pure JavaScript, no dependencies
 */

class ConfirmModal {
    constructor() {
        this.createModal();
    }

    createModal() {
        // Check if modal already exists
        if (document.getElementById('confirmModal')) {
            return;
        }

        // Create modal HTML
        const modalHTML = `
            <div id="confirmModal" class="confirm-modal-overlay" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="confirmModalTitle">
                <div class="confirm-modal-container">
                    <div class="confirm-modal-icon" id="confirmModalIcon">⚠️</div>
                    <h2 class="confirm-modal-title" id="confirmModalTitle">Are you sure?</h2>
                    <p class="confirm-modal-message" id="confirmModalMessage">This action cannot be undone.</p>
                    <div class="confirm-modal-actions">
                        <button type="button" class="confirm-modal-btn confirm-modal-cancel" id="confirmModalCancel">Cancel</button>
                        <button type="button" class="confirm-modal-btn confirm-modal-confirm" id="confirmModalConfirm">Confirm</button>
                    </div>
                </div>
            </div>
        `;

        // Insert into body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add styles if not already present
        this.addStyles();

        // Get elements
        this.modal = document.getElementById('confirmModal');
        this.confirmBtn = document.getElementById('confirmModalConfirm');
        this.cancelBtn = document.getElementById('confirmModalCancel');
        this.titleEl = document.getElementById('confirmModalTitle');
        this.messageEl = document.getElementById('confirmModalMessage');
        this.iconEl = document.getElementById('confirmModalIcon');

        // Bind event listeners
        this.cancelBtn.addEventListener('click', () => this.hide(false));
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide(false);
            }
        });

        // ESC key to cancel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.hide(false);
            }
        });
    }

    addStyles() {
        if (document.getElementById('confirmModalStyles')) {
            return;
        }

        const styles = `
            <style id="confirmModalStyles">
            .confirm-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .confirm-modal-container {
                background: white;
                border-radius: 16px;
                padding: 2rem;
                max-width: 420px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                text-align: center;
                animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes slideUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .confirm-modal-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }

            .confirm-modal-title {
                font-family: var(--font-serif, 'Playfair Display', Georgia, serif);
                font-size: 1.5rem;
                color: var(--gray-dark, #4a4a4a);
                margin-bottom: 0.75rem;
            }

            .confirm-modal-message {
                font-family: var(--font-sans, 'Inter', sans-serif);
                font-size: 1rem;
                color: var(--gray-body, #8d8d8d);
                line-height: 1.6;
                margin-bottom: 1.5rem;
            }

            .confirm-modal-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
            }

            .confirm-modal-btn {
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-family: var(--font-sans, 'Inter', sans-serif);
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
                min-width: 120px;
            }

            .confirm-modal-cancel {
                background: var(--cream, #fff8f0);
                color: var(--gray-dark, #4a4a4a);
                border: 1px solid var(--sage-light, #c5d9c1);
            }

            .confirm-modal-cancel:hover {
                background: white;
                border-color: var(--sage-primary, #a7c9a2);
            }

            .confirm-modal-cancel:focus {
                outline: 2px solid var(--sage-primary, #a7c9a2);
                outline-offset: 2px;
            }

            .confirm-modal-confirm {
                background: var(--error, #e57373);
                color: white;
            }

            .confirm-modal-confirm:hover {
                background: #d32f2f;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
            }

            .confirm-modal-confirm:focus {
                outline: 2px solid var(--error, #e57373);
                outline-offset: 2px;
            }

            .confirm-modal-confirm.safe {
                background: var(--sage-primary, #a7c9a2);
            }

            .confirm-modal-confirm.safe:hover {
                background: var(--sage-dark, #8bb085);
                box-shadow: 0 4px 12px rgba(167, 201, 162, 0.3);
            }

            @media (max-width: 480px) {
                .confirm-modal-container {
                    padding: 1.5rem;
                }

                .confirm-modal-actions {
                    flex-direction: column-reverse;
                }

                .confirm-modal-btn {
                    width: 100%;
                }
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Show confirmation dialog
     * @param {Object} options - Configuration options
     * @param {string} options.title - Dialog title
     * @param {string} options.message - Dialog message
     * @param {string} options.confirmText - Confirm button text (default: "Confirm")
     * @param {string} options.cancelText - Cancel button text (default: "Cancel")
     * @param {string} options.icon - Icon emoji (default: "⚠️")
     * @param {boolean} options.isDanger - Red button for dangerous actions (default: true)
     * @returns {Promise<boolean>} - Resolves to true if confirmed, false if canceled
     */
    show(options = {}) {
        const {
            title = 'Are you sure?',
            message = 'This action cannot be undone.',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            icon = '⚠️',
            isDanger = true
        } = options;

        this.titleEl.textContent = title;
        this.messageEl.textContent = message;
        this.confirmBtn.textContent = confirmText;
        this.cancelBtn.textContent = cancelText;
        this.iconEl.textContent = icon;

        // Style confirm button based on danger level
        if (isDanger) {
            this.confirmBtn.classList.remove('safe');
        } else {
            this.confirmBtn.classList.add('safe');
        }

        // Show modal
        this.modal.style.display = 'flex';
        this.modal.setAttribute('aria-hidden', 'false');

        // Focus cancel button (safer default)
        this.cancelBtn.focus();

        // Return a promise that resolves when user makes a choice
        return new Promise((resolve) => {
            this.resolvePromise = resolve;

            // Remove old listeners
            const newConfirmBtn = this.confirmBtn.cloneNode(true);
            this.confirmBtn.replaceWith(newConfirmBtn);
            this.confirmBtn = newConfirmBtn;

            // Add new listener
            this.confirmBtn.addEventListener('click', () => this.hide(true));
        });
    }

    hide(confirmed) {
        this.modal.style.display = 'none';
        this.modal.setAttribute('aria-hidden', 'true');

        if (this.resolvePromise) {
            this.resolvePromise(confirmed);
            this.resolvePromise = null;
        }
    }
}

// Create global instance
const confirmDialog = new ConfirmModal();

// Global helper function
window.confirm = function(message) {
    return confirmDialog.show({
        title: 'Confirm',
        message: message,
        confirmText: 'OK',
        cancelText: 'Cancel',
        icon: '❓',
        isDanger: false
    });
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfirmModal;
}
