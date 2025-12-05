/**
 * Forever Fields - PWA Functionality
 * Handles PWA installation and push notifications
 */

(function() {
    'use strict';

    let deferredPrompt = null;
    let swRegistration = null;
    const api = window.ForeverFieldsAPI ? new window.ForeverFieldsAPI() : null;

    // ============================================
    // SERVICE WORKER REGISTRATION
    // ============================================

    /**
     * Register service worker
     */
    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('[PWA] Service workers are not supported');
            return;
        }

        try {
            swRegistration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/',
            });

            console.log('[PWA] Service worker registered:', swRegistration);

            // Check for updates every hour
            setInterval(() => {
                swRegistration.update();
            }, 60 * 60 * 1000);

            // Listen for service worker updates
            swRegistration.addEventListener('updatefound', () => {
                const newWorker = swRegistration.installing;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateAvailable();
                    }
                });
            });

            return swRegistration;
        } catch (error) {
            console.error('[PWA] Service worker registration failed:', error);
        }
    }

    /**
     * Show update available notification
     */
    function showUpdateAvailable() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'pwa-update-banner';
        updateBanner.innerHTML = `
            <div class="pwa-update-content">
                <span>🔄 A new version is available!</span>
                <button id="pwa-update-btn" class="pwa-update-btn">Update Now</button>
            </div>
        `;

        document.body.appendChild(updateBanner);

        document.getElementById('pwa-update-btn').addEventListener('click', () => {
            if (swRegistration && swRegistration.waiting) {
                swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
            }
        });
    }

    // ============================================
    // PWA INSTALL BANNER
    // ============================================

    /**
     * Show PWA install banner after 10 seconds
     */
    function initInstallBanner() {
        // Only show on mobile devices
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (!isMobile) {
            console.log('[PWA] Install banner disabled on desktop');
            return;
        }

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('[PWA] App is already installed');
            return;
        }

        // Check if user has dismissed the banner before
        const dismissed = localStorage.getItem('pwa_install_dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

            // Show again after 7 days
            if (daysSinceDismissed < 7) {
                console.log('[PWA] Install banner dismissed recently');
                return;
            }
        }

        // Show banner after 10 seconds
        setTimeout(() => {
            if (deferredPrompt) {
                showInstallBanner();
            }
        }, 10000);
    }

    /**
     * Show install banner
     */
    function showInstallBanner() {
        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.className = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="pwa-install-content">
                <button class="pwa-install-close" id="pwa-install-close" aria-label="Close">&times;</button>
                <div class="pwa-install-icon">🌿</div>
                <div class="pwa-install-text">
                    <h3>Install Forever Fields</h3>
                    <p>Get quick access and work offline</p>
                </div>
                <button class="pwa-install-button" id="pwa-install-button">Install</button>
            </div>
        `;

        document.body.appendChild(banner);

        // Show banner with animation
        setTimeout(() => {
            banner.classList.add('show');
        }, 100);

        // Install button
        document.getElementById('pwa-install-button').addEventListener('click', async () => {
            if (!deferredPrompt) {
                console.log('[PWA] No deferred prompt available');
                return;
            }

            // Show install prompt
            deferredPrompt.prompt();

            // Wait for user choice
            const choiceResult = await deferredPrompt.userChoice;

            console.log('[PWA] User choice:', choiceResult.outcome);

            if (choiceResult.outcome === 'accepted') {
                console.log('[PWA] User accepted install');
            } else {
                console.log('[PWA] User dismissed install');
                localStorage.setItem('pwa_install_dismissed', Date.now().toString());
            }

            // Clear deferred prompt
            deferredPrompt = null;

            // Hide banner
            hideInstallBanner();
        });

        // Close button
        document.getElementById('pwa-install-close').addEventListener('click', () => {
            hideInstallBanner();
            localStorage.setItem('pwa_install_dismissed', Date.now().toString());
        });
    }

    /**
     * Hide install banner
     */
    function hideInstallBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => {
                banner.remove();
            }, 300);
        }
    }

    // ============================================
    // PUSH NOTIFICATIONS
    // ============================================

    /**
     * Initialize push notifications
     */
    async function initPushNotifications() {
        if (!('Notification' in window)) {
            console.log('[PWA] Notifications not supported');
            return;
        }

        // Check current permission
        console.log('[PWA] Notification permission:', Notification.permission);

        // Auto-request permission is now handled by UI button
        // This is better UX than auto-requesting on page load
    }

    /**
     * Request notification permission and subscribe
     */
    async function subscribeToPushNotifications() {
        if (!('Notification' in window)) {
            throw new Error('Notifications not supported');
        }

        // Request permission
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            throw new Error('Notification permission denied');
        }

        // Get service worker registration
        if (!swRegistration) {
            swRegistration = await navigator.serviceWorker.ready;
        }

        // Get VAPID public key from server
        const response = await fetch('/api/push/vapid-public-key');
        const { publicKey } = await response.json();

        // Subscribe to push notifications
        const subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        console.log('[PWA] Push subscription:', subscription);

        // Send subscription to server
        const subscriptionData = {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
                auth: arrayBufferToBase64(subscription.getKey('auth')),
            },
        };

        // Save subscription to server (requires auth)
        if (api && api.getToken()) {
            await api.post('/api/push/subscribe', subscriptionData);
            console.log('[PWA] Subscription saved to server');
        } else {
            console.log('[PWA] Not authenticated, subscription not saved');
            // Store in localStorage for later syncing
            localStorage.setItem('pwa_pending_subscription', JSON.stringify(subscriptionData));
        }

        return subscription;
    }

    /**
     * Unsubscribe from push notifications
     */
    async function unsubscribeFromPushNotifications() {
        if (!swRegistration) {
            swRegistration = await navigator.serviceWorker.ready;
        }

        const subscription = await swRegistration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            console.log('[PWA] Unsubscribed from push');

            // Remove from server
            if (api && api.getToken()) {
                await api.delete('/api/push/unsubscribe', {
                    endpoint: subscription.endpoint,
                });
                console.log('[PWA] Subscription removed from server');
            }
        }
    }

    /**
     * Check if push notifications are enabled
     */
    async function isPushNotificationsEnabled() {
        if (!('Notification' in window)) {
            return false;
        }

        if (Notification.permission !== 'granted') {
            return false;
        }

        if (!swRegistration) {
            swRegistration = await navigator.serviceWorker.ready;
        }

        const subscription = await swRegistration.pushManager.getSubscription();
        return subscription !== null;
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Convert URL-safe base64 to Uint8Array
     */
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }

        return outputArray;
    }

    /**
     * Convert ArrayBuffer to base64
     */
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    /**
     * Listen for beforeinstallprompt event
     */
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('[PWA] beforeinstallprompt event fired');

        // Prevent the default mini-infobar
        e.preventDefault();

        // Store the event for later use
        deferredPrompt = e;

        // Initialize install banner
        initInstallBanner();
    });

    /**
     * Listen for appinstalled event
     */
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed successfully');
        deferredPrompt = null;

        // Hide install banner if showing
        hideInstallBanner();

        // Show success message
        if (typeof showToast === 'function') {
            showToast('✓', 'Forever Fields installed successfully!');
        }
    });

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize PWA functionality
     */
    async function init() {
        console.log('[PWA] Initializing...');

        // Register service worker
        await registerServiceWorker();

        // Initialize push notifications
        await initPushNotifications();

        console.log('[PWA] Initialization complete');
    }

    // Export functions for external use
    window.PWA = {
        registerServiceWorker,
        subscribeToPushNotifications,
        unsubscribeFromPushNotifications,
        isPushNotificationsEnabled,
        showInstallBanner,
        hideInstallBanner,
    };

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
