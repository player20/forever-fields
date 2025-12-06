/**
 * API Configuration Helper
 * Auto-detects API endpoint based on environment
 * Eliminates hardcoded production URLs
 */

(function() {
    'use strict';

    /**
     * Get API base URL based on environment
     * Priority:
     * 1. Environment variable (if using build system like Vite)
     * 2. Auto-detection based on hostname
     * 3. Fallback to localhost
     */
    function getApiUrl() {
        // Auto-detect based on current hostname
        const hostname = window.location.hostname;

        // Development environments
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }

        // Production environment - use same origin
        // This works when frontend and backend are on same domain
        if (window.location.protocol === 'https:') {
            return window.location.origin;
        }

        // If custom backend domain, detect from meta tag
        const apiMetaTag = document.querySelector('meta[name="api-url"]');
        if (apiMetaTag) {
            return apiMetaTag.content;
        }

        // Fallback to same origin
        return window.location.origin;
    }

    /**
     * Get API endpoint with path
     * @param {string} path - API path (e.g., '/api/memorials')
     * @returns {string} Full API URL
     */
    function getApiEndpoint(path) {
        const baseUrl = getApiUrl();
        // Ensure path starts with /
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${normalizedPath}`;
    }

    /**
     * Check if API is reachable
     * @returns {Promise<boolean>}
     */
    async function checkApiHealth() {
        try {
            const response = await fetch(getApiEndpoint('/health'), {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            console.error('[API Config] Health check failed:', error);
            return false;
        }
    }

    // Expose globally
    window.ApiConfig = {
        getApiUrl,
        getApiEndpoint,
        checkApiHealth
    };

    // Log configuration on load (development only)
    if (window.location.hostname === 'localhost') {
        console.log('[API Config] Initialized with base URL:', getApiUrl());
    }

})();
