/**
 * Inline Form Validation Utility
 * Provides real-time validation feedback as users complete fields
 * $0 cost - Pure JavaScript validation
 */

class FormValidator {
    constructor(formElement) {
        this.form = formElement || document;
        this.validators = {
            email: this.validateEmail.bind(this),
            date: this.validateDate.bind(this),
            dateRange: this.validateDateRange.bind(this),
            required: this.validateRequired.bind(this),
            minLength: this.validateMinLength.bind(this),
            maxLength: this.validateMaxLength.bind(this),
            url: this.validateURL.bind(this),
            phone: this.validatePhone.bind(this)
        };
        this.init();
    }

    init() {
        // Add validation styles if not present
        this.addStyles();

        // Find all fields with validation attributes
        const fields = this.form.querySelectorAll('[data-validate], [required], [type="email"], [type="url"], [maxlength]');

        fields.forEach(field => {
            // Add validation on blur (when user leaves field)
            field.addEventListener('blur', () => this.validateField(field));

            // Add validation on input for real-time feedback (after first blur)
            field.addEventListener('input', () => {
                if (field.classList.contains('validated')) {
                    this.validateField(field);
                }
            });

            // Add character counter for fields with maxlength
            if (field.hasAttribute('maxlength') && (field.tagName === 'TEXTAREA' || field.tagName === 'INPUT')) {
                this.addCharacterCounter(field);
            }
        });

        // Special handling for date ranges
        this.setupDateRangeValidation();
    }

