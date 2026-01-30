/**
 * Forever Fields - Inline Form Validation
 * Real-time validation with accessible feedback
 */

(function() {
    'use strict';

    const validators = {
        required: (value) => value.trim() !== '' || 'This field is required',
        email: (value) => {
            if (!value) return true;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value) || 'Please enter a valid email address';
        },
        minLength: (min) => (value) => {
            if (!value) return true;
            return value.length >= min || `Must be at least ${min} characters`;
        },
        maxLength: (max) => (value) => {
            if (!value) return true;
            return value.length <= max || `Must be no more than ${max} characters`;
        },
        date: (value) => {
            if (!value) return true;
            const date = new Date(value);
            return !isNaN(date.getTime()) || 'Please enter a valid date';
        },
        url: (value) => {
            if (!value) return true;
            try {
                new URL(value);
                return true;
            } catch {
                return 'Please enter a valid URL';
            }
        },
        phone: (value) => {
            if (!value) return true;
            const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
            return phoneRegex.test(value) || 'Please enter a valid phone number';
        }
    };

    function validateField(field) {
        const value = field.value;
        const validationRules = field.dataset.validate?.split(',') || [];
        let errorMessage = null;

        // Check required attribute
        if (field.hasAttribute('required') && !value.trim()) {
            errorMessage = 'This field is required';
        }

        // Check custom validators
        for (const rule of validationRules) {
            if (errorMessage) break;

            const [ruleName, param] = rule.split(':');
            const validator = validators[ruleName];

            if (validator) {
                const validatorFn = param ? validator(param) : validator;
                const result = validatorFn(value);
                if (result !== true) {
                    errorMessage = result;
                }
            }
        }

        // Update UI
        const errorEl = field.parentElement.querySelector('.field-error');
        if (errorMessage) {
            field.classList.add('invalid');
            field.classList.remove('valid');
            field.setAttribute('aria-invalid', 'true');
            if (errorEl) {
                errorEl.textContent = errorMessage;
                errorEl.style.display = 'block';
            }
            return false;
        } else {
            field.classList.remove('invalid');
            field.classList.add('valid');
            field.setAttribute('aria-invalid', 'false');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
            return true;
        }
    }

    function initializeValidation(form) {
        const fields = form.querySelectorAll('input, textarea, select');

        fields.forEach(field => {
            // Create error element if not exists
            if (!field.parentElement.querySelector('.field-error')) {
                const errorEl = document.createElement('span');
                errorEl.className = 'field-error';
                errorEl.setAttribute('role', 'alert');
                errorEl.style.cssText = 'color: #e74c3c; font-size: 0.875rem; display: none; margin-top: 4px;';
                field.parentElement.appendChild(errorEl);
            }

            // Validate on blur
            field.addEventListener('blur', () => validateField(field));

            // Clear error on input
            field.addEventListener('input', () => {
                if (field.classList.contains('invalid')) {
                    validateField(field);
                }
            });
        });

        // Validate all on submit
        form.addEventListener('submit', (e) => {
            let isValid = true;
            fields.forEach(field => {
                if (!validateField(field)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                e.preventDefault();
                const firstInvalid = form.querySelector('.invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }

    // Auto-initialize forms with data-validate attribute
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('form[data-validate]').forEach(initializeValidation);
    });

    // Expose for manual use
    window.InlineValidation = {
        validators,
        validateField,
        initializeValidation
    };
})();
