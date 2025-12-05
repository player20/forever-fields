/**
 * Forever Fields - Shared JavaScript
 * A healing-focused digital memorial platform
 */

(function() {
    'use strict';

    // =====================================================
    // INITIALIZATION
    // =====================================================

    document.addEventListener('DOMContentLoaded', function() {
        initFadeInAnimations();
        initCursorGlow();
        initSmoothScroll();
        initMobileMenu();
        initModals();
        initToasts();
        initCandleFlowerAnimations();
        initFormValidation();
        initAutoSave();
        initTabNavigation();
        initAccordions();
        initLightbox();
        initCounterAnimations();
    });

    // =====================================================
    // FADE-IN ANIMATIONS (Intersection Observer)
    // =====================================================

    function initFadeInAnimations() {
        const fadeElements = document.querySelectorAll('.fade-in');

        if (fadeElements.length === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        fadeElements.forEach(function(el) {
            observer.observe(el);
        });
    }

    // =====================================================
    // CURSOR GLOW EFFECT
    // =====================================================

    function initCursorGlow() {
        // Only on desktop
        if (window.innerWidth < 768 || 'ontouchstart' in window) return;

        const glow = document.createElement('div');
        glow.className = 'cursor-glow';
        document.body.appendChild(glow);

        let mouseX = 0, mouseY = 0;
        let glowX = 0, glowY = 0;

        document.addEventListener('mousemove', function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animateGlow() {
            glowX += (mouseX - glowX) * 0.1;
            glowY += (mouseY - glowY) * 0.1;
            glow.style.left = glowX + 'px';
            glow.style.top = glowY + 'px';
            requestAnimationFrame(animateGlow);
        }

        animateGlow();
    }

    // =====================================================
    // SMOOTH SCROLL
    // =====================================================

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Close mobile menu if open
                    const mobileMenu = document.querySelector('.mobile-nav');
                    if (mobileMenu && mobileMenu.classList.contains('active')) {
                        closeMobileMenu();
                    }
                }
            });
        });
    }

    // =====================================================
    // MOBILE MENU
    // =====================================================

    let mobileMenuOpen = false;

    function initMobileMenu() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.mobile-nav');
        const overlay = document.querySelector('.mobile-nav-overlay');

        if (!toggle) return;

        toggle.addEventListener('click', function() {
            if (mobileMenuOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });

        if (overlay) {
            overlay.addEventListener('click', closeMobileMenu);
        }

        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileMenuOpen) {
                closeMobileMenu();
            }
        });
    }

    function openMobileMenu() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.mobile-nav');
        const overlay = document.querySelector('.mobile-nav-overlay');

        mobileMenuOpen = true;
        if (toggle) toggle.classList.add('active');
        if (nav) nav.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.mobile-nav');
        const overlay = document.querySelector('.mobile-nav-overlay');

        mobileMenuOpen = false;
        if (toggle) toggle.classList.remove('active');
        if (nav) nav.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Expose globally
    window.openMobileMenu = openMobileMenu;
    window.closeMobileMenu = closeMobileMenu;

    // =====================================================
    // MODALS
    // =====================================================

    function initModals() {
        // Open modal triggers
        document.querySelectorAll('[data-modal-open]').forEach(function(trigger) {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                const modalId = this.getAttribute('data-modal-open');
                openModal(modalId);
            });
        });

        // Close modal triggers
        document.querySelectorAll('[data-modal-close]').forEach(function(trigger) {
            trigger.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) closeModal(modal.id);
            });
        });

        // Close on overlay click
        document.querySelectorAll('.modal').forEach(function(modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal(this.id);
                }
            });
        });

        // Close on escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.active');
                if (openModal) closeModal(openModal.id);
            }
        });
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus first focusable element
        const focusable = modal.querySelector('input, button, textarea, select, a[href]');
        if (focusable) focusable.focus();

        // Dispatch custom event
        modal.dispatchEvent(new CustomEvent('modal:open'));
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Dispatch custom event
        modal.dispatchEvent(new CustomEvent('modal:close'));
    }

    // Expose globally
    window.openModal = openModal;
    window.closeModal = closeModal;

    // =====================================================
    // TOAST NOTIFICATIONS
    // =====================================================

    let toastContainer = null;

    function initToasts() {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    function showToast(message, type = 'info', duration = 4000) {
        if (!toastContainer) initToasts();

        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;

        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;

        toastContainer.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(function() {
            toast.classList.add('visible');
        });

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', function() {
            removeToast(toast);
        });

        // Auto remove
        if (duration > 0) {
            setTimeout(function() {
                removeToast(toast);
            }, duration);
        }

        return toast;
    }

    function removeToast(toast) {
        toast.classList.remove('visible');
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Expose globally
    window.showToast = showToast;

    // =====================================================
    // CANDLE & FLOWER ANIMATIONS
    // =====================================================

    function initCandleFlowerAnimations() {
        // Light a candle
        document.querySelectorAll('[data-action="light-candle"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                lightCandle(this);
            });
        });

        // Leave flowers
        document.querySelectorAll('[data-action="leave-flowers"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                leaveFlowers(this);
            });
        });
    }

    function lightCandle(button) {
        const counter = document.querySelector('[data-candle-count]');
        const container = button.closest('.candle-container') || button.parentElement;

        // Create flame animation
        const flame = document.createElement('div');
        flame.className = 'candle-flame-animation';
        flame.innerHTML = '<span class="flame-icon">&#x1F56F;</span>';
        container.appendChild(flame);

        // Animate
        requestAnimationFrame(function() {
            flame.classList.add('active');
        });

        // Update counter
        if (counter) {
            let count = parseInt(counter.textContent.replace(/,/g, '')) || 0;
            count++;
            counter.textContent = count.toLocaleString();
        }

        // Remove animation element
        setTimeout(function() {
            flame.remove();
        }, 2000);

        // Show toast
        showToast('Your candle has been lit', 'success');

        // Visual feedback on button
        button.classList.add('activated');
        setTimeout(function() {
            button.classList.remove('activated');
        }, 1000);
    }

    function leaveFlowers(button) {
        const counter = document.querySelector('[data-flower-count]');
        const container = button.closest('.flower-container') || button.parentElement;

        // Create petal animation
        for (let i = 0; i < 5; i++) {
            setTimeout(function() {
                const petal = document.createElement('div');
                petal.className = 'flower-petal-animation';
                petal.innerHTML = '<span class="petal-icon">&#x1F33C;</span>';
                petal.style.left = (Math.random() * 100) + '%';
                petal.style.animationDelay = (Math.random() * 0.3) + 's';
                container.appendChild(petal);

                setTimeout(function() {
                    petal.remove();
                }, 3000);
            }, i * 100);
        }

        // Update counter
        if (counter) {
            let count = parseInt(counter.textContent.replace(/,/g, '')) || 0;
            count++;
            counter.textContent = count.toLocaleString();
        }

        // Show toast
        showToast('Your flowers have been placed', 'success');

        // Visual feedback on button
        button.classList.add('activated');
        setTimeout(function() {
            button.classList.remove('activated');
        }, 1000);
    }

    // Expose globally
    window.lightCandle = lightCandle;
    window.leaveFlowers = leaveFlowers;

    // =====================================================
    // FORM VALIDATION
    // =====================================================

    function initFormValidation() {
        document.querySelectorAll('form[data-validate]').forEach(function(form) {
            form.addEventListener('submit', function(e) {
                if (!validateForm(this)) {
                    e.preventDefault();
                }
            });

            // Real-time validation
            form.querySelectorAll('input, textarea, select').forEach(function(field) {
                field.addEventListener('blur', function() {
                    validateField(this);
                });

                field.addEventListener('input', function() {
                    // Clear error on input
                    if (this.classList.contains('invalid')) {
                        clearFieldError(this);
                    }
                });
            });
        });
    }

    function validateForm(form) {
        let isValid = true;

        form.querySelectorAll('input, textarea, select').forEach(function(field) {
            if (!validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            // Focus first invalid field
            const firstInvalid = form.querySelector('.invalid');
            if (firstInvalid) firstInvalid.focus();
        }

        return isValid;
    }

    function validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        const minLength = field.getAttribute('minlength');
        const maxLength = field.getAttribute('maxlength');
        const pattern = field.getAttribute('pattern');

        clearFieldError(field);

        // Required check
        if (required && !value) {
            showFieldError(field, 'This field is required');
            return false;
        }

        // Skip other validations if empty and not required
        if (!value) return true;

        // Email validation
        if (type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                showFieldError(field, 'Please enter a valid email address');
                return false;
            }
        }

        // Min length
        if (minLength && value.length < parseInt(minLength)) {
            showFieldError(field, `Must be at least ${minLength} characters`);
            return false;
        }

        // Max length
        if (maxLength && value.length > parseInt(maxLength)) {
            showFieldError(field, `Must be no more than ${maxLength} characters`);
            return false;
        }

        // Pattern
        if (pattern) {
            const regex = new RegExp(pattern);
            if (!regex.test(value)) {
                showFieldError(field, field.getAttribute('data-pattern-message') || 'Invalid format');
                return false;
            }
        }

        field.classList.add('valid');
        return true;
    }

    function showFieldError(field, message) {
        field.classList.add('invalid');
        field.classList.remove('valid');

        // Remove existing error
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) existingError.remove();

        // Add error message
        const error = document.createElement('span');
        error.className = 'field-error';
        error.textContent = message;
        field.parentElement.appendChild(error);
    }

    function clearFieldError(field) {
        field.classList.remove('invalid', 'valid');
        const error = field.parentElement.querySelector('.field-error');
        if (error) error.remove();
    }

    // Expose globally
    window.validateForm = validateForm;
    window.validateField = validateField;

    // =====================================================
    // AUTO-SAVE FUNCTIONALITY
    // =====================================================

    let autoSaveTimer = null;
    let lastSaveTime = null;

    function initAutoSave() {
        document.querySelectorAll('form[data-autosave]').forEach(function(form) {
            const key = form.getAttribute('data-autosave');

            // Load saved data
            loadFormData(form, key);

            // Save on input
            form.addEventListener('input', function() {
                scheduleAutoSave(form, key);
            });

            // Save on change (for selects, checkboxes)
            form.addEventListener('change', function() {
                scheduleAutoSave(form, key);
            });
        });
    }

    function scheduleAutoSave(form, key) {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);

        updateSaveIndicator('saving');

        autoSaveTimer = setTimeout(function() {
            saveFormData(form, key);
        }, 1000);
    }

    function saveFormData(form, key) {
        const data = {};

        form.querySelectorAll('input, textarea, select').forEach(function(field) {
            if (!field.name) return;

            if (field.type === 'checkbox') {
                data[field.name] = field.checked;
            } else if (field.type === 'radio') {
                if (field.checked) data[field.name] = field.value;
            } else if (field.type === 'file') {
                // Skip file inputs
            } else {
                data[field.name] = field.value;
            }
        });

        try {
            localStorage.setItem('autosave_' + key, JSON.stringify(data));
            lastSaveTime = new Date();
            updateSaveIndicator('saved');
        } catch (e) {
            console.error('Auto-save failed:', e);
            updateSaveIndicator('error');
        }
    }

    function loadFormData(form, key) {
        try {
            const saved = localStorage.getItem('autosave_' + key);
            if (!saved) return;

            const data = JSON.parse(saved);

            Object.keys(data).forEach(function(name) {
                const field = form.querySelector('[name="' + name + '"]');
                if (!field) return;

                if (field.type === 'checkbox') {
                    field.checked = data[name];
                } else if (field.type === 'radio') {
                    const radio = form.querySelector('[name="' + name + '"][value="' + data[name] + '"]');
                    if (radio) radio.checked = true;
                } else {
                    field.value = data[name];
                }
            });

            updateSaveIndicator('restored');
        } catch (e) {
            console.error('Failed to load saved data:', e);
        }
    }

    function clearAutoSave(key) {
        localStorage.removeItem('autosave_' + key);
        updateSaveIndicator('cleared');
    }

    function updateSaveIndicator(status) {
        const indicator = document.querySelector('.autosave-indicator');
        if (!indicator) return;

        const messages = {
            saving: 'Saving...',
            saved: 'Saved',
            error: 'Save failed',
            restored: 'Draft restored',
            cleared: 'Draft cleared'
        };

        indicator.textContent = messages[status] || '';
        indicator.className = 'autosave-indicator ' + status;

        if (status === 'saved' && lastSaveTime) {
            indicator.textContent = 'Saved at ' + lastSaveTime.toLocaleTimeString();
        }
    }

    // Expose globally
    window.saveFormData = saveFormData;
    window.loadFormData = loadFormData;
    window.clearAutoSave = clearAutoSave;

    // =====================================================
    // STEP WIZARD NAVIGATION
    // =====================================================

    window.StepWizard = function(containerId, options) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const defaults = {
            onStepChange: null,
            onComplete: null,
            validateOnNext: true,
            allowSkip: false
        };

        const settings = Object.assign({}, defaults, options);
        const steps = container.querySelectorAll('.wizard-step');
        const progressDots = container.querySelectorAll('.wizard-progress-dot');
        const progressBar = container.querySelector('.wizard-progress-bar-fill');
        let currentStep = 0;

        function init() {
            showStep(0);
            bindNavigation();
        }

        function showStep(index) {
            if (index < 0 || index >= steps.length) return;

            // Hide all steps
            steps.forEach(function(step, i) {
                step.classList.remove('active', 'prev', 'next');
                if (i < index) step.classList.add('prev');
                else if (i > index) step.classList.add('next');
                else step.classList.add('active');
            });

            // Update progress
            progressDots.forEach(function(dot, i) {
                dot.classList.remove('active', 'completed');
                if (i < index) dot.classList.add('completed');
                else if (i === index) dot.classList.add('active');
            });

            if (progressBar) {
                const progress = ((index) / (steps.length - 1)) * 100;
                progressBar.style.width = progress + '%';
            }

            // Update navigation buttons
            updateNavButtons(index);

            // Callback
            if (settings.onStepChange) {
                settings.onStepChange(index, currentStep);
            }

            currentStep = index;

            // Focus first input in step
            const firstInput = steps[index].querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(function() {
                    firstInput.focus();
                }, 300);
            }
        }

        function updateNavButtons(index) {
            const prevBtn = container.querySelector('[data-wizard-prev]');
            const nextBtn = container.querySelector('[data-wizard-next]');
            const submitBtn = container.querySelector('[data-wizard-submit]');

            if (prevBtn) {
                prevBtn.style.display = index === 0 ? 'none' : '';
            }

            if (nextBtn && submitBtn) {
                nextBtn.style.display = index === steps.length - 1 ? 'none' : '';
                submitBtn.style.display = index === steps.length - 1 ? '' : 'none';
            }
        }

        function bindNavigation() {
            container.querySelectorAll('[data-wizard-next]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    goNext();
                });
            });

            container.querySelectorAll('[data-wizard-prev]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    goPrev();
                });
            });

            container.querySelectorAll('[data-wizard-goto]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    const step = parseInt(this.getAttribute('data-wizard-goto'));
                    goTo(step);
                });
            });

            // Progress dot navigation
            progressDots.forEach(function(dot, i) {
                dot.addEventListener('click', function() {
                    if (settings.allowSkip || i <= currentStep) {
                        goTo(i);
                    }
                });
            });
        }

        function validateCurrentStep() {
            if (!settings.validateOnNext) return true;

            const currentStepEl = steps[currentStep];
            const form = currentStepEl.querySelector('form') || currentStepEl.closest('form');

            if (form) {
                let isValid = true;
                currentStepEl.querySelectorAll('input, textarea, select').forEach(function(field) {
                    if (!validateField(field)) {
                        isValid = false;
                    }
                });
                return isValid;
            }

            return true;
        }

        function goNext() {
            if (!validateCurrentStep()) return false;

            if (currentStep < steps.length - 1) {
                showStep(currentStep + 1);
                return true;
            }
            return false;
        }

        function goPrev() {
            if (currentStep > 0) {
                showStep(currentStep - 1);
                return true;
            }
            return false;
        }

        function goTo(index) {
            if (index < currentStep || settings.allowSkip || validateCurrentStep()) {
                showStep(index);
                return true;
            }
            return false;
        }

        function getCurrentStep() {
            return currentStep;
        }

        function getTotalSteps() {
            return steps.length;
        }

        init();

        return {
            next: goNext,
            prev: goPrev,
            goTo: goTo,
            getCurrentStep: getCurrentStep,
            getTotalSteps: getTotalSteps,
            showStep: showStep
        };
    };

    // =====================================================
    // TAB NAVIGATION
    // =====================================================

    function initTabNavigation() {
        document.querySelectorAll('.tabs').forEach(function(tabContainer) {
            const tabs = tabContainer.querySelectorAll('.tab');
            const panels = tabContainer.querySelectorAll('.tab-panel');

            tabs.forEach(function(tab, index) {
                tab.addEventListener('click', function() {
                    // Deactivate all
                    tabs.forEach(function(t) { t.classList.remove('active'); });
                    panels.forEach(function(p) { p.classList.remove('active'); });

                    // Activate selected
                    tab.classList.add('active');
                    if (panels[index]) panels[index].classList.add('active');
                });

                // Keyboard navigation
                tab.addEventListener('keydown', function(e) {
                    let targetIndex = index;

                    if (e.key === 'ArrowRight') {
                        targetIndex = (index + 1) % tabs.length;
                    } else if (e.key === 'ArrowLeft') {
                        targetIndex = (index - 1 + tabs.length) % tabs.length;
                    } else {
                        return;
                    }

                    tabs[targetIndex].click();
                    tabs[targetIndex].focus();
                });
            });
        });
    }

    // =====================================================
    // ACCORDIONS
    // =====================================================

    function initAccordions() {
        document.querySelectorAll('.accordion-header').forEach(function(header) {
            header.addEventListener('click', function() {
                const item = this.parentElement;
                const content = item.querySelector('.accordion-content');
                const isOpen = item.classList.contains('active');

                // Close siblings (if single-open mode)
                const accordion = item.closest('.accordion');
                if (accordion && accordion.hasAttribute('data-single-open')) {
                    accordion.querySelectorAll('.accordion-item.active').forEach(function(openItem) {
                        if (openItem !== item) {
                            openItem.classList.remove('active');
                            openItem.querySelector('.accordion-content').style.maxHeight = null;
                        }
                    });
                }

                // Toggle current
                if (isOpen) {
                    item.classList.remove('active');
                    content.style.maxHeight = null;
                } else {
                    item.classList.add('active');
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });
    }

    // =====================================================
    // LIGHTBOX
    // =====================================================

    let lightboxElement = null;

    function initLightbox() {
        // Create lightbox container
        lightboxElement = document.createElement('div');
        lightboxElement.className = 'lightbox';
        lightboxElement.innerHTML = `
            <div class="lightbox-overlay"></div>
            <div class="lightbox-content">
                <button class="lightbox-close" aria-label="Close">&times;</button>
                <button class="lightbox-prev" aria-label="Previous">&lsaquo;</button>
                <button class="lightbox-next" aria-label="Next">&rsaquo;</button>
                <div class="lightbox-image-container">
                    <img class="lightbox-image" src="" alt="">
                </div>
                <div class="lightbox-caption"></div>
            </div>
        `;
        document.body.appendChild(lightboxElement);

        // Bind gallery triggers
        document.querySelectorAll('[data-lightbox]').forEach(function(trigger) {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                const galleryName = this.getAttribute('data-lightbox');
                const src = this.getAttribute('href') || this.getAttribute('data-src');
                const caption = this.getAttribute('data-caption') || '';
                openLightbox(src, caption, galleryName);
            });
        });

        // Close button
        lightboxElement.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
        lightboxElement.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);

        // Navigation
        lightboxElement.querySelector('.lightbox-prev').addEventListener('click', prevLightboxImage);
        lightboxElement.querySelector('.lightbox-next').addEventListener('click', nextLightboxImage);

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (!lightboxElement.classList.contains('active')) return;

            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowLeft') prevLightboxImage();
            else if (e.key === 'ArrowRight') nextLightboxImage();
        });
    }

    let currentGallery = [];
    let currentGalleryIndex = 0;

    function openLightbox(src, caption, galleryName) {
        const img = lightboxElement.querySelector('.lightbox-image');
        const captionEl = lightboxElement.querySelector('.lightbox-caption');

        // Build gallery array
        if (galleryName) {
            currentGallery = [];
            document.querySelectorAll('[data-lightbox="' + galleryName + '"]').forEach(function(item, index) {
                currentGallery.push({
                    src: item.getAttribute('href') || item.getAttribute('data-src'),
                    caption: item.getAttribute('data-caption') || ''
                });
                if ((item.getAttribute('href') || item.getAttribute('data-src')) === src) {
                    currentGalleryIndex = index;
                }
            });
        } else {
            currentGallery = [{ src: src, caption: caption }];
            currentGalleryIndex = 0;
        }

        img.src = src;
        captionEl.textContent = caption;

        lightboxElement.classList.add('active');
        document.body.style.overflow = 'hidden';

        updateLightboxNav();
    }

    function closeLightbox() {
        lightboxElement.classList.remove('active');
        document.body.style.overflow = '';
    }

    function prevLightboxImage() {
        if (currentGalleryIndex > 0) {
            currentGalleryIndex--;
            showLightboxImage(currentGalleryIndex);
        }
    }

    function nextLightboxImage() {
        if (currentGalleryIndex < currentGallery.length - 1) {
            currentGalleryIndex++;
            showLightboxImage(currentGalleryIndex);
        }
    }

    function showLightboxImage(index) {
        const img = lightboxElement.querySelector('.lightbox-image');
        const captionEl = lightboxElement.querySelector('.lightbox-caption');

        const item = currentGallery[index];
        img.src = item.src;
        captionEl.textContent = item.caption;

        updateLightboxNav();
    }

    function updateLightboxNav() {
        const prevBtn = lightboxElement.querySelector('.lightbox-prev');
        const nextBtn = lightboxElement.querySelector('.lightbox-next');

        prevBtn.style.display = currentGalleryIndex === 0 ? 'none' : '';
        nextBtn.style.display = currentGalleryIndex === currentGallery.length - 1 ? 'none' : '';
    }

    // Expose globally
    window.openLightbox = openLightbox;
    window.closeLightbox = closeLightbox;

    // =====================================================
    // COUNTER ANIMATIONS
    // =====================================================

    function initCounterAnimations() {
        const counters = document.querySelectorAll('[data-counter]');

        if (counters.length === 0) return;

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(function(counter) {
            observer.observe(counter);
        });
    }

    function animateCounter(element) {
        const target = parseInt(element.getAttribute('data-counter')) || 0;
        const duration = parseInt(element.getAttribute('data-counter-duration')) || 2000;
        const start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);

            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target.toLocaleString();
            }
        }

        requestAnimationFrame(update);
    }

    // =====================================================
    // UTILITY FUNCTIONS
    // =====================================================

    // Debounce
    window.debounce = function(func, wait) {
        let timeout;
        return function executedFunction() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    };

    // Throttle
    window.throttle = function(func, limit) {
        let inThrottle;
        return function executedFunction() {
            const context = this;
            const args = arguments;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(function() {
                    inThrottle = false;
                }, limit);
            }
        };
    };

    // Format date
    window.formatDate = function(date, format) {
        const d = new Date(date);
        const options = {
            short: { month: 'short', day: 'numeric', year: 'numeric' },
            long: { month: 'long', day: 'numeric', year: 'numeric' },
            full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
        };
        return d.toLocaleDateString('en-US', options[format] || options.short);
    };

    // Generate unique ID
    window.generateId = function(prefix) {
        return (prefix || 'id') + '_' + Math.random().toString(36).substr(2, 9);
    };

    // Check if element is in viewport
    window.isInViewport = function(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    };

    // Copy to clipboard
    window.copyToClipboard = function(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text).then(function() {
                showToast('Copied to clipboard', 'success');
                return true;
            }).catch(function() {
                showToast('Failed to copy', 'error');
                return false;
            });
        } else {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showToast('Copied to clipboard', 'success');
                return true;
            } catch (e) {
                showToast('Failed to copy', 'error');
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    };

    // =====================================================
    // MODERATION INTEGRATION
    // =====================================================

    /**
     * Get current memorial ID from page
     */
    window.getCurrentMemorialId = function() {
        // Try data attribute first
        const memorialEl = document.querySelector('[data-memorial-id]');
        if (memorialEl) return memorialEl.getAttribute('data-memorial-id');

        // Try URL
        const urlMatch = window.location.pathname.match(/memorial\/([^\/]+)/);
        if (urlMatch) return urlMatch[1];

        // Default for demo
        return 'margaret-carter-1938';
    };

    /**
     * Get current user (demo: from localStorage)
     */
    window.getCurrentUser = function() {
        return localStorage.getItem('ff_current_user') || 'visitor';
    };

    /**
     * Set current user (for demo/testing)
     */
    window.setCurrentUser = function(email) {
        localStorage.setItem('ff_current_user', email);
        showToast('Signed in as ' + email, 'success');
        updateUIForRole();
    };

    /**
     * Update UI elements based on user role
     */
    window.updateUIForRole = function() {
        const memorialId = getCurrentMemorialId();
        const FFMod = window.FFMod || window.ForeverFieldsModeration;

        if (!FFMod) return;

        const role = FFMod.getCurrentUserRole(memorialId);

        // Show/hide elements based on role
        document.querySelectorAll('[data-role-show]').forEach(function(el) {
            const allowedRoles = el.getAttribute('data-role-show').split(',');
            el.style.display = allowedRoles.includes(role) ? '' : 'none';
        });

        document.querySelectorAll('[data-role-hide]').forEach(function(el) {
            const hiddenRoles = el.getAttribute('data-role-hide').split(',');
            el.style.display = hiddenRoles.includes(role) ? 'none' : '';
        });

        // Update action buttons based on permissions
        document.querySelectorAll('[data-action-requires]').forEach(function(el) {
            const action = el.getAttribute('data-action-requires');
            const canDo = FFMod.canPerformAction(memorialId, action);
            el.disabled = !canDo;
            if (!canDo) {
                el.title = 'You do not have permission for this action';
            }
        });

        // Add role badge to header if exists
        const roleBadge = document.querySelector('.user-role-badge');
        if (roleBadge) {
            const roleLabels = {
                owner: 'Owner',
                editor: 'Editor',
                viewer: 'Viewer',
                visitor: 'Visitor'
            };
            roleBadge.textContent = roleLabels[role] || 'Visitor';
            roleBadge.className = 'user-role-badge role-' + role;
        }
    };

    /**
     * Handle photo upload with moderation
     */
    window.handlePhotoUpload = async function(file, memorialId) {
        const FFMod = window.FFMod || window.ForeverFieldsModeration;
        if (!FFMod) {
            console.error('Moderation module not loaded');
            return false;
        }

        memorialId = memorialId || getCurrentMemorialId();
        const currentUser = getCurrentUser();
        const role = FFMod.getCurrentUserRole(memorialId);

        // Check permissions
        if (!FFMod.canPerformAction(memorialId, 'addPhoto')) {
            showToast('You do not have permission to add photos.', 'warning');
            return false;
        }

        showToast('Checking image...', 'info');

        // Run safety check
        const check = await FFMod.checkImage(file);

        if (!check.passed) {
            FFMod.showRejection(check.reason);
            return false;
        }

        // Create content object
        const content = {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            dataUrl: await fileToDataUrl(file),
            uploadedAt: new Date().toISOString()
        };

        // Owner content is auto-approved
        if (role === 'owner') {
            // Add directly to approved content
            const contentKey = 'ff_memorial_' + memorialId + '_content';
            const existing = JSON.parse(localStorage.getItem(contentKey)) || { photos: [], memories: [], voices: [], guestbook: [] };
            existing.photos.push({
                id: generateId('photo'),
                ...content,
                addedBy: currentUser,
                status: 'approved'
            });
            localStorage.setItem(contentKey, JSON.stringify(existing));
            showToast('Photo added successfully!', 'success');
        } else {
            // Add to pending queue
            FFMod.addToPendingQueue(memorialId, 'photo', content, currentUser);
            showToast('Photo submitted! It will appear once the family approves it.', 'success');
        }

        return true;
    };

    /**
     * Handle text submission with moderation (memories, guestbook)
     */
    window.handleTextSubmission = function(text, type, memorialId, authorName) {
        const FFMod = window.FFMod || window.ForeverFieldsModeration;
        if (!FFMod) {
            console.error('Moderation module not loaded');
            return false;
        }

        memorialId = memorialId || getCurrentMemorialId();
        const currentUser = getCurrentUser();
        const role = FFMod.getCurrentUserRole(memorialId);

        // Determine required action
        const actionMap = {
            memory: 'addMemory',
            guestbook: 'leaveGuestbook',
            voice: 'addVoice'
        };
        const requiredAction = actionMap[type] || 'addMemory';

        if (!FFMod.canPerformAction(memorialId, requiredAction)) {
            showToast('You do not have permission for this action.', 'warning');
            return false;
        }

        // Run text safety check
        const check = FFMod.checkText(text);

        if (!check.passed) {
            FFMod.showRejection(check.reason);
            return false;
        }

        const content = {
            text: text,
            authorName: authorName || 'Anonymous',
            submittedAt: new Date().toISOString()
        };

        // Owner content is auto-approved
        if (role === 'owner') {
            const contentKey = 'ff_memorial_' + memorialId + '_content';
            const existing = JSON.parse(localStorage.getItem(contentKey)) || { photos: [], memories: [], voices: [], guestbook: [] };
            const targetArray = type === 'guestbook' ? existing.guestbook : existing.memories;
            targetArray.push({
                id: generateId(type),
                ...content,
                addedBy: currentUser,
                status: 'approved'
            });
            localStorage.setItem(contentKey, JSON.stringify(existing));
            showToast('Your ' + type + ' has been added.', 'success');
        } else {
            FFMod.addToPendingQueue(memorialId, type, content, currentUser);
            showToast('Thank you for sharing. Your message will appear once the family approves it.', 'info');
        }

        return true;
    };

    /**
     * Handle voice note with moderation
     */
    window.handleVoiceSubmission = async function(file, durationSeconds, memorialId) {
        const FFMod = window.FFMod || window.ForeverFieldsModeration;
        if (!FFMod) {
            console.error('Moderation module not loaded');
            return false;
        }

        memorialId = memorialId || getCurrentMemorialId();
        const currentUser = getCurrentUser();
        const role = FFMod.getCurrentUserRole(memorialId);

        if (!FFMod.canPerformAction(memorialId, 'addVoice')) {
            showToast('You do not have permission to add voice notes.', 'warning');
            return false;
        }

        // Run voice safety check
        const check = FFMod.checkVoiceNote(file, durationSeconds);

        if (!check.passed) {
            FFMod.showRejection(check.reason);
            return false;
        }

        const content = {
            fileName: file.name,
            fileSize: file.size,
            duration: durationSeconds,
            dataUrl: await fileToDataUrl(file),
            submittedAt: new Date().toISOString()
        };

        if (role === 'owner') {
            const contentKey = 'ff_memorial_' + memorialId + '_content';
            const existing = JSON.parse(localStorage.getItem(contentKey)) || { photos: [], memories: [], voices: [], guestbook: [] };
            existing.voices.push({
                id: generateId('voice'),
                ...content,
                addedBy: currentUser,
                status: 'approved'
            });
            localStorage.setItem(contentKey, JSON.stringify(existing));
            showToast('Voice memory added successfully!', 'success');
        } else {
            FFMod.addToPendingQueue(memorialId, 'voice', content, currentUser);
            showToast('Voice memory submitted! It will appear once the family approves it.', 'success');
        }

        return true;
    };

    /**
     * Convert file to data URL
     */
    function fileToDataUrl(file) {
        return new Promise(function(resolve, reject) {
            const reader = new FileReader();
            reader.onload = function() { resolve(reader.result); };
            reader.onerror = function() { reject(reader.error); };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Render pending items in dashboard
     */
    window.renderPendingQueue = function(containerId, memorialId) {
        const FFMod = window.FFMod || window.ForeverFieldsModeration;
        if (!FFMod) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        memorialId = memorialId || getCurrentMemorialId();
        const pending = FFMod.getPendingQueue(memorialId);
        const emptyState = document.getElementById('pendingEmpty');

        if (pending.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        const typeIcons = {
            photo: '📷',
            memory: '📝',
            voice: '🎤',
            guestbook: '✍️'
        };

        const typeLabels = {
            photo: 'Photo',
            memory: 'Memory',
            voice: 'Voice Note',
            guestbook: 'Guestbook Message'
        };

        container.innerHTML = pending.map(function(item) {
            const timeAgo = getTimeAgo(new Date(item.submittedAt));
            const preview = getItemPreview(item);

            return `
                <div class="pending-card" data-pending-id="${item.id}">
                    <div class="pending-card-preview">
                        ${preview}
                    </div>
                    <div class="pending-card-meta">
                        <div class="pending-type-badge">${typeIcons[item.type] || '📄'} ${typeLabels[item.type] || item.type}</div>
                        <div class="pending-submitter">From: ${item.submittedBy || 'Anonymous'}</div>
                        <div class="pending-date">Submitted ${timeAgo}</div>
                        ${item.isReport ? '<div class="pending-reported">⚠️ Reported by a visitor</div>' : ''}
                    </div>
                    <div class="pending-card-actions">
                        <button class="btn btn-approve" onclick="approveItem('${memorialId}', '${item.id}')">
                            ✓ Approve
                        </button>
                        <button class="btn btn-reject" onclick="rejectItem('${memorialId}', '${item.id}')">
                            ✗ Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    };

    /**
     * Get preview HTML for pending item
     */
    function getItemPreview(item) {
        if (item.type === 'photo' && item.content.dataUrl) {
            return '<img src="' + item.content.dataUrl + '" alt="Pending photo">';
        } else if (item.type === 'memory' || item.type === 'guestbook') {
            const text = item.content.text || '';
            const preview = text.length > 150 ? text.substring(0, 150) + '...' : text;
            return '<div class="memory-preview">"' + preview + '"</div>';
        } else if (item.type === 'voice') {
            return '<div class="voice-preview">🎤 ' + Math.round(item.content.duration || 0) + 's voice note</div>';
        }
        return '<div class="generic-preview">Content pending review</div>';
    }

    /**
     * Get human-readable time ago
     */
    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
        if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
        return date.toLocaleDateString();
    }

    /**
     * Approve item wrapper
     */
    window.approveItem = function(memorialId, itemId) {
        const FFMod = window.FFMod || window.ForeverFieldsModeration;
        if (FFMod) {
            FFMod.approveItem(memorialId, itemId);
            renderPendingQueue('pendingItems', memorialId);
            updatePendingBadge(memorialId);
        }
    };

    /**
     * Reject item wrapper
     */
    window.rejectItem = function(memorialId, itemId) {
        const FFMod = window.FFMod || window.ForeverFieldsModeration;
        if (FFMod) {
            FFMod.rejectItem(memorialId, itemId);
            renderPendingQueue('pendingItems', memorialId);
            updatePendingBadge(memorialId);
        }
    };

    /**
     * Update pending count badge
     */
    window.updatePendingBadge = function(memorialId) {
        const FFMod = window.FFMod || window.ForeverFieldsModeration;
        if (!FFMod) return;

        const pending = FFMod.getPendingQueue(memorialId || getCurrentMemorialId());
        const badge = document.getElementById('pendingCount');

        if (badge) {
            badge.textContent = pending.length;
            badge.style.display = pending.length > 0 ? '' : 'none';
        }
    };

    /**
     * Render legacy contacts
     */
    window.renderLegacyContacts = function() {
        const FFMod = window.FFMod || window.ForeverFieldsModeration;
        if (!FFMod) return;

        const contacts = FFMod.getLegacyContacts();
        const container = document.getElementById('legacyContactsList');
        const addSection = document.getElementById('legacyContactAdd');
        const limitNote = document.getElementById('legacyLimitNote');

        if (!container) return;

        const relationLabels = {
            spouse: 'Spouse/Partner',
            child: 'Child',
            sibling: 'Sibling',
            friend: 'Trusted Friend',
            other: 'Other'
        };

        container.innerHTML = contacts.map(function(contact) {
            return `
                <div class="legacy-contact-item">
                    <div class="legacy-contact-info">
                        <span class="legacy-contact-name">${contact.name}</span>
                        <span class="legacy-contact-email">${contact.email}</span>
                        <span class="legacy-contact-relation">${relationLabels[contact.relation] || contact.relation}</span>
                    </div>
                    <button class="invite-remove-btn" onclick="removeLegacyContact('${contact.id}')" title="Remove">×</button>
                </div>
            `;
        }).join('');

        const maxContacts = 3;
        if (addSection) {
            addSection.style.display = contacts.length >= maxContacts ? 'none' : 'flex';
        }
        if (limitNote) {
            limitNote.textContent = contacts.length >= maxContacts
                ? 'Maximum legacy contacts reached.'
                : 'You can add ' + (maxContacts - contacts.length) + ' more legacy contact(s).';
        }
    };

    /**
     * Add legacy contact wrapper
     */
    window.addLegacyContact = function() {
        const email = document.getElementById('legacyContactEmail');
        const name = document.getElementById('legacyContactName');
        const relation = document.getElementById('legacyContactRelation');

        if (!email || !name || !relation) return;

        const FFMod = window.FFMod || window.ForeverFieldsModeration;
        if (FFMod) {
            const success = FFMod.addLegacyContact(email.value, name.value, relation.value);
            if (success) {
                email.value = '';
                name.value = '';
                relation.value = '';
                renderLegacyContacts();
            }
        }
    };

    /**
     * Remove legacy contact wrapper
     */
    window.removeLegacyContact = function(id) {
        if (!confirm('Remove this legacy contact?')) return;

        const FFMod = window.FFMod || window.ForeverFieldsModeration;
        if (FFMod) {
            FFMod.removeLegacyContact(id);
            renderLegacyContacts();
        }
    };

    /**
     * Dashboard tab switching
     */
    window.initDashboardTabs = function() {
        const tabs = document.querySelectorAll('.dashboard-tab');
        const sections = document.querySelectorAll('.dashboard-section');

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');

                // Update active tab
                tabs.forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');

                // Show corresponding section
                sections.forEach(function(section) {
                    const sectionId = section.id.replace('Section', '');
                    section.style.display = sectionId === targetTab ? 'block' : 'none';
                });

                // Render content for active tab
                if (targetTab === 'pending') {
                    renderPendingQueue('pendingItems');
                } else if (targetTab === 'settings') {
                    renderLegacyContacts();
                }
            });
        });
    };

    /**
     * Invite system for create page
     */
    window.initInviteSystem = function() {
        const invites = [];

        window.addInvite = function() {
            const emailInput = document.getElementById('inviteEmail');
            const roleSelect = document.getElementById('inviteRole');

            if (!emailInput || !roleSelect) return;

            const email = emailInput.value.trim();
            const role = roleSelect.value;

            if (!email) {
                showToast('Please enter an email address.', 'warning');
                return;
            }

            // Simple email validation
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showToast('Please enter a valid email address.', 'warning');
                return;
            }

            // Check for duplicate
            if (invites.some(function(i) { return i.email === email; })) {
                showToast('This email has already been invited.', 'warning');
                return;
            }

            invites.push({
                id: generateId('invite'),
                email: email,
                role: role,
                addedAt: new Date().toISOString()
            });

            emailInput.value = '';
            renderInviteList();
            showToast(email + ' has been invited as ' + role + '.', 'success');
        };

        window.removeInvite = function(id) {
            const index = invites.findIndex(function(i) { return i.id === id; });
            if (index > -1) {
                invites.splice(index, 1);
                renderInviteList();
            }
        };

        window.getInvites = function() {
            return invites;
        };

        function renderInviteList() {
            const container = document.getElementById('inviteList');
            if (!container) return;

            const roleLabels = {
                viewer: 'Viewer',
                editor: 'Editor'
            };

            container.innerHTML = invites.map(function(invite) {
                return `
                    <div class="invite-item">
                        <span class="invite-item-email">${invite.email}</span>
                        <span class="invite-item-role">${roleLabels[invite.role] || invite.role}</span>
                        <button class="invite-remove-btn" onclick="removeInvite('${invite.id}')" title="Remove">×</button>
                    </div>
                `;
            }).join('');
        }
    };

    // Initialize moderation UI when page loads
    document.addEventListener('DOMContentLoaded', function() {
        // Update UI based on current user role
        setTimeout(updateUIForRole, 100);

        // Initialize dashboard tabs if present
        if (document.querySelector('.dashboard-tab')) {
            initDashboardTabs();
        }

        // Initialize invite system if on create page
        if (document.getElementById('inviteEmail')) {
            initInviteSystem();
        }

        // Update pending badge if present
        if (document.getElementById('pendingCount')) {
            updatePendingBadge();
        }

        // Render legacy contacts if on settings page
        if (document.getElementById('legacyContactsList')) {
            renderLegacyContacts();
        }
    });

})();