    addStyles() {
        if (document.getElementById('formValidationStyles')) {
            return;
        }

        const styles = `
            <style id="formValidationStyles">
            .form-field-wrapper {
                position: relative;
                margin-bottom: 1.5rem;
            }

            .validation-message {
                display: none;
                font-size: 0.875rem;
                margin-top: 0.375rem;
                font-family: var(--font-sans, 'Inter', sans-serif);
            }

            .validation-message.error {
                color: var(--error, #e57373);
                display: block;
            }

            .validation-message.success {
                color: var(--success, #81c784);
                display: block;
            }

            .validation-message.warning {
                color: #ff9800;
                display: block;
            }

            input.error, textarea.error, select.error {
                border-color: var(--error, #e57373) !important;
                background: rgba(229, 115, 115, 0.05);
            }

            input.success, textarea.success {
                border-color: var(--success, #81c784) !important;
            }

            .character-counter {
                font-size: 0.75rem;
                color: var(--gray-light, #b0b0b0);
                text-align: right;
                margin-top: 0.25rem;
                font-family: var(--font-sans, 'Inter', sans-serif);
            }

            .character-counter.warning {
                color: #ff9800;
                font-weight: 500;
            }

            .character-counter.error {
                color: var(--error, #e57373);
                font-weight: 600;
            }

            .required-indicator {
                color: var(--error, #e57373);
                margin-left: 0.25rem;
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    validateField(field) {
        field.classList.add('validated');

        // Clear previous validation
        this.clearValidation(field);

        let isValid = true;
        let message = '';

        // Check required
        if (field.hasAttribute('required') || field.dataset.validate === 'required') {
            const requiredValid = this.validateRequired(field);
            if (!requiredValid.valid) {
                this.showValidation(field, requiredValid.message, 'error');
                return false;
            }
        }

        // Skip other validation if field is empty and not required
        if (!field.value.trim() && !field.hasAttribute('required')) {
            return true;
        }

        // Email validation
        if (field.type === 'email' || field.dataset.validate === 'email') {
            const emailValid = this.validateEmail(field);
            if (!emailValid.valid) {
                this.showValidation(field, emailValid.message, 'error');
                return false;
            }
        }

        // URL validation
        if (field.type === 'url' || field.dataset.validate === 'url') {
            const urlValid = this.validateURL(field);
            if (!urlValid.valid) {
                this.showValidation(field, urlValid.message, 'error');
                return false;
            }
        }

        // Date validation
        if (field.type === 'date' || field.dataset.validate === 'date') {
            const dateValid = this.validateDate(field);
            if (!dateValid.valid) {
                this.showValidation(field, dateValid.message, 'error');
                return false;
            }
        }

        // Custom validation rules
        if (field.dataset.validate && this.validators[field.dataset.validate]) {
            const result = this.validators[field.dataset.validate](field);
            if (!result.valid) {
                this.showValidation(field, result.message, 'error');
                return false;
            }
        }

        // Min/max length
        if (field.minLength > 0 && field.value.length < field.minLength) {
            this.showValidation(field, `Must be at least ${field.minLength} characters`, 'error');
            return false;
        }

        // If we got here, field is valid
        this.showValidation(field, '', 'success');
        return true;
    }

    validateRequired(field) {
        const value = field.value.trim();
        if (!value) {
            return { valid: false, message: 'This field is required' };
        }
        return { valid: true };
    }

    validateEmail(field) {
        const email = field.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }

        return { valid: true };
    }

    validateURL(field) {
        const url = field.value.trim();

        try {
            new URL(url);
            return { valid: true };
        } catch (e) {
            return { valid: false, message: 'Please enter a valid URL' };
        }
    }

    validateDate(field) {
        const date = new Date(field.value);

        if (isNaN(date.getTime())) {
            return { valid: false, message: 'Please enter a valid date' };
        }

        // Check if date is not in the future (for birth/death dates)
        if (field.dataset.validatePast === 'true') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (date > today) {
                return { valid: false, message: 'Date cannot be in the future' };
            }
        }

        return { valid: true };
    }

    validateDateRange(field) {
        // This is called for birth/death date comparisons
        return { valid: true };
    }

    setupDateRangeValidation() {
        const birthDate = this.form.querySelector('#birthDate, [name="birthDate"]');
        const passingDate = this.form.querySelector('#passingDate, [name="passingDate"], #deathDate, [name="deathDate"]');

        if (birthDate && passingDate) {
            const validateRange = () => {
                if (birthDate.value && passingDate.value) {
                    const birth = new Date(birthDate.value);
                    const passing = new Date(passingDate.value);

                    if (birth >= passing) {
                        this.showValidation(passingDate, 'Passing date must be after birth date', 'error');
                        return false;
                    } else {
                        this.clearValidation(passingDate);
                        return true;
                    }
                }
                return true;
            };

            birthDate.addEventListener('change', validateRange);
            passingDate.addEventListener('change', validateRange);
        }
    }

    validatePhone(field) {
        const phone = field.value.trim();
        const phoneRegex = /^[\d\s\-\(\)\+]+$/;

        if (phone.length < 10 || !phoneRegex.test(phone)) {
            return { valid: false, message: 'Please enter a valid phone number' };
        }

        return { valid: true };
    }

    validateMinLength(field) {
        const minLength = parseInt(field.dataset.minlength || field.minLength);
        if (field.value.length < minLength) {
            return { valid: false, message: `Must be at least ${minLength} characters` };
        }
        return { valid: true };
    }

    validateMaxLength(field) {
        const maxLength = parseInt(field.dataset.maxlength || field.maxLength);
        if (field.value.length > maxLength) {
            return { valid: false, message: `Cannot exceed ${maxLength} characters` };
        }
        return { valid: true };
    }

    showValidation(field, message, type) {
        // Remove old classes
        field.classList.remove('error', 'success');

        // Add new class
        if (type) {
            field.classList.add(type);
        }

        // Get or create message element
        let messageEl = field.parentElement.querySelector('.validation-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'validation-message';
            field.parentElement.appendChild(messageEl);
        }

        messageEl.textContent = message;
        messageEl.className = `validation-message ${type}`;
    }

    clearValidation(field) {
        field.classList.remove('error', 'success');
        const messageEl = field.parentElement.querySelector('.validation-message');
        if (messageEl) {
            messageEl.textContent = '';
            messageEl.className = 'validation-message';
        }
    }

    addCharacterCounter(field) {
        const maxLength = field.maxLength;
        if (maxLength <= 0) return;

        let counterEl = field.parentElement.querySelector('.character-counter');
        if (!counterEl) {
            counterEl = document.createElement('div');
            counterEl.className = 'character-counter';
            field.parentElement.appendChild(counterEl);
        }

        const updateCounter = () => {
            const remaining = maxLength - field.value.length;
            const percentage = (field.value.length / maxLength) * 100;

            counterEl.textContent = `${field.value.length} / ${maxLength}`;

            // Color coding
            counterEl.classList.remove('warning', 'error');
            if (percentage >= 100) {
                counterEl.classList.add('error');
            } else if (percentage >= 80) {
                counterEl.classList.add('warning');
            }
        };

        field.addEventListener('input', updateCounter);
        updateCounter();
    }

    // Validate entire form
    validateForm() {
        const fields = this.form.querySelectorAll('[data-validate], [required], [type="email"], [type="url"]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }
}

// Auto-initialize on all forms with data-validate-form attribute
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('[data-validate-form], form');
    forms.forEach(form => {
        new FormValidator(form);
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidator;
}
