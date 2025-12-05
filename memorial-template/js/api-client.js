/**
 * Forever Fields - API Client
 * Handles all backend API communication
 */

class ForeverFieldsAPI {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('ff_auth_token');
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('ff_auth_token', token);
        } else {
            localStorage.removeItem('ff_auth_token');
        }
    }

    /**
     * Get authentication token
     */
    getToken() {
        return this.token;
    }

    /**
     * Make an HTTP request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Add auth token if available
        if (this.token && !options.noAuth) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);

            // Handle different response types
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
            if (error instanceof APIError) {
                throw error;
            }

            // Network or other errors
            throw new APIError(
                'Network error. Please check your connection.',
                0,
                error
            );
        }
    }

    /**
     * GET request
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'GET',
        });
    }

    /**
     * POST request
     */
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'DELETE',
        });
    }

    // ============================================
    // AUTH ENDPOINTS
    // ============================================

    /**
     * Request magic link
     */
    async requestMagicLink(email) {
        return this.post('/api/auth/magic-link', { email });
    }

    // ============================================
    // MEMORIAL ENDPOINTS
    // ============================================

    /**
     * Get memorial by ID (public access)
     */
    async getMemorial(id) {
        return this.get(`/api/memorials/${id}`, { noAuth: true });
    }

    /**
     * Get authenticated user's memorials
     */
    async getMyMemorials() {
        return this.get('/api/memorials/mine');
    }

    /**
     * Create a new memorial
     */
    async createMemorial(memorialData) {
        return this.post('/api/memorials', memorialData);
    }

    /**
     * Update a memorial
     */
    async updateMemorial(id, memorialData) {
        return this.put(`/api/memorials/${id}`, memorialData);
    }

    /**
     * Delete a memorial
     */
    async deleteMemorial(id) {
        return this.delete(`/api/memorials/${id}`);
    }

    // ============================================
    // CANDLE ENDPOINTS
    // ============================================

    /**
     * Light a candle (public, rate-limited)
     */
    async lightCandle(memorialId, candleData) {
        return this.post('/api/candles', {
            memorialId,
            ...candleData,
        }, { noAuth: true });
    }

    /**
     * Get candles for a memorial
     */
    async getCandles(memorialId) {
        return this.get(`/api/candles/${memorialId}`, { noAuth: true });
    }

    // ============================================
    // TIME CAPSULE ENDPOINTS
    // ============================================

    /**
     * Get time capsules for a memorial
     */
    async getTimeCapsules(memorialId) {
        return this.get(`/api/time-capsules/${memorialId}`, { noAuth: true });
    }

    /**
     * Create a time capsule
     */
    async createTimeCapsule(capsuleData) {
        return this.post('/api/time-capsules', capsuleData);
    }

    /**
     * Mark time capsule as opened
     */
    async openTimeCapsule(capsuleId) {
        return this.post(`/api/time-capsules/${capsuleId}/open`);
    }

    // ============================================
    // UPLOAD ENDPOINTS
    // ============================================

    /**
     * Get signed upload URL from Cloudinary
     */
    async getUploadSignature(fileType, fileName, memorialId) {
        return this.post('/api/uploads/sign', {
            fileType,
            fileName,
            memorialId,
        });
    }

    /**
     * Complete upload after Cloudinary success
     */
    async completeUpload(memorialId, cloudinaryResult) {
        return this.post('/api/uploads/complete', {
            memorialId,
            cloudinaryResult,
        });
    }

    /**
     * Get approved photos for a memorial (public access)
     */
    async getMemorialPhotos(memorialId) {
        return this.get(`/api/uploads/memorial/${memorialId}`, { noAuth: true });
    }

    // ============================================
    // QR CODE ENDPOINTS
    // ============================================

    /**
     * Generate QR code for memorial with design
     */
    async generateQRCode(memorialId, design = 'minimalist') {
        return this.get(`/api/qr/${memorialId}?design=${design}`, { noAuth: true });
    }

    /**
     * Download QR code image
     */
    getQRCodeDownloadUrl(memorialId, design = 'minimalist') {
        return `${this.baseURL}/api/qr/${memorialId}?design=${design}&download=true`;
    }

    /**
     * Create/update QR code for memorial
     */
    async createQRCode(memorialId, design) {
        return this.post('/api/qr', {
            memorialId,
            design,
        });
    }

    // ============================================
    // PRAYER CARD ENDPOINTS
    // ============================================

    /**
     * Download prayer card PDF
     */
    getPrayerCardDownloadUrl(memorialId, design = 'minimalist') {
        return `${this.baseURL}/api/prayer-card/${memorialId}?design=${design}`;
    }

    /**
     * Generate and download prayer card PDF
     */
    async downloadPrayerCard(memorialId, design = 'minimalist') {
        window.open(this.getPrayerCardDownloadUrl(memorialId, design), '_blank');
    }
}

/**
 * API Error class
 */
class APIError extends Error {
    constructor(message, statusCode, details) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.details = details;
    }

    isNetworkError() {
        return this.statusCode === 0;
    }

    isNotFound() {
        return this.statusCode === 404;
    }

    isForbidden() {
        return this.statusCode === 403;
    }

    isUnauthorized() {
        return this.statusCode === 401;
    }

    isRateLimited() {
        return this.statusCode === 429;
    }

    isValidationError() {
        return this.statusCode === 400;
    }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.ForeverFieldsAPI = ForeverFieldsAPI;
    window.APIError = APIError;
}
