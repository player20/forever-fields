/**
 * Forever Fields - Confirmation Modal
 * Reusable confirmation dialog component
 */

(function() {
    'use strict';

    class ConfirmModal {
        constructor() {
            this.modal = null;
            this.resolvePromise = null;
            this.createModal();
        }

        createModal() {
            this.modal = document.createElement('div');
            this.modal.className = 'confirm-modal-overlay';
            this.modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            this.modal.innerHTML = `
                <div class="confirm-modal" style="
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                ">
                    <h3 class="confirm-title" style="margin: 0 0 12px; color: #333; font-family: 'Playfair Display', serif;"></h3>
                    <p class="confirm-message" style="margin: 0 0 20px; color: #666;"></p>
                    <div class="confirm-actions" style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button class="confirm-cancel" style="
                            padding: 10px 20px;
                            border: 1px solid #ddd;
                            background: white;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Cancel</button>
                        <button class="confirm-ok" style="
                            padding: 10px 20px;
                            border: none;
                            background: #a7c9a2;
                            color: white;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Confirm</button>
                    </div>
                </div>
            `;

            document.body.appendChild(this.modal);

            // Event listeners
            this.modal.querySelector('.confirm-cancel').addEventListener('click', () => this.close(false));
            this.modal.querySelector('.confirm-ok').addEventListener('click', () => this.close(true));
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close(false);
            });
        }

        show(options = {}) {
            const {
                title = 'Confirm',
                message = 'Are you sure?',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                type = 'default'
            } = options;

            this.modal.querySelector('.confirm-title').textContent = title;
            this.modal.querySelector('.confirm-message').textContent = message;
            this.modal.querySelector('.confirm-ok').textContent = confirmText;
            this.modal.querySelector('.confirm-cancel').textContent = cancelText;

            // Style based on type
            const okBtn = this.modal.querySelector('.confirm-ok');
            if (type === 'danger') {
                okBtn.style.background = '#e74c3c';
            } else {
                okBtn.style.background = '#a7c9a2';
            }

            this.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            return new Promise((resolve) => {
                this.resolvePromise = resolve;
            });
        }

        close(result) {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
            if (this.resolvePromise) {
                this.resolvePromise(result);
                this.resolvePromise = null;
            }
        }
    }

    // Create singleton instance
    window.confirmModal = new ConfirmModal();

    // Convenience function
    window.showConfirm = (options) => window.confirmModal.show(options);
})();
