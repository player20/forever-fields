/**
 * Forever Fields - Content Moderation
 * Client-side content validation and filtering
 */

(function() {
    'use strict';

    const Moderation = {
        // Common spam patterns
        spamPatterns: [
            /\b(buy now|click here|limited time|act now|free money)\b/gi,
            /\b(viagra|cialis|casino|lottery|winner)\b/gi,
            /(https?:\/\/[^\s]+){3,}/gi, // Multiple URLs
            /(.)\1{5,}/g, // Repeated characters
            /[A-Z\s]{20,}/g // Excessive caps
        ],

        // Crisis keywords that trigger support resources
        crisisKeywords: [
            'suicide', 'kill myself', 'end my life', 'want to die',
            'self harm', 'hurt myself', 'no point living'
        ],

        /**
         * Check text for spam patterns
         */
        isSpam(text) {
            if (!text) return false;

            for (const pattern of this.spamPatterns) {
                if (pattern.test(text)) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Check for crisis keywords
         */
        containsCrisisKeywords(text) {
            if (!text) return false;

            const lowerText = text.toLowerCase();
            return this.crisisKeywords.some(keyword =>
                lowerText.includes(keyword)
            );
        },

        /**
         * Sanitize text input
         */
        sanitize(text) {
            if (!text) return '';

            return text
                // Remove HTML tags
                .replace(/<[^>]*>/g, '')
                // Remove excessive whitespace
                .replace(/\s+/g, ' ')
                // Trim
                .trim();
        },

        /**
         * Validate and moderate content before submission
         */
        moderateContent(content, options = {}) {
            const {
                maxLength = 5000,
                allowUrls = true,
                checkSpam = true,
                checkCrisis = true
            } = options;

            const result = {
                isValid: true,
                sanitizedContent: this.sanitize(content),
                warnings: [],
                errors: []
            };

            // Check length
            if (result.sanitizedContent.length > maxLength) {
                result.errors.push(`Content exceeds maximum length of ${maxLength} characters`);
                result.isValid = false;
            }

            // Check for spam
            if (checkSpam && this.isSpam(result.sanitizedContent)) {
                result.errors.push('Content appears to contain spam');
                result.isValid = false;
            }

            // Check for URLs if not allowed
            if (!allowUrls && /https?:\/\/[^\s]+/g.test(result.sanitizedContent)) {
                result.errors.push('URLs are not allowed in this field');
                result.isValid = false;
            }

            // Check for crisis keywords
            if (checkCrisis && this.containsCrisisKeywords(result.sanitizedContent)) {
                result.warnings.push('crisis_detected');
                // Still valid, but trigger support resources
                this.showCrisisSupport();
            }

            return result;
        },

        /**
         * Show crisis support resources
         */
        showCrisisSupport() {
            const existingModal = document.getElementById('crisis-support-modal');
            if (existingModal) return;

            const modal = document.createElement('div');
            modal.id = 'crisis-support-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
            `;

            modal.innerHTML = `
                <div style="
                    background: white;
                    padding: 32px;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                ">
                    <h2 style="color: #5a6b7c; margin-bottom: 16px;">You're Not Alone</h2>
                    <p style="color: #666; margin-bottom: 24px;">
                        We noticed you might be going through a difficult time.
                        Please know that support is available.
                    </p>
                    <div style="background: #f8f4f0; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                        <p style="margin: 0 0 12px; font-weight: 600;">National Suicide Prevention Lifeline</p>
                        <a href="tel:988" style="
                            font-size: 24px;
                            color: #b38f1f;
                            text-decoration: none;
                            font-weight: bold;
                        ">Call or Text 988</a>
                        <p style="margin: 12px 0 0; font-size: 14px; color: #666;">
                            Available 24/7 • Free • Confidential
                        </p>
                    </div>
                    <button id="close-crisis-modal" style="
                        background: #a7c9a2;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                    ">Continue</button>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('close-crisis-modal').addEventListener('click', () => {
                modal.remove();
            });

            // Log for analytics (server-side)
            console.log('[Moderation] Crisis support shown');
        },

        /**
         * Validate image before upload
         */
        validateImage(file, options = {}) {
            const {
                maxSizeMB = 10,
                allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            } = options;

            const errors = [];

            if (!allowedTypes.includes(file.type)) {
                errors.push('File type not allowed. Please use JPG, PNG, GIF, or WebP.');
            }

            if (file.size > maxSizeMB * 1024 * 1024) {
                errors.push(`File too large. Maximum size is ${maxSizeMB}MB.`);
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        },

        /**
         * Initialize moderation for a form
         */
        initForm(form) {
            const textInputs = form.querySelectorAll('textarea, input[type="text"]');

            textInputs.forEach(input => {
                input.addEventListener('blur', () => {
                    const result = this.moderateContent(input.value);
                    if (!result.isValid) {
                        input.classList.add('moderation-warning');
                        console.warn('[Moderation] Content flagged:', result.errors);
                    } else {
                        input.classList.remove('moderation-warning');
                    }
                });
            });
        }
    };

    window.Moderation = Moderation;
})();
