/**
 * Forever Fields - PWA Functionality
 * Service worker registration and install prompts
 */

(function() {
    'use strict';

    const PWA = {
        deferredPrompt: null,
        isInstalled: false,

        async init() {
            // Check if already installed
            this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                              window.navigator.standalone === true;

            // Register service worker
            await this.registerServiceWorker();

            // Handle install prompt
            this.setupInstallPrompt();

            // Update UI based on install state
            this.updateUI();
        },

        async registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('/service-worker.js', {
                        scope: '/'
                    });

                    console.log('[PWA] Service Worker registered:', registration.scope);

                    // Handle updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateNotification();
                            }
                        });
                    });

                    return registration;
                } catch (error) {
                    console.error('[PWA] Service Worker registration failed:', error);
                }
            }
        },

        setupInstallPrompt() {
            window.addEventListener('beforeinstallprompt', (e) => {
                // Prevent Chrome 67+ from auto-showing prompt
                e.preventDefault();
                this.deferredPrompt = e;
                this.showInstallButton();
            });

            window.addEventListener('appinstalled', () => {
                this.isInstalled = true;
                this.deferredPrompt = null;
                this.hideInstallButton();
                console.log('[PWA] App installed');
            });
        },

        async showInstallPrompt() {
            if (!this.deferredPrompt) return;

            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;

            console.log('[PWA] Install prompt outcome:', outcome);
            this.deferredPrompt = null;

            if (outcome === 'accepted') {
                this.hideInstallButton();
            }
        },

        showInstallButton() {
            const installBtn = document.getElementById('installAppBtn');
            if (installBtn) {
                installBtn.style.display = 'block';
                installBtn.addEventListener('click', () => this.showInstallPrompt());
            }

            // Also show in-page prompts
            document.querySelectorAll('[data-pwa-install]').forEach(el => {
                el.style.display = 'block';
                el.addEventListener('click', () => this.showInstallPrompt());
            });
        },

        hideInstallButton() {
            const installBtn = document.getElementById('installAppBtn');
            if (installBtn) {
                installBtn.style.display = 'none';
            }

            document.querySelectorAll('[data-pwa-install]').forEach(el => {
                el.style.display = 'none';
            });
        },

        showUpdateNotification() {
            const notification = document.createElement('div');
            notification.className = 'pwa-update-notification';
            notification.innerHTML = `
                <p>A new version is available!</p>
                <button onclick="window.location.reload()">Update Now</button>
            `;
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #333;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 16px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(notification);
        },

        updateUI() {
            // Hide install prompts if already installed
            if (this.isInstalled) {
                this.hideInstallButton();
            }

            // Add installed class to body
            if (this.isInstalled) {
                document.body.classList.add('pwa-installed');
            }
        },

        // Request push notification permission
        async requestNotificationPermission() {
            if (!('Notification' in window)) {
                console.log('[PWA] Notifications not supported');
                return false;
            }

            if (Notification.permission === 'granted') {
                return true;
            }

            if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                return permission === 'granted';
            }

            return false;
        },

        // Subscribe to push notifications
        async subscribeToPush() {
            const hasPermission = await this.requestNotificationPermission();
            if (!hasPermission) return null;

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    document.querySelector('meta[name="vapid-public-key"]')?.content
                )
            });

            return subscription;
        },

        urlBase64ToUint8Array(base64String) {
            if (!base64String) return null;
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        PWA.init();
    });

    window.PWA = PWA;
})();
