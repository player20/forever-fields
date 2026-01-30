/**
 * Forever Fields - Memorial Helpers
 * Utility functions for memorial pages
 */

(function() {
    'use strict';

    const MemorialHelpers = {
        /**
         * Calculate age from birth and death dates
         */
        calculateAge(birthDate, deathDate) {
            const birth = new Date(birthDate);
            const death = new Date(deathDate);

            if (isNaN(birth.getTime()) || isNaN(death.getTime())) {
                return null;
            }

            let years = death.getFullYear() - birth.getFullYear();
            let months = death.getMonth() - birth.getMonth();
            let days = death.getDate() - birth.getDate();

            if (days < 0) {
                months--;
                days += new Date(death.getFullYear(), death.getMonth(), 0).getDate();
            }

            if (months < 0) {
                years--;
                months += 12;
            }

            return { years, months, days };
        },

        /**
         * Format age for display
         */
        formatAge(age, includeMonths = true) {
            if (!age) return null;

            const { years, months, days } = age;

            if (years === 0 && months === 0) {
                return `${days} day${days !== 1 ? 's' : ''}`;
            }

            if (years === 0) {
                return `${months} month${months !== 1 ? 's' : ''}`;
            }

            if (includeMonths && months > 0) {
                return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
            }

            return `${years} year${years !== 1 ? 's' : ''}`;
        },

        /**
         * Format life span string (e.g., "January 15, 1950 - December 3, 2023")
         */
        formatLifeSpan(birthDate, deathDate, format = 'long') {
            const options = format === 'long'
                ? { year: 'numeric', month: 'long', day: 'numeric' }
                : { year: 'numeric', month: 'short', day: 'numeric' };

            const birth = new Date(birthDate);
            const death = new Date(deathDate);

            if (isNaN(birth.getTime()) || isNaN(death.getTime())) {
                return '';
            }

            const birthStr = birth.toLocaleDateString('en-US', options);
            const deathStr = death.toLocaleDateString('en-US', options);

            return `${birthStr} — ${deathStr}`;
        },

        /**
         * Get pronoun based on gender
         */
        getPronouns(gender, customPronouns = null) {
            if (customPronouns) return customPronouns;

            const pronounMap = {
                'Male': { subject: 'he', object: 'him', possessive: 'his' },
                'Female': { subject: 'she', object: 'her', possessive: 'her' },
                'Non-Binary': { subject: 'they', object: 'them', possessive: 'their' },
                'Other': { subject: 'they', object: 'them', possessive: 'their' }
            };

            return pronounMap[gender] || pronounMap['Other'];
        },

        /**
         * Generate memorial URL slug
         */
        generateSlug(name) {
            return name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        },

        /**
         * Parse memorial ID from URL
         */
        getMemorialIdFromUrl() {
            const pathParts = window.location.pathname.split('/');
            const memorialIndex = pathParts.indexOf('memorial');
            if (memorialIndex !== -1 && pathParts[memorialIndex + 1]) {
                return pathParts[memorialIndex + 1];
            }
            return new URLSearchParams(window.location.search).get('id');
        },

        /**
         * Format candle count
         */
        formatCandleCount(count) {
            if (count >= 1000000) {
                return (count / 1000000).toFixed(1) + 'M';
            }
            if (count >= 1000) {
                return (count / 1000).toFixed(1) + 'K';
            }
            return count.toString();
        },

        /**
         * Generate share URLs
         */
        getShareUrls(memorialUrl, name) {
            const encodedUrl = encodeURIComponent(memorialUrl);
            const encodedText = encodeURIComponent(`Remembering ${name} - Forever Fields`);

            return {
                facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
                twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
                linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
                email: `mailto:?subject=${encodedText}&body=${encodedUrl}`,
                whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`
            };
        },

        /**
         * Copy memorial link to clipboard
         */
        async copyMemorialLink(memorialId) {
            const url = `${window.location.origin}/memorial/${memorialId}`;
            try {
                await navigator.clipboard.writeText(url);
                if (window.ForeverFieldsUtils) {
                    window.ForeverFieldsUtils.showToast('Link copied!', 'success');
                }
                return true;
            } catch (error) {
                console.error('Failed to copy:', error);
                return false;
            }
        },

        /**
         * Validate memorial data before submission
         */
        validateMemorialData(data) {
            const errors = [];

            if (!data.deceasedName?.trim()) {
                errors.push('Name is required');
            }

            if (!data.birthDate) {
                errors.push('Birth date is required');
            }

            if (!data.passingDate) {
                errors.push('Passing date is required');
            }

            if (data.birthDate && data.passingDate) {
                const birth = new Date(data.birthDate);
                const death = new Date(data.passingDate);
                if (death < birth) {
                    errors.push('Passing date cannot be before birth date');
                }
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        },

        /**
         * Get relationship label
         */
        getRelationshipLabel(relationship) {
            const labels = {
                'parent': 'Parent',
                'child': 'Child',
                'spouse': 'Spouse/Partner',
                'sibling': 'Sibling',
                'grandparent': 'Grandparent',
                'grandchild': 'Grandchild',
                'friend': 'Friend',
                'colleague': 'Colleague',
                'other': 'Other'
            };
            return labels[relationship] || relationship;
        }
    };

    window.MemorialHelpers = MemorialHelpers;
})();
