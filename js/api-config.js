/**
 * API Configuration Helper
 * Auto-detects API endpoint based on environment
 */

(function() {
    'use strict';

    /**
     * Get API base URL based on environment
     */
    function getApiUrl() {
        // Check for environment variable (Vite/Webpack)
        if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
            return import.meta.env.VITE_API_URL;
        }

        const hostname = window.location.hostname;

        // Development environments
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }

        // Check for private IP ranges (local network)
        if (/^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname)) {
            return `http://${hostname}:3000`;
        }

        // Production - check meta tag first
        const apiMetaTag = document.querySelector('meta[name="api-url"]');
        if (apiMetaTag) {
            return apiMetaTag.content;
        }

        // Production fallback to Render backend
        if (window.location.protocol === 'https:') {
            return 'https://forever-fields-api.onrender.com';
        }

        return window.location.origin;
    }

    /**
     * Get full API endpoint URL
     */
    function getApiEndpoint(path) {
        const baseUrl = getApiUrl();
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${normalizedPath}`;
    }

    /**
     * Check API health
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

    // Log in development
    if (window.location.hostname === 'localhost') {
        console.log('[API Config] Base URL:', getApiUrl());
    }
})();
