/**
 * Memorial Page Enhancements
 * Adds Send Flowers affiliate button and social links to memorial pages
 */

(function() {
    'use strict';

    // Get memorial ID from page
    const getMemorialId = () => {
        return document.body.getAttribute('data-memorial-id') ||
               window.location.pathname.split('/').filter(Boolean).pop();
    };

    // ============================================
    // SEND FLOWERS AFFILIATE BUTTON
    // ============================================

    /**
     * Initialize Send Flowers button
     */
    async function initSendFlowersButton() {
        const memorialId = getMemorialId();
        if (!memorialId) {
            console.error('[MEMORIAL] No memorial ID found');
            return;
        }

        // Find the existing flower button or create a new one
        let flowerBtn = document.getElementById('sendFlowersBtn');

        if (!flowerBtn) {
            // Try to find the "Leave Flowers" button and replace it
            const existingFlowerBtn = document.getElementById('flowerBtn');
            if (existingFlowerBtn) {
                // Create new Send Flowers button
                flowerBtn = document.createElement('button');
                flowerBtn.id = 'sendFlowersBtn';
                flowerBtn.className = 'action-btn-full affiliate-btn';
                flowerBtn.innerHTML = '🌹 Send Flowers <span class="btn-subtitle">with love</span>';
                flowerBtn.setAttribute('aria-label', 'Send flowers to the memorial location');

                // Add after existing button
                existingFlowerBtn.parentNode.insertBefore(flowerBtn, existingFlowerBtn.nextSibling);

                // Update existing button text
                existingFlowerBtn.innerHTML = '🌸 Leave Virtual Flowers';
            }
        }

        if (!flowerBtn) {
            console.warn('[MEMORIAL] Send Flowers button element not found');
            return;
        }

        // Add loading state
        const originalHTML = flowerBtn.innerHTML;

        flowerBtn.addEventListener('click', async function(e) {
            e.preventDefault();

            // Show loading state
            flowerBtn.disabled = true;
            flowerBtn.innerHTML = '<span class="spinner-small"></span> Loading...';

            try {
                // Get affiliate link from API
                const response = await window.api.getFlowerAffiliateLink(memorialId);

                if (response && response.url) {
                    // Log affiliate click (optional analytics)
                    console.log('[AFFILIATE] Flower delivery click:', {
                        memorialId: response.memorialId,
                        isPet: response.isPet,
                        hasAddress: response.hasAddress
                    });

                    // Open in new tab
                    window.open(response.url, '_blank', 'noopener,noreferrer');

                    // Show success toast
                    if (typeof showToast === 'function') {
                        const message = response.hasAddress
                            ? 'Delivery address pre-filled for you'
                            : 'Opening flower delivery options';
                        showToast(message, 'success');
                    }
                } else {
                    throw new Error('Invalid affiliate link response');
                }
            } catch (error) {
                console.error('[AFFILIATE] Flower delivery error:', error);

                // Show error toast
                if (typeof showToast === 'function') {
                    showToast('Unable to load flower delivery. Please try again.', 'error');
                }
            } finally {
                // Restore button
                flowerBtn.disabled = false;
                flowerBtn.innerHTML = originalHTML;
            }
        });

        console.log('[MEMORIAL] Send Flowers button initialized');
    }

    // ============================================
    // SOCIAL LINKS DISPLAY
    // ============================================

    /**
     * Create social link button
     */
    function createSocialLinkButton(platform, url, isPet) {
        const button = document.createElement('a');
        button.href = url;
        button.target = '_blank';
        button.rel = 'noopener noreferrer';
        button.className = 'social-link-btn';
        button.setAttribute('aria-label', `Visit ${platform} profile`);

        // Platform-specific icons and colors
        const platforms = {
            facebook: {
                icon: isPet ? '🐾' : '📘',
                label: 'Facebook',
                color: '#1877F2'
            },
            instagram: {
                icon: isPet ? '🐾' : '📷',
                label: 'Instagram',
                color: '#E4405F'
            },
            tiktok: {
                icon: isPet ? '🐾' : '🎵',
                label: 'TikTok',
                color: '#000000'
            }
        };

        const config = platforms[platform];
        if (config) {
            button.innerHTML = `
                <span class="social-icon" style="background-color: ${config.color}">${config.icon}</span>
                <span class="social-label">${config.label}</span>
            `;
        }

        return button;
    }

    /**
     * Initialize social links display
     */
    async function initSocialLinks() {
        const memorialId = getMemorialId();
        if (!memorialId) return;

        try {
            // Get social links from API
            const response = await window.api.getSocialLinks(memorialId);

            if (!response || !response.socialLinks) {
                console.log('[MEMORIAL] No social links found');
                return;
            }

            const { socialLinks } = response;
            const hasSocialLinks = socialLinks.facebook || socialLinks.instagram || socialLinks.tiktok;

            if (!hasSocialLinks) {
                console.log('[MEMORIAL] No social links configured');
                return;
            }

            // Find or create social links container
            let container = document.getElementById('socialLinksContainer');

            if (!container) {
                // Create container after hero section or in sidebar
                const hero = document.querySelector('.memorial-hero');
                const sidebar = document.querySelector('.memorial-sidebar');

                if (hero) {
                    container = document.createElement('div');
                    container.id = 'socialLinksContainer';
                    container.className = 'social-links-section';
                    container.innerHTML = '<h3 class="social-links-title">Connect & Remember</h3>';

                    hero.after(container);
                } else if (sidebar) {
                    // Add to sidebar
                    const actionCard = document.createElement('div');
                    actionCard.className = 'action-card';
                    actionCard.innerHTML = '<h3 class="action-card-title">🔗 Social Profiles</h3>';

                    container = document.createElement('div');
                    container.id = 'socialLinksContainer';
                    container.className = 'social-links-grid';

                    actionCard.appendChild(container);
                    sidebar.insertBefore(actionCard, sidebar.firstChild.nextSibling);
                }
            }

            if (!container) {
                console.warn('[MEMORIAL] Could not find container for social links');
                return;
            }

            // Clear existing content (except title)
            const title = container.querySelector('.social-links-title');
            container.innerHTML = '';
            if (title) container.appendChild(title);

            // Check if pet mode is active
            const isPet = document.body.classList.contains('pet-mode') ||
                          document.querySelector('[data-is-pet="true"]');

            // Add social link buttons
            const linksWrapper = document.createElement('div');
            linksWrapper.className = 'social-links-buttons';

            if (socialLinks.facebook) {
                linksWrapper.appendChild(createSocialLinkButton('facebook', socialLinks.facebook, isPet));
            }
            if (socialLinks.instagram) {
                linksWrapper.appendChild(createSocialLinkButton('instagram', socialLinks.instagram, isPet));
            }
            if (socialLinks.tiktok) {
                linksWrapper.appendChild(createSocialLinkButton('tiktok', socialLinks.tiktok, isPet));
            }

            container.appendChild(linksWrapper);
            console.log('[MEMORIAL] Social links initialized');

        } catch (error) {
            console.error('[MEMORIAL] Social links error:', error);
            // Fail silently - social links are optional enhancement
        }
    }

    // ============================================
    // LOADING SPINNER STYLES
    // ============================================

    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Send Flowers Affiliate Button */
            .affiliate-btn {
                background: linear-gradient(135deg, #B8956A 0%, #A67F55 100%) !important;
                color: white !important;
                font-weight: 600;
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .affiliate-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(184, 149, 106, 0.3);
            }

            .affiliate-btn .btn-subtitle {
                display: block;
                font-size: 0.75rem;
                font-weight: 400;
                opacity: 0.9;
                margin-top: 2px;
            }

            .affiliate-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }

            /* Loading Spinner */
            .spinner-small {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 0.6s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* Social Links Section */
            .social-links-section {
                background: var(--warm-white, #FDFCFA);
                padding: 2rem 1.5rem;
                text-align: center;
                border-top: 1px solid var(--sage-light, #E8EDE8);
                border-bottom: 1px solid var(--sage-light, #E8EDE8);
            }

            .social-links-title {
                font-family: var(--font-serif, 'Playfair Display', serif);
                font-size: 1.5rem;
                color: var(--sage-primary, #8BA888);
                margin: 0 0 1.5rem 0;
            }

            .social-links-buttons {
                display: flex;
                justify-content: center;
                gap: 1rem;
                flex-wrap: wrap;
            }

            .social-links-grid {
                display: grid;
                gap: 0.75rem;
                margin-top: 1rem;
            }

            .social-link-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.25rem;
                background: white;
                border: 2px solid var(--cream, #FAF7F2);
                border-radius: 12px;
                text-decoration: none;
                color: var(--gray-dark, #2C3333);
                font-weight: 500;
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }

            .social-link-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                border-color: var(--sage-light, #E8EDE8);
            }

            .social-icon {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.25rem;
                color: white;
            }

            .social-label {
                font-size: 0.95rem;
            }

            /* Mobile responsive */
            @media (max-width: 600px) {
                .social-links-buttons {
                    flex-direction: column;
                }

                .social-link-btn {
                    width: 100%;
                    justify-content: center;
                }
            }

            /* Touch-friendly tap targets (min 44x44px) */
            @media (hover: none) {
                .social-link-btn,
                .affiliate-btn {
                    min-height: 44px;
                    min-width: 44px;
                }
            }

            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .social-link-btn {
                    border-width: 3px;
                }
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .affiliate-btn,
                .social-link-btn {
                    transition: none;
                }

                .spinner-small {
                    animation: none;
                    border: 2px solid white;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        // Wait for API client to be available
        if (typeof window.api === 'undefined') {
            console.error('[MEMORIAL] API client not found. Make sure api-client.js is loaded first.');
            return;
        }

        // Inject styles
        injectStyles();

        // Initialize enhancements
        initSendFlowersButton();
        initSocialLinks();

        console.log('[MEMORIAL] Enhancements initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose public API
    window.MemorialEnhancements = {
        init,
        initSendFlowersButton,
        initSocialLinks
    };

})();
