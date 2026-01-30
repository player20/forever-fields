/**
 * Forever Fields - IndexedDB Manager
 * Local storage for offline functionality
 */

(function() {
    'use strict';

    class IndexedDBManager {
        constructor(dbName = 'ForeverFieldsDB', version = 1) {
            this.dbName = dbName;
            this.version = version;
            this.db = null;
        }

        async init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.version);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // Drafts store - for unsaved memorial drafts
                    if (!db.objectStoreNames.contains('drafts')) {
                        const drafts = db.createObjectStore('drafts', { keyPath: 'id' });
                        drafts.createIndex('updatedAt', 'updatedAt', { unique: false });
                    }

                    // Cache store - for offline content
                    if (!db.objectStoreNames.contains('cache')) {
                        const cache = db.createObjectStore('cache', { keyPath: 'key' });
                        cache.createIndex('expiry', 'expiry', { unique: false });
                    }

                    // Sync queue - for pending API calls
                    if (!db.objectStoreNames.contains('syncQueue')) {
                        const syncQueue = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                        syncQueue.createIndex('createdAt', 'createdAt', { unique: false });
                    }

                    // User preferences
                    if (!db.objectStoreNames.contains('preferences')) {
                        db.createObjectStore('preferences', { keyPath: 'key' });
                    }
                };
            });
        }

        async ensureDB() {
            if (!this.db) {
                await this.init();
            }
            return this.db;
        }

        // Generic CRUD operations
        async get(storeName, key) {
            const db = await this.ensureDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async getAll(storeName) {
            const db = await this.ensureDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async put(storeName, data) {
            const db = await this.ensureDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(data);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async delete(storeName, key) {
            const db = await this.ensureDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        async clear(storeName) {
            const db = await this.ensureDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        // Draft-specific methods
        async saveDraft(draft) {
            draft.updatedAt = Date.now();
            draft.id = draft.id || 'draft-' + Date.now();
            return this.put('drafts', draft);
        }

        async getDraft(id) {
            return this.get('drafts', id);
        }

        async getAllDrafts() {
            return this.getAll('drafts');
        }

        async deleteDraft(id) {
            return this.delete('drafts', id);
        }

        // Cache methods with expiry
        async setCache(key, value, ttlMs = 3600000) {
            const data = {
                key,
                value,
                expiry: Date.now() + ttlMs
            };
            return this.put('cache', data);
        }

        async getCache(key) {
            const data = await this.get('cache', key);
            if (data && data.expiry > Date.now()) {
                return data.value;
            }
            // Expired - delete and return null
            if (data) {
                await this.delete('cache', key);
            }
            return null;
        }

        // Preference methods
        async setPreference(key, value) {
            return this.put('preferences', { key, value });
        }

        async getPreference(key, defaultValue = null) {
            const data = await this.get('preferences', key);
            return data ? data.value : defaultValue;
        }

        // Sync queue methods
        async addToSyncQueue(action) {
            action.createdAt = Date.now();
            return this.put('syncQueue', action);
        }

        async getSyncQueue() {
            return this.getAll('syncQueue');
        }

        async clearSyncQueue() {
            return this.clear('syncQueue');
        }
    }

    // Create singleton instance
    window.db = new IndexedDBManager();

    // Initialize on load
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await window.db.init();
            console.log('[IndexedDB] Initialized successfully');
        } catch (error) {
            console.error('[IndexedDB] Failed to initialize:', error);
        }
    });
})();
