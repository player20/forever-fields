/**
 * Forever Fields - API Client
 * Handles all backend API communication
 */

class ForeverFieldsAPI {
    constructor(baseURL = null) {
        this.baseURL = baseURL || (typeof ApiConfig !== 'undefined' ? ApiConfig.getApiUrl() : window.location.origin);
    }

    async isAuthenticated() {
        try {
            const response = await fetch(`${this.baseURL}/api/user/me`, {
                credentials: 'include',
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async logout() {
        try {
            await this.post('/api/auth/logout');
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const config = {
            ...options,
            headers,
            credentials: 'include',
        };

        try {
            const response = await fetch(url, config);
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw new APIError(
                    data.error || data.message || 'Request failed',
                    response.status,
                    data
                );
            }

            return data;
        } catch (error) {
            if (error instanceof APIError) throw error;
            throw new APIError('Network error. Please check your connection.', 0, error);
        }
    }

    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    // Auth endpoints
    async requestMagicLink(email) {
        return this.post('/api/auth/magic-link', { email });
    }

    // Memorial endpoints
    async getMemorial(id) {
        return this.get(`/api/memorials/${id}`);
    }

    async getMyMemorials() {
        return this.get('/api/memorials/mine');
    }

    async createMemorial(memorialData) {
        return this.post('/api/memorials', memorialData);
    }

    async updateMemorial(id, memorialData) {
        return this.put(`/api/memorials/${id}`, memorialData);
    }

    async deleteMemorial(id) {
        return this.delete(`/api/memorials/${id}`);
    }

    // Candle endpoints
    async lightCandle(memorialId, candleData) {
        return this.post('/api/candles', { memorialId, ...candleData });
    }

    async getCandles(memorialId) {
        return this.get(`/api/candles/${memorialId}`);
    }

    // Time capsule endpoints
    async getTimeCapsules(memorialId) {
        return this.get(`/api/time-capsules/${memorialId}`);
    }

    async createTimeCapsule(capsuleData) {
        return this.post('/api/time-capsules', capsuleData);
    }

    // Upload endpoints
    async getUploadSignature(fileType, fileName, memorialId) {
        return this.post('/api/uploads/sign', { fileType, fileName, memorialId });
    }

    async completeUpload(memorialId, cloudinaryResult) {
        return this.post('/api/uploads/complete', { memorialId, cloudinaryResult });
    }

    async getMemorialPhotos(memorialId) {
        return this.get(`/api/uploads/memorial/${memorialId}`);
    }

    // QR code endpoints
    async generateQRCode(memorialId, design = 'minimalist') {
        return this.get(`/api/qr/${memorialId}?design=${design}`);
    }

    getQRCodeDownloadUrl(memorialId, design = 'minimalist') {
        return `${this.baseURL}/api/qr/${memorialId}?design=${design}&download=true`;
    }

    getPrayerCardDownloadUrl(memorialId, design = 'minimalist') {
        return `${this.baseURL}/api/prayer-card/${memorialId}?design=${design}`;
    }
}

class APIError extends Error {
    constructor(message, statusCode, details) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.details = details;
    }

    isNetworkError() { return this.statusCode === 0; }
    isNotFound() { return this.statusCode === 404; }
    isForbidden() { return this.statusCode === 403; }
    isUnauthorized() { return this.statusCode === 401; }
    isRateLimited() { return this.statusCode === 429; }
    isValidationError() { return this.statusCode === 400; }
}

if (typeof window !== 'undefined') {
    window.ForeverFieldsAPI = ForeverFieldsAPI;
    window.APIError = APIError;
}
