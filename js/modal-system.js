/**
 * Forever Fields - Modal System
 * Generic modal management with accessibility support
 */

(function() {
    'use strict';

    class ModalSystem {
        constructor() {
            this.activeModals = [];
            this.focusTrap = null;
            this.previousFocus = null;
            this.init();
        }

        init() {
            // Handle escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.activeModals.length > 0) {
                    this.closeTopModal();
                }
            });

            // Auto-init modals with data-modal attribute
            document.addEventListener('DOMContentLoaded', () => {
                // Modal triggers
                document.querySelectorAll('[data-modal-open]').forEach(trigger => {
                    trigger.addEventListener('click', () => {
                        const modalId = trigger.dataset.modalOpen;
                        this.open(modalId);
                    });
                });

                // Modal close buttons
                document.querySelectorAll('[data-modal-close]').forEach(closeBtn => {
                    closeBtn.addEventListener('click', () => {
                        const modal = closeBtn.closest('.modal');
                        if (modal) this.close(modal.id);
                    });
                });
            });
        }

        open(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) {
                console.error(`Modal not found: ${modalId}`);
                return;
            }

            // Store current focus
            this.previousFocus = document.activeElement;

            // Show modal
            modal.classList.add('modal-open');
            modal.setAttribute('aria-hidden', 'false');
            modal.style.display = 'flex';

            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Focus first focusable element
            const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable.length) {
                focusable[0].focus();
            }

            // Setup focus trap
            this.setupFocusTrap(modal);

            this.activeModals.push(modalId);

            // Dispatch event
            modal.dispatchEvent(new CustomEvent('modal:open', { detail: { modalId } }));
        }

        close(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;

            modal.classList.remove('modal-open');
            modal.setAttribute('aria-hidden', 'true');
            modal.style.display = 'none';

            // Remove from active modals
            const index = this.activeModals.indexOf(modalId);
            if (index > -1) {
                this.activeModals.splice(index, 1);
            }

            // Restore body scroll if no more modals
            if (this.activeModals.length === 0) {
                document.body.style.overflow = '';
            }

            // Restore focus
            if (this.previousFocus) {
                this.previousFocus.focus();
            }

            // Dispatch event
            modal.dispatchEvent(new CustomEvent('modal:close', { detail: { modalId } }));
        }

        closeTopModal() {
            if (this.activeModals.length > 0) {
                this.close(this.activeModals[this.activeModals.length - 1]);
            }
        }

        closeAll() {
            [...this.activeModals].forEach(modalId => this.close(modalId));
        }

        setupFocusTrap(modal) {
            const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstFocusable = focusable[0];
            const lastFocusable = focusable[focusable.length - 1];

            modal.addEventListener('keydown', (e) => {
                if (e.key !== 'Tab') return;

                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            });
        }

        // Create modal dynamically
        create(options = {}) {
            const {
                id = 'modal-' + Date.now(),
                title = '',
                content = '',
                footer = '',
                size = 'medium',
                closable = true
            } = options;

            const modal = document.createElement('div');
            modal.id = id;
            modal.className = `modal modal-${size}`;
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-hidden', 'true');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;

            modal.innerHTML = `
                <div class="modal-content" style="
                    background: white;
                    border-radius: 12px;
                    max-width: ${size === 'small' ? '400px' : size === 'large' ? '800px' : '600px'};
                    width: 90%;
                    max-height: 90vh;
                    overflow: auto;
                ">
                    ${title ? `<div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; font-family: 'Playfair Display', serif;">${title}</h2>
                        ${closable ? '<button class="modal-close" data-modal-close aria-label="Close" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>' : ''}
                    </div>` : ''}
                    <div class="modal-body" style="padding: 20px;">
                        ${content}
                    </div>
                    ${footer ? `<div class="modal-footer" style="padding: 20px; border-top: 1px solid #eee;">${footer}</div>` : ''}
                </div>
            `;

            // Click outside to close
            if (closable) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) this.close(id);
                });

                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => this.close(id));
                }
            }

            document.body.appendChild(modal);
            return modal;
        }
    }

    // Create singleton
    window.modalSystem = new ModalSystem();
})();
