/**
 * Social Links Editor
 * Allows memorial owners to add/edit social media links
 * Can be embedded in dashboard or wizard
 */

(function() {
    'use strict';

    class SocialLinksEditor {
        constructor(memorialId, containerElement) {
            this.memorialId = memorialId;
            this.container = containerElement;
            this.socialLinks = { facebook: '', instagram: '', tiktok: '' };
            this.isLoading = false;
            this.isDirty = false;

            this.init();
        }

        async init() {
            await this.loadSocialLinks();
            this.render();
            this.attachEventListeners();
        }

        async loadSocialLinks() {
            if (!window.api) {
                console.error('[SOCIAL_LINKS] API client not available');
                return;
            }

            try {
                this.isLoading = true;
                const response = await window.api.getSocialLinks(this.memorialId);

                if (response && response.socialLinks) {
                    this.socialLinks = {
                        facebook: response.socialLinks.facebook || '',
                        instagram: response.socialLinks.instagram || '',
                        tiktok: response.socialLinks.tiktok || ''
                    };
                }
            } catch (error) {
                // Fail silently if no links exist yet
                console.log('[SOCIAL_LINKS] No existing links found');
            } finally {
                this.isLoading = false;
            }
        }

        render() {
            this.container.innerHTML = `
                <div class="social-links-editor">
                    <h3 class="editor-title">🔗 Social Media Links</h3>
                    <p class="editor-description">
                        Add links to social profiles to help friends and family connect and remember.
                        These will appear on the memorial page.
                    </p>

                    <div class="social-links-form">
                        <!-- Facebook -->
                        <div class="form-group">
                            <label for="facebook-url" class="form-label">
                                <span class="label-icon">📘</span>
                                Facebook Profile
                            </label>
                            <input
                                type="url"
                                id="facebook-url"
                                class="form-input"
                                placeholder="https://facebook.com/username"
                                value="${this.escapeHtml(this.socialLinks.facebook)}"
                                aria-label="Facebook profile URL"
                            />
                            <small class="form-help">Example: https://facebook.com/john.doe</small>
                            <div class="form-error" id="facebook-error"></div>
                        </div>

                        <!-- Instagram -->
                        <div class="form-group">
                            <label for="instagram-url" class="form-label">
                                <span class="label-icon">📷</span>
                                Instagram Profile
                            </label>
                            <input
                                type="url"
                                id="instagram-url"
                                class="form-input"
                                placeholder="https://instagram.com/username"
                                value="${this.escapeHtml(this.socialLinks.instagram)}"
                                aria-label="Instagram profile URL"
                            />
                            <small class="form-help">Example: https://instagram.com/johndoe</small>
                            <div class="form-error" id="instagram-error"></div>
                        </div>

                        <!-- TikTok -->
                        <div class="form-group">
                            <label for="tiktok-url" class="form-label">
                                <span class="label-icon">🎵</span>
                                TikTok Profile
                            </label>
                            <input
                                type="url"
                                id="tiktok-url"
                                class="form-input"
                                placeholder="https://tiktok.com/@username"
                                value="${this.escapeHtml(this.socialLinks.tiktok)}"
                                aria-label="TikTok profile URL"
                            />
                            <small class="form-help">Example: https://tiktok.com/@johndoe</small>
                            <div class="form-error" id="tiktok-error"></div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="form-actions">
                            <button
                                type="button"
                                id="save-social-links"
                                class="btn btn-primary"
                                disabled
                            >
                                <span class="btn-icon">💾</span>
                                Save Social Links
                            </button>

                            <button
                                type="button"
                                id="clear-social-links"
                                class="btn btn-secondary"
                            >
                                Clear All
                            </button>
                        </div>

                        <div class="form-success" id="save-success" style="display: none;">
                            ✓ Social links saved successfully!
                        </div>
                    </div>

                    <div class="privacy-note">
                        <p><strong>Privacy Note:</strong> Only include links you're comfortable sharing publicly.
                        These will be visible to anyone who can view the memorial.</p>
                    </div>
                </div>
            `;

            this.injectStyles();
        }

        attachEventListeners() {
            const facebookInput = document.getElementById('facebook-url');
            const instagramInput = document.getElementById('instagram-url');
            const tiktokInput = document.getElementById('tiktok-url');
            const saveButton = document.getElementById('save-social-links');
            const clearButton = document.getElementById('clear-social-links');

            // Track changes
            [facebookInput, instagramInput, tiktokInput].forEach(input => {
                input.addEventListener('input', () => {
                    this.isDirty = true;
                    saveButton.disabled = false;
                    this.clearError(input.id.replace('-url', ''));
                });

                input.addEventListener('blur', () => {
                    this.validateUrl(input);
                });
            });

            // Save button
            saveButton.addEventListener('click', () => {
                this.saveSocialLinks();
            });

            // Clear button
            clearButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to remove all social links?')) {
                    facebookInput.value = '';
                    instagramInput.value = '';
                    tiktokInput.value = '';
                    this.isDirty = true;
                    saveButton.disabled = false;
                }
            });
        }

        validateUrl(input) {
            const platform = input.id.replace('-url', '');
            const value = input.value.trim();
            const errorElement = document.getElementById(`${platform}-error`);

            if (!value) {
                this.clearError(platform);
                return true;
            }

            // URL format validation
            try {
                const url = new URL(value);

                // Platform-specific validation
                const patterns = {
                    facebook: /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\//i,
                    instagram: /^https?:\/\/(www\.)?instagram\.com\//i,
                    tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@/i
                };

                if (!patterns[platform].test(value)) {
                    this.showError(platform, `Invalid ${platform} URL format`);
                    return false;
                }

                this.clearError(platform);
                return true;
            } catch (error) {
                this.showError(platform, 'Please enter a valid URL starting with https://');
                return false;
            }
        }

        showError(platform, message) {
            const errorElement = document.getElementById(`${platform}-error`);
            const input = document.getElementById(`${platform}-url`);

            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
            if (input) {
                input.classList.add('error');
            }
        }

        clearError(platform) {
            const errorElement = document.getElementById(`${platform}-error`);
            const input = document.getElementById(`${platform}-url`);

            if (errorElement) {
                errorElement.style.display = 'none';
            }
            if (input) {
                input.classList.remove('error');
            }
        }

        async saveSocialLinks() {
            const facebookInput = document.getElementById('facebook-url');
            const instagramInput = document.getElementById('instagram-url');
            const tiktokInput = document.getElementById('tiktok-url');
            const saveButton = document.getElementById('save-social-links');
            const successMessage = document.getElementById('save-success');

            // Validate all inputs
            const isValid = [facebookInput, instagramInput, tiktokInput]
                .every(input => this.validateUrl(input));

            if (!isValid) {
                if (typeof showToast === 'function') {
                    showToast('Please fix the errors before saving', 'error');
                }
                return;
            }

            // Show loading state
            saveButton.disabled = true;
            saveButton.innerHTML = '<span class="spinner-small"></span> Saving...';

            try {
                const data = {
                    facebook: facebookInput.value.trim() || null,
                    instagram: instagramInput.value.trim() || null,
                    tiktok: tiktokInput.value.trim() || null
                };

                await window.api.updateSocialLinks(this.memorialId, data);

                // Update local state
                this.socialLinks = data;
                this.isDirty = false;

                // Show success message
                successMessage.style.display = 'block';
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 3000);

                if (typeof showToast === 'function') {
                    showToast('Social links saved successfully!', 'success');
                }

            } catch (error) {
                console.error('[SOCIAL_LINKS] Save error:', error);

                if (typeof showToast === 'function') {
                    showToast('Failed to save social links. Please try again.', 'error');
                }
            } finally {
                saveButton.disabled = false;
                saveButton.innerHTML = '<span class="btn-icon">💾</span> Save Social Links';
            }
        }

        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        injectStyles() {
            if (document.getElementById('social-links-editor-styles')) return;

            const style = document.createElement('style');
            style.id = 'social-links-editor-styles';
            style.textContent = `
                .social-links-editor {
                    background: white;
                    border-radius: 12px;
                    padding: 2rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .editor-title {
                    font-size: 1.5rem;
                    margin: 0 0 0.5rem 0;
                    color: var(--sage-primary, #8BA888);
                }

                .editor-description {
                    color: var(--gray-light, #666);
                    margin: 0 0 2rem 0;
                    line-height: 1.6;
                }

                .social-links-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                    color: var(--gray-dark, #2C3333);
                }

                .label-icon {
                    font-size: 1.25rem;
                }

                .form-input {
                    padding: 0.75rem 1rem;
                    border: 2px solid var(--cream, #FAF7F2);
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.2s ease;
                }

                .form-input:focus {
                    outline: none;
                    border-color: var(--sage-primary, #8BA888);
                }

                .form-input.error {
                    border-color: #E53E3E;
                }

                .form-help {
                    font-size: 0.875rem;
                    color: var(--gray-light, #666);
                }

                .form-error {
                    display: none;
                    color: #E53E3E;
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .form-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .btn {
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    border: none;
                }

                .btn-primary {
                    background: var(--sage-primary, #8BA888);
                    color: white;
                }

                .btn-primary:hover:not(:disabled) {
                    background: #7A8E72;
                    transform: translateY(-1px);
                }

                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-secondary {
                    background: white;
                    color: var(--gray-dark, #2C3333);
                    border: 2px solid var(--cream, #FAF7F2);
                }

                .btn-secondary:hover {
                    border-color: var(--sage-light, #E8EDE8);
                    background: var(--cream, #FAF7F2);
                }

                .form-success {
                    background: #E8F4E8;
                    color: var(--sage-primary, #8BA888);
                    padding: 1rem;
                    border-radius: 8px;
                    font-weight: 500;
                    margin-top: 1rem;
                }

                .privacy-note {
                    margin-top: 2rem;
                    padding: 1rem;
                    background: var(--cream, #FAF7F2);
                    border-radius: 8px;
                    font-size: 0.875rem;
                    color: var(--gray-dark, #2C3333);
                }

                .privacy-note p {
                    margin: 0;
                }

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

                @media (max-width: 600px) {
                    .social-links-editor {
                        padding: 1.5rem;
                    }

                    .form-actions {
                        flex-direction: column;
                    }

                    .btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Expose to global scope
    window.SocialLinksEditor = SocialLinksEditor;

})();
