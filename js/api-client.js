/**
 * Forever Fields - API Client
 * Handles all backend API communication
 */

class ForeverFieldsAPI {
    constructor(baseURL = null) {
        // Use ApiConfig if available, otherwise fall back to same origin
        this.baseURL = baseURL || (typeof ApiConfig !== 'undefined' ? ApiConfig.getApiUrl() : window.location.origin);
        // Note: Tokens now stored in httpOnly cookies (more secure than localStorage)
        // No need to manage tokens in JavaScript - cookies sent automatically
    }

    /**
     * Check if user is authenticated
     * Supports both httpOnly cookies (preferred) and localStorage tokens (cross-domain fallback)
     */
    async isAuthenticated() {
        try {
            console.log('[API] Checking authentication at:', `${this.baseURL}/api/user/me`);
            const headers = this._getAuthHeaders();
            console.log('[API] Auth headers:', headers);

            // Try httpOnly cookie auth first
            const response = await fetch(`${this.baseURL}/api/user/me`, {
                credentials: 'include', // Send cookies
                headers,
            });

            console.log('[API] Auth check response:', {
                status: response.status,
                ok: response.ok,
                statusText: response.statusText
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('[API] Auth check failed:', text);
            }

            return response.ok;
        } catch (error) {
            console.error('[API] Auth check error:', error);
            return false;
        }
    }

    /**
     * Get auth headers - checks localStorage for tokens (cross-domain fallback)
     * @private
     */
    _getAuthHeaders() {
        const token = localStorage.getItem('ff_access_token');
        if (token) {
            return { 'Authorization': `Bearer ${token}` };
        }
        return {};
    }

    /**
     * Logout - clears httpOnly cookies and localStorage tokens
     */
    async logout() {
        try {
            await this.post('/api/auth/logout');
            // Clear localStorage tokens (cross-domain fallback)
            localStorage.removeItem('ff_access_token');
            localStorage.removeItem('ff_refresh_token');
            // Redirect to login after logout
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed:', error);
            // Even if API call fails, clear localStorage tokens
            localStorage.removeItem('ff_access_token');
            localStorage.removeItem('ff_refresh_token');
        }
    }

    /**
     * Make an HTTP request
     * Supports both httpOnly cookies (preferred) and localStorage tokens (cross-domain fallback)
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...this._getAuthHeaders(), // Add localStorage token if available
            ...options.headers,
        };

        const config = {
            ...options,
            headers,
            credentials: 'include', // IMPORTANT: Send httpOnly cookies with every request
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
        return this.post('/api/auth/request-magic-link', { email });
    }

    // ============================================
    // USER ENDPOINTS
    // ============================================

    /**
     * Get current user profile
     */
    async getUserProfile() {
        return this.get('/api/user/me');
    }

    /**
     * Update current user profile
     */
    async updateUserProfile(data) {
        return this.put('/api/user/me', data);
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

    // ============================================
    // FAMILY TREE ENDPOINTS
    // ============================================

    /**
     * Get family members for a memorial
     */
    async getFamilyMembers(memorialId) {
        return this.get(`/api/family-tree/${memorialId}`);
    }

    /**
     * Create a new family member
     */
    async createFamilyMember(memberData) {
        return this.post('/api/family-tree', memberData);
    }

    /**
     * Update a family member
     */
    async updateFamilyMember(memberId, memberData) {
        return this.put(`/api/family-tree/${memberId}`, memberData);
    }

    /**
     * Delete a family member
     */
    async deleteFamilyMember(memberId) {
        return this.delete(`/api/family-tree/${memberId}`);
    }

    /**
     * Get user information
     */
    async getCurrentUser() {
        return this.get('/api/user/me');
    }

    // ============================================
    // DUPLICATE CHECK ENDPOINT
    // ============================================

    /**
     * Check for duplicate memorials
     */
    async checkDuplicate(data) {
        return this.post('/api/memorials/check-duplicate', data);
    }

    // ============================================
    // AFFILIATE ENDPOINTS
    // ============================================

    /**
     * Get affiliate flower delivery link
     */
    async getFlowerAffiliateLink(memorialId) {
        return this.get(`/api/affiliate/flowers?memorialId=${memorialId}`);
    }

    /**
     * Get flower delivery redirect URL
     */
    getFlowerDeliveryUrl(memorialId) {
        return `${this.baseURL}/api/affiliate/flowers/redirect?memorialId=${memorialId}`;
    }

    // ============================================
    // SOCIAL LINKS ENDPOINTS
    // ============================================

    /**
     * Get social links for a memorial
     */
    async getSocialLinks(memorialId) {
        return this.get(`/api/social-links/${memorialId}`);
    }

    /**
     * Update social links for a memorial (owner only)
     */
    async updateSocialLinks(memorialId, socialLinks) {
        return this.put(`/api/social-links/${memorialId}`, socialLinks);
    }

    /**
     * Delete social links for a memorial (owner only)
     */
    async deleteSocialLinks(memorialId) {
        return this.delete(`/api/social-links/${memorialId}`);
    }

    // ============================================
    // ADMIN ENDPOINTS
    // ============================================

    /**
     * Get recent signups (admin only)
     */
    async getAdminSignups(page = 1, search = '') {
        return this.get(`/api/admin/signups?page=${page}&search=${encodeURIComponent(search)}`);
    }

    /**
     * Get all memorials (admin only)
     */
    async getAdminMemorials(page = 1, search = '', privacy = '') {
        let url = `/api/admin/memorials?page=${page}&search=${encodeURIComponent(search)}`;
        if (privacy) url += `&privacy=${privacy}`;
        return this.get(url);
    }

    /**
     * Get potential duplicates (admin only)
     */
    async getAdminDuplicates() {
        return this.get('/api/admin/duplicates');
    }

    /**
     * Merge memorials (admin only)
     */
    async mergeMemorials(sourceId, targetId) {
        return this.post('/api/admin/merge-memorials', { sourceId, targetId });
    }

    /**
     * Get admin dashboard stats (admin only)
     */
    async getAdminStats() {
        return this.get('/api/admin/stats');
    }

    /**
     * Get admin audit log (admin only)
     */
    async getAdminAuditLog(page = 1) {
        return this.get(`/api/admin/audit-log?page=${page}`);
    }

    /**
     * Export signups as CSV (admin only)
     */
    getAdminSignupsExportUrl() {
        return `${this.baseURL}/api/admin/export/signups`;
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
