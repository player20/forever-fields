/**
 * Forever Fields - Authenticated User UI
 * Updates navigation to show user menu when logged in
 */

(async function() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateAuthUI);
    } else {
        updateAuthUI();
    }

    async function updateAuthUI() {
        try {
            // Check if API client is available
            if (typeof ForeverFieldsAPI === 'undefined') {
                console.warn('[AuthUI] ForeverFieldsAPI not loaded');
                return;
            }

            const api = new ForeverFieldsAPI();
            const isAuthenticated = await api.isAuthenticated();

            if (isAuthenticated) {
                // Get user profile
                try {
                    const user = await api.getUserProfile();
                    updateNavForAuthenticatedUser(user);
                } catch (error) {
                    // If profile fetch fails, just update nav without user info
                    updateNavForAuthenticatedUser(null);
                }
            }
        } catch (error) {
            console.error('[AuthUI] Error checking auth:', error);
        }
    }

    function updateNavForAuthenticatedUser(user) {
        // Update desktop "Sign In" button to "Dashboard"
        const authButton = document.getElementById('authButton');
        if (authButton && authButton.textContent.includes('Sign In')) {
            authButton.textContent = 'Dashboard';
            authButton.href = '/dashboard/';
            authButton.classList.remove('btn-secondary');
            authButton.classList.add('btn-primary');
        }

        // Update mobile nav "Sign In" link
        const mobileSignIn = document.querySelector('.mobile-nav-links a[href="./login/"], .mobile-nav-links a[href="/login/"]');
        if (mobileSignIn && mobileSignIn.textContent.includes('Sign In')) {
            mobileSignIn.textContent = 'Dashboard';
            mobileSignIn.href = '/dashboard/';
        }

        // If there's a user info section, update it
        if (user) {
            updateUserInfo(user);
        }
    }

    function updateUserInfo(user) {
        // Check if there's a user info element to update
        const userInfoEl = document.getElementById('userInfo');
        if (userInfoEl) {
            const initials = getUserInitials(user.name || user.email);
            userInfoEl.innerHTML = `
                <div class="user-menu">
                    <button class="user-avatar" aria-label="User menu">
                        ${initials}
                    </button>
                    <div class="user-dropdown">
                        <div class="user-info">
                            <strong>${user.name || 'User'}</strong>
                            <small>${user.email}</small>
                        </div>
                        <hr>
                        <a href="/dashboard/">Dashboard</a>
                        <a href="/create/">Create Memorial</a>
                        <a href="/dashboard/?tab=settings">Settings</a>
                        <hr>
                        <a href="#" id="logoutLink">Logout</a>
                    </div>
                </div>
            `;

            // Add logout handler
            const logoutLink = document.getElementById('logoutLink');
            if (logoutLink) {
                logoutLink.addEventListener('click', async (e) => {
                    e.preventDefault();
                    if (confirm('Are you sure you want to sign out?')) {
                        const api = new ForeverFieldsAPI();
                        await api.logout();
                    }
                });
            }

            // Add dropdown toggle
            const avatarBtn = userInfoEl.querySelector('.user-avatar');
            const dropdown = userInfoEl.querySelector('.user-dropdown');
            if (avatarBtn && dropdown) {
                avatarBtn.addEventListener('click', () => {
                    dropdown.classList.toggle('show');
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!userInfoEl.contains(e.target)) {
                        dropdown.classList.remove('show');
                    }
                });
            }
        }
    }

    function getUserInitials(name) {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
})();
