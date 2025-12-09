/**
 * IndexedDB Manager for Forever Fields
 * Provides offline storage for memorials, photos, and user actions
 */

class IndexedDBManager {
    constructor() {
        this.dbName = 'ForeverFieldsDB';
        this.dbVersion = 1;
        this.db = null;
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('[IndexedDB] Failed to open database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('[IndexedDB] Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('[IndexedDB] Upgrading database schema...');

                // Memorials store
                if (!db.objectStoreNames.contains('memorials')) {
                    const memorialStore = db.createObjectStore('memorials', { keyPath: 'id' });
                    memorialStore.createIndex('ownerId', 'ownerId', { unique: false });
                    memorialStore.createIndex('slug', 'slug', { unique: false });
                    memorialStore.createIndex('lastSynced', 'lastSynced', { unique: false });
                }

                // Photos store
                if (!db.objectStoreNames.contains('photos')) {
                    const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
                    photoStore.createIndex('memorialId', 'memorialId', { unique: false });
                    photoStore.createIndex('localOnly', 'localOnly', { unique: false });
                }

                // Upload queue store
                if (!db.objectStoreNames.contains('uploadQueue')) {
                    const queueStore = db.createObjectStore('uploadQueue', { keyPath: 'id', autoIncrement: true });
                    queueStore.createIndex('memorialId', 'memorialId', { unique: false });
                    queueStore.createIndex('status', 'status', { unique: false });
                    queueStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Pending actions store (for offline modifications)
                if (!db.objectStoreNames.contains('pendingActions')) {
                    const actionStore = db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
                    actionStore.createIndex('type', 'type', { unique: false });
                    actionStore.createIndex('status', 'status', { unique: false });
                    actionStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                console.log('[IndexedDB] Database schema upgraded successfully');
            };
        });
    }

    /**
     * Store memorial data
     */
    async storeMemorial(memorial) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['memorials'], 'readwrite');
            const store = transaction.objectStore('memorials');

            const memorialData = {
                ...memorial,
                lastSynced: Date.now(),
                offlineAvailable: true
            };

            const request = store.put(memorialData);

            request.onsuccess = () => {
                console.log('[IndexedDB] Memorial stored:', memorial.id);
                resolve(memorial.id);
            };

            request.onerror = () => {
                console.error('[IndexedDB] Failed to store memorial:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get memorial by ID
     */
    async getMemorial(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['memorials'], 'readonly');
            const store = transaction.objectStore('memorials');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get all memorials for a user
     */
    async getMemorialsByOwner(ownerId) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['memorials'], 'readonly');
            const store = transaction.objectStore('memorials');
            const index = store.index('ownerId');
            const request = index.getAll(ownerId);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Store photo data (including blob for offline)
     */
    async storePhoto(photo, blob = null) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');

            const photoData = {
                ...photo,
                blob: blob, // Store actual image blob for offline
                localOnly: !photo.url, // Flag for photos not yet uploaded
                lastSynced: Date.now()
            };

            const request = store.put(photoData);

            request.onsuccess = () => {
                console.log('[IndexedDB] Photo stored:', photo.id);
                resolve(photo.id);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get photos for a memorial
     */
    async getPhotos(memorialId) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readonly');
            const store = transaction.objectStore('photos');
            const index = store.index('memorialId');
            const request = index.getAll(memorialId);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Add item to upload queue
     */
    async queueUpload(uploadData) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['uploadQueue'], 'readwrite');
            const store = transaction.objectStore('uploadQueue');

            const queueItem = {
                ...uploadData,
                status: 'pending',
                createdAt: Date.now(),
                attempts: 0,
                lastAttempt: null
            };

            const request = store.add(queueItem);

            request.onsuccess = () => {
                console.log('[IndexedDB] Upload queued:', request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get pending uploads
     */
    async getPendingUploads() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['uploadQueue'], 'readonly');
            const store = transaction.objectStore('uploadQueue');
            const index = store.index('status');
            const request = index.getAll('pending');

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Update upload status
     */
    async updateUploadStatus(id, status, error = null) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['uploadQueue'], 'readwrite');
            const store = transaction.objectStore('uploadQueue');
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const upload = getRequest.result;
                if (!upload) {
                    reject(new Error('Upload not found'));
                    return;
                }

                upload.status = status;
                upload.lastAttempt = Date.now();
                upload.attempts += 1;
                if (error) upload.error = error;

                const putRequest = store.put(upload);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Remove completed upload
     */
    async removeUpload(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['uploadQueue'], 'readwrite');
            const store = transaction.objectStore('uploadQueue');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Add pending action (for offline modifications)
     */
    async addPendingAction(action) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pendingActions'], 'readwrite');
            const store = transaction.objectStore('pendingActions');

            const actionData = {
                ...action,
                status: 'pending',
                createdAt: Date.now()
            };

            const request = store.add(actionData);

            request.onsuccess = () => {
                console.log('[IndexedDB] Pending action added:', request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get pending actions
     */
    async getPendingActions() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pendingActions'], 'readonly');
            const store = transaction.objectStore('pendingActions');
            const index = store.index('status');
            const request = index.getAll('pending');

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Remove pending action
     */
    async removePendingAction(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pendingActions'], 'readwrite');
            const store = transaction.objectStore('pendingActions');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all offline data (for logout)
     */
    async clearAllData() {
        if (!this.db) await this.init();

        const stores = ['memorials', 'photos', 'uploadQueue', 'pendingActions'];

        return Promise.all(stores.map(storeName => {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => {
                    console.log(`[IndexedDB] Cleared ${storeName}`);
                    resolve();
                };

                request.onerror = () => reject(request.error);
            });
        }));
    }

    /**
     * Get database statistics
     */
    async getStats() {
        if (!this.db) await this.init();

        const stores = ['memorials', 'photos', 'uploadQueue', 'pendingActions'];
        const stats = {};

        for (const storeName of stores) {
            const count = await new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.count();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            stats[storeName] = count;
        }

        return stats;
    }
}

// Initialize global IndexedDB manager
window.dbManager = new IndexedDBManager();

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dbManager.init().catch(err => {
            console.error('[IndexedDB] Initialization failed:', err);
        });
    });
} else {
    window.dbManager.init().catch(err => {
        console.error('[IndexedDB] Initialization failed:', err);
    });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IndexedDBManager;
}

console.log('[IndexedDB] Manager loaded');
