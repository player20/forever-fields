/**
 * Forever Fields - Offline Sync
 * Handles offline detection and sync queue
 */

(function() {
    'use strict';

    const OfflineSync = {
        isOnline: navigator.onLine,
        isSyncing: false,
        listeners: [],

        init() {
            // Online/offline event listeners
            window.addEventListener('online', () => this.handleOnline());
            window.addEventListener('offline', () => this.handleOffline());

            // Initial status
            this.updateUI();

            // Try to sync on load if online
            if (this.isOnline) {
                this.sync();
            }
        },

        handleOnline() {
            this.isOnline = true;
            this.updateUI();
            this.notifyListeners('online');
            this.sync();
            console.log('[OfflineSync] Connection restored');
        },

        handleOffline() {
            this.isOnline = false;
            this.updateUI();
            this.notifyListeners('offline');
            console.log('[OfflineSync] Connection lost');
        },

        updateUI() {
            const offlineBanner = document.getElementById('offlineBanner');
            if (offlineBanner) {
                offlineBanner.style.display = this.isOnline ? 'none' : 'block';
            }

            // Update any online-only elements
            document.querySelectorAll('[data-online-only]').forEach(el => {
                el.style.opacity = this.isOnline ? '1' : '0.5';
                el.style.pointerEvents = this.isOnline ? 'auto' : 'none';
            });
        },

        // Subscribe to online/offline events
        subscribe(callback) {
            this.listeners.push(callback);
            return () => {
                this.listeners = this.listeners.filter(cb => cb !== callback);
            };
        },

        notifyListeners(status) {
            this.listeners.forEach(callback => callback(status));
        },

        // Queue an action for later sync
        async queueAction(action) {
            if (window.db) {
                await window.db.addToSyncQueue({
                    type: action.type,
                    endpoint: action.endpoint,
                    method: action.method || 'POST',
                    data: action.data,
                    retries: 0
                });
                console.log('[OfflineSync] Action queued:', action.type);
            }
        },

        // Process sync queue
        async sync() {
            if (!this.isOnline || this.isSyncing || !window.db) return;

            this.isSyncing = true;
            console.log('[OfflineSync] Starting sync...');

            try {
                const queue = await window.db.getSyncQueue();

                for (const action of queue) {
                    try {
                        const response = await fetch(action.endpoint, {
                            method: action.method,
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: action.data ? JSON.stringify(action.data) : undefined
                        });

                        if (response.ok) {
                            await window.db.delete('syncQueue', action.id);
                            console.log('[OfflineSync] Synced:', action.type);
                        } else if (response.status >= 400 && response.status < 500) {
                            // Client error - remove from queue
                            await window.db.delete('syncQueue', action.id);
                            console.warn('[OfflineSync] Action failed permanently:', action.type);
                        } else {
                            // Server error - retry later
                            action.retries++;
                            if (action.retries >= 3) {
                                await window.db.delete('syncQueue', action.id);
                                console.warn('[OfflineSync] Max retries reached:', action.type);
                            } else {
                                await window.db.put('syncQueue', action);
                            }
                        }
                    } catch (error) {
                        console.error('[OfflineSync] Sync error:', error);
                    }
                }

                console.log('[OfflineSync] Sync complete');
            } catch (error) {
                console.error('[OfflineSync] Failed to process queue:', error);
            } finally {
                this.isSyncing = false;
            }
        },

        // Wrap API call with offline support
        async fetch(endpoint, options = {}) {
            if (this.isOnline) {
                try {
                    return await fetch(endpoint, {
                        ...options,
                        credentials: 'include'
                    });
                } catch (error) {
                    // Network error - queue if mutating request
                    if (['POST', 'PUT', 'DELETE'].includes(options.method)) {
                        await this.queueAction({
                            type: 'api-request',
                            endpoint,
                            method: options.method,
                            data: options.body ? JSON.parse(options.body) : null
                        });
                    }
                    throw error;
                }
            } else {
                // Offline - queue mutating requests
                if (['POST', 'PUT', 'DELETE'].includes(options.method)) {
                    await this.queueAction({
                        type: 'api-request',
                        endpoint,
                        method: options.method,
                        data: options.body ? JSON.parse(options.body) : null
                    });
                    return { ok: true, queued: true };
                }
                throw new Error('No internet connection');
            }
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        OfflineSync.init();
    });

    window.OfflineSync = OfflineSync;
})();
