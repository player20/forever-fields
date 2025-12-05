/**
 * Forever Fields - Pet Mode Module
 * Handles pet memorial detection and pet-specific theming
 */

(function() {
    'use strict';

    const PetMode = {
        // Common pet names for detection
        COMMON_PET_NAMES: [
            // Dogs
            'max', 'bella', 'charlie', 'lucy', 'cooper', 'daisy', 'bailey', 'sadie', 'lola', 'buddy',
            'molly', 'stella', 'tucker', 'bear', 'zoey', 'duke', 'maggie', 'jack', 'sophie', 'riley',
            'chloe', 'buster', 'penny', 'rocky', 'ginger', 'shadow', 'pepper', 'oliver', 'ruby', 'milo',
            // Cats
            'luna', 'oliver', 'leo', 'milo', 'charlie', 'simba', 'max', 'jack', 'loki', 'tiger',
            'smokey', 'shadow', 'kitty', 'mittens', 'oreo', 'whiskers', 'felix', 'chloe', 'sophie', 'misty',
            // Other pets
            'snowball', 'midnight', 'patches', 'peanut', 'cookie', 'fluffy', 'angel', 'princess', 'buddy', 'gizmo'
        ],

        // localStorage key
        STORAGE_KEY: 'ff_pet_mode_dismissed',

        // Current state
        isPetMode: false,
        hasPrompted: false,

        // =====================================================
        // INITIALIZATION
        // =====================================================

        init() {
            console.log('[PetMode] Initializing...');

            // Check if on wizard page
            const nameInput = document.getElementById('deceasedName');
            if (nameInput) {
                this.initWizardDetection(nameInput);
            }

            // Check if on memorial page
            const memorialElement = document.querySelector('[data-is-pet]');
            if (memorialElement) {
                const isPet = memorialElement.dataset.isPet === 'true';
                if (isPet) {
                    this.enablePetMode();
                }
            }

            console.log('[PetMode] Initialized');
        },

        // =====================================================
        // WIZARD DETECTION
        // =====================================================

        initWizardDetection(nameInput) {
            // Debounced name check
            let timeout;
            nameInput.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.checkForPetName(nameInput.value);
                }, 1000); // Wait 1 second after user stops typing
            });
        },

        checkForPetName(name) {
            if (this.hasPrompted || !name) return;

            const nameLower = name.toLowerCase().trim();
            const isPetName = this.COMMON_PET_NAMES.some(petName => {
                // Check if the input matches common pet names
                return nameLower === petName || nameLower.startsWith(petName + ' ');
            });

            if (isPetName) {
                // Check if user previously dismissed
                const dismissed = localStorage.getItem(this.STORAGE_KEY);
                if (dismissed) {
                    const dismissedTime = parseInt(dismissed, 10);
                    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

                    // Only show again after 30 days
                    if (daysSinceDismissed < 30) {
                        return;
                    }
                }

                this.showPetModePrompt(name);
            }
        },

        showPetModePrompt(name) {
            this.hasPrompted = true;

            const modal = document.createElement('div');
            modal.className = 'modal pet-mode-prompt-modal';
            modal.style.display = 'flex';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content pet-mode-prompt-content">
                    <div class="pet-mode-prompt-icon">🐾</div>
                    <h3 class="modal-title">Creating a Pet Memorial?</h3>
                    <p class="pet-mode-prompt-text">
                        We noticed you're creating a memorial for <strong>${this.escapeHtml(name)}</strong>.
                        Would you like to use our pet memorial theme?
                    </p>
                    <ul class="pet-mode-features">
                        <li>🐾 Paw print accents</li>
                        <li>🌈 "Rainbow Bridge" wording</li>
                        <li>🎵 Pet-friendly song suggestions</li>
                        <li>🕯️ Pet candle animations</li>
                    </ul>
                    <div class="pet-mode-prompt-actions">
                        <button class="btn btn-primary" id="petModeYes">Yes, Pet Memorial</button>
                        <button class="btn btn-secondary" id="petModeNo">No, Human Memorial</button>
                    </div>
                    <p class="pet-mode-prompt-note">
                        You can change this later in memorial settings
                    </p>
                </div>
            `;

            document.body.appendChild(modal);

            // Yes button
            document.getElementById('petModeYes').addEventListener('click', () => {
                this.enablePetMode();
                this.closePrompt(modal);
                this.showToast('🐾 Pet memorial mode enabled');
            });

            // No button
            document.getElementById('petModeNo').addEventListener('click', () => {
                localStorage.setItem(this.STORAGE_KEY, Date.now().toString());
                this.closePrompt(modal);
            });

            // Close on overlay click
            modal.querySelector('.modal-overlay').addEventListener('click', () => {
                localStorage.setItem(this.STORAGE_KEY, Date.now().toString());
                this.closePrompt(modal);
            });
        },

        closePrompt(modal) {
            modal.style.display = 'none';
            setTimeout(() => {
                modal.remove();
            }, 300);
        },

        // =====================================================
        // PET MODE ACTIVATION
        // =====================================================

        enablePetMode() {
            this.isPetMode = true;
            document.body.classList.add('pet-mode');
            localStorage.setItem('ff_pet_mode_active', 'true');

            // Update form if on wizard
            this.updateWizardForPetMode();

            // Update memorial if on memorial page
            this.updateMemorialForPetMode();

            // Dispatch event for other modules
            document.dispatchEvent(new CustomEvent('petModeChanged', {
                detail: { enabled: true }
            }));

            console.log('[PetMode] Pet mode enabled');
        },

        disablePetMode() {
            this.isPetMode = false;
            document.body.classList.remove('pet-mode');
            localStorage.removeItem('ff_pet_mode_active');

            // Update form if on wizard
            this.updateWizardForHumanMode();

            // Update memorial if on memorial page
            this.updateMemorialForHumanMode();

            // Dispatch event for other modules
            document.dispatchEvent(new CustomEvent('petModeChanged', {
                detail: { enabled: false }
            }));

            console.log('[PetMode] Pet mode disabled');
        },

        togglePetMode() {
            if (this.isPetMode) {
                this.disablePetMode();
            } else {
                this.enablePetMode();
            }
        },

        // =====================================================
        // WIZARD UPDATES
        // =====================================================

        updateWizardForPetMode() {
            // Update label text
            this.updateLabel('birthDate', 'Gotcha Day (Adoption Date)');
            this.updateLabel('passingDate', 'Rainbow Bridge Date');
            this.updatePlaceholder('birthDate', 'When did they join your family?');
            this.updatePlaceholder('passingDate', 'When did they cross the Rainbow Bridge?');

            // Update section headers if needed
            const basicInfoHeader = document.querySelector('[data-step="1"] h2');
            if (basicInfoHeader && basicInfoHeader.textContent.includes('About')) {
                basicInfoHeader.innerHTML = '🐾 About Your Beloved Pet';
            }

            // Add pet mode indicator to form
            const isPetInput = document.getElementById('isPet');
            if (isPetInput) {
                isPetInput.value = 'true';
            } else {
                // Create hidden input if it doesn't exist
                const form = document.querySelector('form');
                if (form) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.id = 'isPet';
                    input.name = 'isPet';
                    input.value = 'true';
                    form.appendChild(input);
                }
            }
        },

        updateWizardForHumanMode() {
            // Restore original labels
            this.updateLabel('birthDate', 'Date of Birth');
            this.updateLabel('passingDate', 'Date of Passing');
            this.updatePlaceholder('birthDate', 'MM/DD/YYYY');
            this.updatePlaceholder('passingDate', 'MM/DD/YYYY');

            // Restore section header
            const basicInfoHeader = document.querySelector('[data-step="1"] h2');
            if (basicInfoHeader && basicInfoHeader.textContent.includes('Pet')) {
                basicInfoHeader.textContent = 'Basic Information';
            }

            // Update hidden input
            const isPetInput = document.getElementById('isPet');
            if (isPetInput) {
                isPetInput.value = 'false';
            }
        },

        // =====================================================
        // MEMORIAL PAGE UPDATES
        // =====================================================

        updateMemorialForPetMode() {
            // Update date labels
            const birthDateLabel = document.querySelector('.hero-dates');
            if (birthDateLabel) {
                const dateText = birthDateLabel.textContent;
                birthDateLabel.textContent = dateText
                    .replace('Born:', 'Gotcha Day:')
                    .replace('Passed:', 'Rainbow Bridge:');
            }

            // Add paw prints to candle section
            this.addPawPrintsToCandles();
        },

        updateMemorialForHumanMode() {
            // Restore original date labels
            const birthDateLabel = document.querySelector('.hero-dates');
            if (birthDateLabel) {
                const dateText = birthDateLabel.textContent;
                birthDateLabel.textContent = dateText
                    .replace('Gotcha Day:', 'Born:')
                    .replace('Rainbow Bridge:', 'Passed:');
            }

            // Remove paw prints
            this.removePawPrintsFromCandles();
        },

        addPawPrintsToCandles() {
            // This will be handled by CSS with .pet-mode class
        },

        removePawPrintsFromCandles() {
            // This will be handled by removing .pet-mode class
        },

        // =====================================================
        // UTILITY FUNCTIONS
        // =====================================================

        updateLabel(inputId, newLabel) {
            const input = document.getElementById(inputId);
            if (input) {
                const label = document.querySelector(`label[for="${inputId}"]`);
                if (label) {
                    // Preserve any child elements (like .optional span)
                    const optional = label.querySelector('.optional');
                    label.textContent = newLabel;
                    if (optional) {
                        label.appendChild(optional);
                    }
                }
            }
        },

        updatePlaceholder(inputId, newPlaceholder) {
            const input = document.getElementById(inputId);
            if (input) {
                input.placeholder = newPlaceholder;
            }
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        showToast(message) {
            // Use global toast if available
            if (typeof window.showToast === 'function') {
                window.showToast('🐾', message);
            } else {
                // Fallback to console
                console.log('[PetMode]', message);
            }
        },

        // =====================================================
        // PUBLIC API
        // =====================================================

        isPetModeEnabled() {
            return this.isPetMode;
        },

        setPetMode(enabled) {
            if (enabled) {
                this.enablePetMode();
            } else {
                this.disablePetMode();
            }
        }
    };

    // =====================================================
    // INITIALIZATION ON DOM READY
    // =====================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => PetMode.init());
    } else {
        PetMode.init();
    }

    // Expose globally for other modules
    window.PetMode = PetMode;
    window.ForeverFieldsPetMode = PetMode;

})();
