/**
 * Offline Sync Manager for Forever Fields
 * Handles synchronization between IndexedDB and server
 */

class OfflineSyncManager {
    constructor() {
        this.syncInProgress = false;
        this.uploadInProgress = false;
        this.syncInterval = null;
        this.isOnline = navigator.onLine;

        this.init();
    }

    init() {
        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Start periodic sync if online
        if (this.isOnline) {
            this.startPeriodicSync();
        }

        console.log('[OfflineSync] Manager initialized');
    }

    /**
     * Handle coming back online
     */
    async handleOnline() {
        console.log('[OfflineSync] Network connection restored');
        this.isOnline = true;

        // Show notification
        if (window.undoSystem) {
            window.undoSystem.showSuccess('Back online - syncing data...');
        }

        // Start syncing
        await this.syncAllData();
        this.startPeriodicSync();
    }

    /**
     * Handle going offline
     */
    handleOffline() {
        console.log('[OfflineSync] Network connection lost');
        this.isOnline = false;

        // Stop periodic sync
        this.stopPeriodicSync();

        // Show notification
        if (window.undoSystem) {
            window.undoSystem.showError('You are offline - changes will be saved locally');
        }
    }

    /**
     * Start periodic background sync (every 30 seconds)
     */
    startPeriodicSync() {
        if (this.syncInterval) return;

        this.syncInterval = setInterval(() => {
            if (this.isOnline && !this.syncInProgress) {
                this.syncAllData();
            }
        }, 30000); // 30 seconds

        console.log('[OfflineSync] Periodic sync started');
    }

    /**
     * Stop periodic sync
     */
    stopPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('[OfflineSync] Periodic sync stopped');
        }
    }

    /**
     * Sync all data with server
     */
    async syncAllData() {
        if (this.syncInProgress || !this.isOnline) return;

        this.syncInProgress = true;
        console.log('[OfflineSync] Starting sync...');

        try {
            // Upload queued items
            await this.processUploadQueue();

            // Sync pending actions
            await this.processPendingActions();

            console.log('[OfflineSync] Sync completed successfully');
        } catch (error) {
            console.error('[OfflineSync] Sync failed:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Process upload queue
     */
    async processUploadQueue() {
        const uploads = await window.dbManager.getPendingUploads();

        if (uploads.length === 0) {
            console.log('[OfflineSync] No uploads in queue');
            return;
        }

        console.log(`[OfflineSync] Processing ${uploads.length} queued uploads`);

        for (const upload of uploads) {
            try {
                await this.processUpload(upload);
            } catch (error) {
                console.error('[OfflineSync] Upload failed:', upload.id, error);

                // Update status to failed after 3 attempts
                if (upload.attempts >= 3) {
                    await window.dbManager.updateUploadStatus(upload.id, 'failed', error.message);
                }
            }
        }
    }

    /**
     * Process single upload
     */
    async processUpload(upload) {
        console.log('[OfflineSync] Processing upload:', upload.id);

        // Update status to uploading
        await window.dbManager.updateUploadStatus(upload.id, 'uploading');

        try {
            let response;

            if (upload.type === 'photo') {
                // Upload photo
                const formData = new FormData();
                formData.append('file', upload.file);
                formData.append('memorialId', upload.memorialId);
                if (upload.caption) formData.append('caption', upload.caption);

                response = await fetch('/api/photos', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
            } else if (upload.type === 'memory') {
                // Create memory
                response = await fetch('/api/memories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(upload.data),
                    credentials: 'include'
                });
            } else if (upload.type === 'candle') {
                // Light candle
                response = await fetch(`/api/memorials/${upload.memorialId}/candles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(upload.data),
                    credentials: 'include'
                });
            }

            if (!response || !response.ok) {
                throw new Error(`Upload failed with status ${response?.status}`);
            }

            // Mark as completed and remove from queue
            await window.dbManager.removeUpload(upload.id);
            console.log('[OfflineSync] Upload completed:', upload.id);

            // Show success notification
            if (window.undoSystem) {
                window.undoSystem.showSuccess('Upload synced successfully');
            }

        } catch (error) {
            console.error('[OfflineSync] Upload failed:', error);
            await window.dbManager.updateUploadStatus(upload.id, 'pending', error.message);
            throw error;
        }
    }

    /**
     * Process pending actions
     */
    async processPendingActions() {
        const actions = await window.dbManager.getPendingActions();

        if (actions.length === 0) {
            console.log('[OfflineSync] No pending actions');
            return;
        }

        console.log(`[OfflineSync] Processing ${actions.length} pending actions`);

        for (const action of actions) {
            try {
                await this.processAction(action);
                await window.dbManager.removePendingAction(action.id);
            } catch (error) {
                console.error('[OfflineSync] Action failed:', action.id, error);
            }
        }
    }

    /**
     * Process single action
     */
    async processAction(action) {
        console.log('[OfflineSync] Processing action:', action.type, action.id);

        let response;

        switch (action.type) {
            case 'update_memorial':
                response = await fetch(`/api/memorials/${action.memorialId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(action.data),
                    credentials: 'include'
                });
                break;

            case 'delete_memorial':
                response = await fetch(`/api/memorials/${action.memorialId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                break;

            case 'delete_photo':
                response = await fetch(`/api/photos/${action.photoId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                break;

            case 'delete_memory':
                response = await fetch(`/api/memories/${action.memoryId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                break;

            default:
                console.warn('[OfflineSync] Unknown action type:', action.type);
                return;
        }

        if (!response.ok) {
            throw new Error(`Action failed with status ${response.status}`);
        }

        console.log('[OfflineSync] Action completed:', action.type);
    }

    /**
     * Queue item for later upload
     */
    async queueForUpload(type, data) {
        const uploadData = {
            type,
            ...data,
            queuedAt: Date.now()
        };

        const id = await window.dbManager.queueUpload(uploadData);
        console.log('[OfflineSync] Item queued for upload:', id);

        // Show notification
        if (window.undoSystem) {
            window.undoSystem.showSuccess('Saved offline - will sync when online');
        }

        return id;
    }

    /**
     * Queue action for later processing
     */
    async queueAction(type, data) {
        const actionData = {
            type,
            ...data,
            queuedAt: Date.now()
        };

        const id = await window.dbManager.addPendingAction(actionData);
        console.log('[OfflineSync] Action queued:', id);

        // Show notification
        if (window.undoSystem) {
            window.undoSystem.showSuccess('Saved offline - will sync when online');
        }

        return id;
    }

    /**
     * Force sync now
     */
    async forceSyncNow() {
        if (!this.isOnline) {
            throw new Error('Cannot sync while offline');
        }

        await this.syncAllData();
    }

    /**
     * Get sync status
     */
    async getSyncStatus() {
        const stats = await window.dbManager.getStats();

        return {
            isOnline: this.isOnline,
            syncInProgress: this.syncInProgress,
            pendingUploads: stats.uploadQueue || 0,
            pendingActions: stats.pendingActions || 0,
            cachedMemorials: stats.memorials || 0,
            cachedPhotos: stats.photos || 0
        };
    }
}

// Initialize global offline sync manager
window.offlineSync = new OfflineSyncManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfflineSyncManager;
}

console.log('[OfflineSync] Manager loaded');
