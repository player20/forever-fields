/**
 * Forever Fields - Auth UI
 * Handles authentication state in the navigation
 */

(function() {
    'use strict';

    const AuthUI = {
        user: null,
        api: null,

        async init() {
            this.api = window.api || new ForeverFieldsAPI();
            await this.checkAuth();
            this.setupLogoutHandlers();
        },

        async checkAuth() {
            try {
                const response = await fetch(ApiConfig.getApiEndpoint('/api/user/me'), {
                    credentials: 'include'
                });

                if (response.ok) {
                    this.user = await response.json();
                    this.updateUI(true);
                } else {
                    this.user = null;
                    this.updateUI(false);
                }
            } catch (error) {
                console.log('[AuthUI] Not authenticated');
                this.user = null;
                this.updateUI(false);
            }
        },

        updateUI(isAuthenticated) {
            // Update navigation
            const authLinks = document.querySelectorAll('[data-auth-link]');
            const guestLinks = document.querySelectorAll('[data-guest-link]');
            const userNameEls = document.querySelectorAll('[data-user-name]');
            const userAvatarEls = document.querySelectorAll('[data-user-avatar]');

            authLinks.forEach(el => {
                el.style.display = isAuthenticated ? '' : 'none';
            });

            guestLinks.forEach(el => {
                el.style.display = isAuthenticated ? 'none' : '';
            });

            if (isAuthenticated && this.user) {
                userNameEls.forEach(el => {
                    el.textContent = this.user.name || this.user.email?.split('@')[0] || 'User';
                });

                userAvatarEls.forEach(el => {
                    if (this.user.avatarUrl) {
                        el.src = this.user.avatarUrl;
                        el.style.display = '';
                    } else {
                        // Show initial
                        const initial = (this.user.name || this.user.email || 'U')[0].toUpperCase();
                        el.style.display = 'none';
                        const parent = el.parentElement;
                        if (!parent.querySelector('.avatar-initial')) {
                            const initialEl = document.createElement('span');
                            initialEl.className = 'avatar-initial';
                            initialEl.textContent = initial;
                            initialEl.style.cssText = `
                                display: inline-flex;
                                width: 32px;
                                height: 32px;
                                border-radius: 50%;
                                background: var(--sage-primary, #a7c9a2);
                                color: white;
                                align-items: center;
                                justify-content: center;
                                font-weight: 600;
                            `;
                            parent.appendChild(initialEl);
                        }
                    }
                });
            }

            // Dispatch event
            document.dispatchEvent(new CustomEvent('auth:changed', {
                detail: { isAuthenticated, user: this.user }
            }));
        },

        setupLogoutHandlers() {
            document.querySelectorAll('[data-logout]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await this.logout();
                });
            });
        },

        async logout() {
            try {
                await fetch(ApiConfig.getApiEndpoint('/api/auth/logout'), {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (error) {
                console.error('[AuthUI] Logout error:', error);
            }

            this.user = null;
            this.updateUI(false);

            // Redirect to home
            window.location.href = '/';
        },

        getUser() {
            return this.user;
        },

        isAuthenticated() {
            return this.user !== null;
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        AuthUI.init();
    });

    window.AuthUI = AuthUI;
})();
