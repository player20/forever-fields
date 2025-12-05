/**
 * Forever Fields - Memorial Page Controller
 * Handles all memorial page interactions and data loading
 */

(function() {
    'use strict';

    // Initialize API client (uses ApiConfig.getApiUrl() automatically)
    const api = new ForeverFieldsAPI();

    // State
    let currentMemorial = null;
    let currentCandles = [];

    // DOM Elements
    const elements = {
        loading: document.getElementById('loading'),
        error: document.getElementById('error'),
        errorMessage: document.getElementById('error-message'),
        memorialContent: document.getElementById('memorial-content'),

        // Header
        memorialPortrait: document.getElementById('memorial-portrait'),
        memorialName: document.getElementById('memorial-name'),
        birthDate: document.getElementById('birth-date'),
        deathDate: document.getElementById('death-date'),
        memorialAge: document.getElementById('memorial-age'),
        songContainer: document.getElementById('song-container'),
        playSongBtn: document.getElementById('play-song-btn'),
        songTitle: document.getElementById('song-title'),

        // Sections
        bioSection: document.getElementById('bio-section'),
        memorialBio: document.getElementById('memorial-bio'),
        restingSection: document.getElementById('resting-section'),
        restingType: document.getElementById('resting-type'),
        restingLocation: document.getElementById('resting-location'),
        socialSection: document.getElementById('social-section'),
        socialLinks: document.getElementById('social-links'),

        // Candles
        candlesSection: document.getElementById('candles-section'),
        candlesCount: document.getElementById('candles-count'),
        candlesGrid: document.getElementById('candles-grid'),

        // Photos
        photosSection: document.getElementById('photos-section'),
        photosCount: document.getElementById('photos-count'),
        photosGallery: document.getElementById('photos-gallery'),

        // Time Capsules
        timeCapsulesSection: document.getElementById('time-capsules-section'),
        timeCapsulesGrid: document.getElementById('time-capsules-grid'),

        // Modals
        candleModal: document.getElementById('candle-modal'),
        candleForm: document.getElementById('candle-form'),
        memoryModal: document.getElementById('memory-modal'),
        memoryForm: document.getElementById('memory-form'),

        // Toast
        toast: document.getElementById('toast'),
        toastIcon: document.getElementById('toast-icon'),
        toastMessage: document.getElementById('toast-message'),
    };

    // ============================================
    // INITIALIZATION
    // ============================================

    async function init() {
        // Get memorial ID from URL params or path
        const memorialId = getMemorialId();

        if (!memorialId) {
            showError('No memorial ID provided');
            return;
        }

        try {
            // Load memorial data
            await loadMemorial(memorialId);

            // Load candles
            await loadCandles(memorialId);

            // Load photos
            await loadPhotos(memorialId);

            // Load time capsules
            await loadTimeCapsules(memorialId);

            // Setup event listeners
            setupEventListeners();

            // Hide loading, show content
            elements.loading.style.display = 'none';
            elements.memorialContent.style.display = 'block';
        } catch (error) {
            console.error('Error loading memorial:', error);

            if (error instanceof APIError) {
                if (error.isForbidden()) {
                    showError('This memorial is private');
                } else if (error.isNotFound()) {
                    showError('Memorial not found');
                } else {
                    showError(error.message);
                }
            } else {
                showError('Failed to load memorial. Please try again.');
            }
        }
    }

    /**
     * Get memorial ID from URL
     */
    function getMemorialId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id') || params.get('memorial');
    }

    /**
     * Load memorial data from API
     */
    async function loadMemorial(id) {
        const response = await api.getMemorial(id);
        currentMemorial = response.memorial;

        // Update page title
        document.title = `${currentMemorial.deceasedName} | Forever Fields`;
        document.getElementById('memorial-title').textContent = document.title;

        // Render memorial
        renderMemorial(currentMemorial);
    }

    /**
     * Render memorial data to page
     */
    function renderMemorial(memorial) {
        // Portrait
        if (memorial.portraitUrl) {
            elements.memorialPortrait.innerHTML = `<img src="${memorial.portraitUrl}" alt="${memorial.deceasedName}">`;
        } else {
            const emoji = memorial.isPet ? '🐾' : '🌿';
            elements.memorialPortrait.innerHTML = `<span class="portrait-placeholder">${emoji}</span>`;
        }

        // Name
        elements.memorialName.textContent = memorial.deceasedName;

        // Dates
        if (memorial.birthDate) {
            elements.birthDate.textContent = formatDate(memorial.birthDate);
        }
        if (memorial.deathDate) {
            elements.deathDate.textContent = formatDate(memorial.deathDate);
        }

        // Age
        if (memorial.birthDate && memorial.deathDate) {
            const age = calculateAge(memorial.birthDate, memorial.deathDate);
            const label = memorial.isPet ? 'years loved' : 'years';
            elements.memorialAge.textContent = `${age} ${label}`;
            elements.memorialAge.style.display = 'block';
        }

        // Biography
        if (memorial.shortBio) {
            elements.memorialBio.textContent = memorial.shortBio;
            elements.bioSection.style.display = 'block';
        }

        // Resting place
        if (memorial.restingType || memorial.restingLocation) {
            if (memorial.restingType) {
                elements.restingType.textContent = capitalizeFirst(memorial.restingType);
            }
            if (memorial.restingLocation) {
                const location = memorial.restingLocation;
                let locationText = location.name || location.address || '';
                if (location.address && location.name) {
                    locationText = `${location.name}, ${location.address}`;
                }
                elements.restingLocation.textContent = locationText;
            }
            elements.restingSection.style.display = 'block';
        }

        // Social links
        if (memorial.socialLinks) {
            const links = memorial.socialLinks;
            let socialHTML = '';

            if (links.facebook) {
                socialHTML += `<a href="${links.facebook}" target="_blank" class="social-link">📘 Facebook</a>`;
            }
            if (links.instagram) {
                socialHTML += `<a href="${links.instagram}" target="_blank" class="social-link">📷 Instagram</a>`;
            }
            if (links.tiktok) {
                socialHTML += `<a href="${links.tiktok}" target="_blank" class="social-link">🎵 TikTok</a>`;
            }

            if (socialHTML) {
                elements.socialLinks.innerHTML = socialHTML;
                elements.socialSection.style.display = 'block';
            }
        }

        // Song
        if (memorial.songYoutubeUrl || memorial.songSpotifyUri) {
            const songUrl = memorial.songYoutubeUrl || memorial.songSpotifyUri;
            const songName = extractSongName(songUrl);
            elements.songTitle.textContent = songName || 'Their Favorite Song';
            elements.songContainer.style.display = 'block';

            // Store song URL for playback
            currentMemorial.songUrl = songUrl;
            currentMemorial.songPlatform = detectSongPlatform(songUrl);
        }
    }

    /**
     * Load candles for memorial
     */
    async function loadCandles(memorialId) {
        try {
            const response = await api.getCandles(memorialId);
            currentCandles = response.candles || [];

            if (currentCandles.length > 0) {
                renderCandles(currentCandles);
                elements.candlesSection.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading candles:', error);
        }
    }

    /**
     * Render candles to page
     */
    function renderCandles(candles) {
        elements.candlesCount.textContent = candles.length;

        const candlesHTML = candles.map(candle => `
            <div class="candle-card">
                <div class="candle-header">
                    <span class="candle-flame">🕯️</span>
                    <span class="candle-name">${escapeHTML(candle.name || 'Anonymous')}</span>
                </div>
                <div class="candle-date">${timeAgo(candle.createdAt)}</div>
                ${candle.message ? `<p class="candle-message">"${escapeHTML(candle.message)}"</p>` : ''}
            </div>
        `).join('');

        elements.candlesGrid.innerHTML = candlesHTML;
    }

    /**
     * Load time capsules for memorial
     */
    async function loadTimeCapsules(memorialId) {
        try {
            const response = await api.getTimeCapsules(memorialId);
            const capsules = response.timeCapsules || [];

            if (capsules.length > 0) {
                renderTimeCapsules(capsules);
                elements.timeCapsulesSection.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading time capsules:', error);
        }
    }

    /**
     * Render time capsules to page
     */
    function renderTimeCapsules(capsules) {
        const capsulesHTML = capsules.map(capsule => `
            <div class="time-capsule-card">
                <div class="capsule-header">
                    <span class="capsule-icon">⏰</span>
                    <div class="capsule-unlock-date">
                        Unlocked ${formatDate(capsule.unlockDate)}
                    </div>
                </div>
                ${capsule.messageText ? `<p class="capsule-message">${escapeHTML(capsule.messageText)}</p>` : ''}
                ${capsule.voiceUrl ? `<audio controls src="${capsule.voiceUrl}" class="capsule-audio"></audio>` : ''}
                ${capsule.videoUrl ? `<video controls src="${capsule.videoUrl}" class="capsule-video"></video>` : ''}
            </div>
        `).join('');

        elements.timeCapsulesGrid.innerHTML = capsulesHTML;
    }

    /**
     * Load photos for memorial
     */
    async function loadPhotos(memorialId) {
        try {
            const response = await api.getMemorialPhotos(memorialId);
            const photos = response.photos || [];

            if (photos.length > 0) {
                renderPhotos(photos);
                elements.photosSection.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading photos:', error);
        }
    }

    /**
     * Render photos to page
     */
    function renderPhotos(photos) {
        elements.photosCount.textContent = photos.length;

        if (photos.length === 0) {
            elements.photosGallery.innerHTML = `
                <div class="photo-gallery-empty">
                    <span class="photo-gallery-empty-icon">📷</span>
                    <p>No photos yet</p>
                </div>
            `;
            return;
        }

        const photosHTML = photos.map(photo => {
            const photoData = typeof photo.dataJson === 'string'
                ? JSON.parse(photo.dataJson)
                : photo.dataJson;

            return `
                <div class="photo-gallery-item" data-photo-url="${photoData.url}" data-photo-name="${escapeHTML(photoData.publicId || 'Photo')}">
                    <img src="${photoData.url}" alt="Memorial photo" loading="lazy">
                </div>
            `;
        }).join('');

        elements.photosGallery.innerHTML = photosHTML;

        // Add click handlers for full-size viewing
        elements.photosGallery.querySelectorAll('.photo-gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                const photoUrl = item.dataset.photoUrl;
                const photoName = item.dataset.photoName;
                openPhotoModal(photoUrl, photoName);
            });
        });
    }

    /**
     * Open photo modal for full-size viewing
     */
    function openPhotoModal(photoUrl, photoName) {
        const modal = document.getElementById('photo-modal');
        const modalImage = document.getElementById('photo-modal-image');

        modalImage.src = photoUrl;
        modalImage.alt = photoName;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close photo modal
     */
    function closePhotoModal() {
        const modal = document.getElementById('photo-modal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    function setupEventListeners() {
        // Candle button
        document.getElementById('candle-btn')?.addEventListener('click', openCandleModal);

        // Memory button (future feature)
        document.getElementById('memory-btn')?.addEventListener('click', () => {
            showToast('✨', 'Memory sharing coming soon!');
        });

        // Flowers button (future feature)
        document.getElementById('flowers-btn')?.addEventListener('click', () => {
            showToast('💐', 'Flower delivery coming soon!');
        });

        // Song button
        elements.playSongBtn?.addEventListener('click', toggleSong);

        // Modal close handlers
        setupModalClose('candle-modal');
        setupModalClose('memory-modal');

        // Form handlers
        elements.candleForm?.addEventListener('submit', handleCandleSubmit);

        // Character counters
        setupCharCounter('candle-message', 'candle-message-count');
        setupCharCounter('memory-text', 'memory-text-count');

        // Photo modal close
        const photoModalClose = document.getElementById('photo-modal-close');
        const photoModal = document.getElementById('photo-modal');

        photoModalClose?.addEventListener('click', closePhotoModal);
        photoModal?.addEventListener('click', (e) => {
            if (e.target === photoModal) {
                closePhotoModal();
            }
        });

        // ESC key to close photo modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && photoModal && photoModal.style.display === 'flex') {
                closePhotoModal();
            }
        });

        // QR Code button
        document.getElementById('qr-btn')?.addEventListener('click', openQRModal);

        // Prayer Card button
        document.getElementById('prayer-card-btn')?.addEventListener('click', openPrayerCardModal);

        // QR modal close handlers
        setupModalClose('qr-modal');

        // Prayer card modal close handlers
        setupModalClose('prayer-card-modal');

        // QR design option handlers
        document.querySelectorAll('.qr-design-option').forEach(option => {
            option.addEventListener('click', async () => {
                const design = option.dataset.design;
                await handleQRDownload(design);
            });
        });

        // Prayer card download button
        document.getElementById('download-prayer-card-btn')?.addEventListener('click', handlePrayerCardDownload);
    }

    /**
     * Setup modal close handlers
     */
    function setupModalClose(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const overlay = modal.querySelector('.modal-overlay');
        const closeBtn = modal.querySelector('.modal-close');

        overlay?.addEventListener('click', () => closeModal(modalId));
        closeBtn?.addEventListener('click', () => closeModal(modalId));

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                closeModal(modalId);
            }
        });
    }

    /**
     * Setup character counter
     */
    function setupCharCounter(inputId, counterId) {
        const input = document.getElementById(inputId);
        const counter = document.getElementById(counterId);

        if (!input || !counter) return;

        input.addEventListener('input', () => {
            counter.textContent = input.value.length;
        });
    }

    // ============================================
    // MODAL HANDLERS
    // ============================================

    function openCandleModal() {
        elements.candleModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';

            // Reset form
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    }

    /**
     * Handle candle form submission
     */
    async function handleCandleSubmit(e) {
        e.preventDefault();

        if (!currentMemorial) return;

        const submitBtn = document.getElementById('candle-submit');
        const originalText = submitBtn.textContent;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Lighting...';

            const candleData = {
                name: document.getElementById('candle-name').value.trim() || 'Anonymous',
                message: document.getElementById('candle-message').value.trim() || null,
            };

            const response = await api.lightCandle(currentMemorial.id, candleData);

            // Close modal
            closeModal('candle-modal');

            // Check if this was the first candle
            if (response.isFirstCandle) {
                // Show special first candle celebration
                showFirstCandleCelebration(response.totalCandles);
            } else {
                // Show success
                showToast('🕯️', 'Your candle has been lit');
            }

            // Reload candles
            await loadCandles(currentMemorial.id);
        } catch (error) {
            console.error('Error lighting candle:', error);

            if (error instanceof APIError && error.isRateLimited()) {
                showToast('⏰', 'Please wait before lighting another candle');
            } else {
                showToast('❌', 'Failed to light candle. Please try again.');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    // ============================================
    // QR CODE & PRAYER CARD HANDLERS
    // ============================================

    /**
     * Open QR code design modal
     */
    function openQRModal() {
        const modal = document.getElementById('qr-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Handle QR code download with selected design
     */
    async function handleQRDownload(design) {
        if (!currentMemorial) return;

        try {
            // Close modal
            closeModal('qr-modal');

            // Show loading toast
            showToast('⏳', 'Generating QR code...', 2000);

            // Get download URL
            const downloadUrl = api.getQRCodeDownloadUrl(currentMemorial.id, design);

            // Trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `qr-code-${currentMemorial.deceasedName.replace(/\s+/g, '-')}-${design}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show success toast
            setTimeout(() => {
                showToast('✅', 'QR code downloaded!');
            }, 1000);
        } catch (error) {
            console.error('Error downloading QR code:', error);
            showToast('❌', 'Failed to download QR code. Please try again.');
        }
    }

    /**
     * Open prayer card modal
     */
    function openPrayerCardModal() {
        const modal = document.getElementById('prayer-card-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Handle prayer card PDF download
     */
    async function handlePrayerCardDownload() {
        if (!currentMemorial) return;

        try {
            // Close modal
            closeModal('prayer-card-modal');

            // Show loading toast
            showToast('⏳', 'Generating prayer card...', 2000);

            // Download prayer card
            await api.downloadPrayerCard(currentMemorial.id, 'minimalist');

            // Show success toast
            setTimeout(() => {
                showToast('✅', 'Prayer card downloaded!');
            }, 1000);
        } catch (error) {
            console.error('Error downloading prayer card:', error);
            showToast('❌', 'Failed to download prayer card. Please try again.');
        }
    }

    // ============================================
    // SONG PLAYBACK
    // ============================================

    let songPlayerModal = null;

    function toggleSong() {
        if (!currentMemorial || !currentMemorial.songUrl) {
            showToast('🎵', 'No song available');
            return;
        }

        // Check if player modal already exists
        songPlayerModal = document.getElementById('song-player-modal');

        if (!songPlayerModal) {
            // Create song player modal
            createSongPlayerModal();
        }

        // Show modal
        songPlayerModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Load player
        loadSongPlayer(currentMemorial.songUrl, currentMemorial.songPlatform);
    }

    /**
     * Create song player modal
     */
    function createSongPlayerModal() {
        const modal = document.createElement('div');
        modal.id = 'song-player-modal';
        modal.className = 'modal';
        modal.style.display = 'none';

        modal.innerHTML = `
            <div class="modal-overlay" id="song-player-modal-close"></div>
            <div class="modal-content song-player-modal-content">
                <button class="modal-close" id="song-player-modal-x">×</button>
                <h3 class="modal-title">
                    <span>🎵</span>
                    <span id="song-player-title">Their Favorite Song</span>
                </h3>
                <div id="song-player-container" class="song-player-container"></div>
                <p style="text-align: center; color: var(--gray-body); font-size: 0.9rem; margin-top: 1rem;">
                    <span id="song-player-platform-info"></span>
                </p>
            </div>
        `;

        document.body.appendChild(modal);
        songPlayerModal = modal;

        // Add close handlers
        modal.querySelector('#song-player-modal-close').addEventListener('click', closeSongPlayer);
        modal.querySelector('#song-player-modal-x').addEventListener('click', closeSongPlayer);

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && songPlayerModal && songPlayerModal.style.display === 'flex') {
                closeSongPlayer();
            }
        });
    }

    /**
     * Load song player (Spotify or YouTube)
     */
    function loadSongPlayer(songUrl, platform) {
        const container = document.getElementById('song-player-container');
        const platformInfo = document.getElementById('song-player-platform-info');

        if (!container) return;

        container.innerHTML = '';

        if (platform === 'spotify') {
            const spotifyId = extractSpotifyId(songUrl);
            if (spotifyId) {
                container.innerHTML = `
                    <iframe
                        src="https://open.spotify.com/embed/track/${spotifyId}"
                        width="100%"
                        height="380"
                        frameborder="0"
                        allowtransparency="true"
                        allow="encrypted-media"
                        loading="lazy"
                        style="border-radius: 12px;"
                    ></iframe>
                `;
                platformInfo.textContent = '30-second preview (or full song if logged into Spotify)';
            }
        } else if (platform === 'youtube') {
            const youtubeId = extractYoutubeId(songUrl);
            if (youtubeId) {
                container.innerHTML = `
                    <iframe
                        width="100%"
                        height="380"
                        src="https://www.youtube.com/embed/${youtubeId}"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        loading="lazy"
                        style="border-radius: 12px;"
                    ></iframe>
                `;
                platformInfo.textContent = 'Full song on YouTube';
            }
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--gray-light);">Song format not supported</p>';
            platformInfo.textContent = '';
        }
    }

    /**
     * Close song player
     */
    function closeSongPlayer() {
        if (songPlayerModal) {
            songPlayerModal.style.display = 'none';
            document.body.style.overflow = '';

            // Clear iframe to stop playback
            const container = document.getElementById('song-player-container');
            if (container) {
                container.innerHTML = '';
            }
        }
    }

    /**
     * Detect song platform from URL
     */
    function detectSongPlatform(url) {
        if (!url) return null;

        if (url.includes('spotify.com')) {
            return 'spotify';
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return 'youtube';
        }

        return null;
    }

    /**
     * Extract Spotify track ID from URL
     */
    function extractSpotifyId(url) {
        const match = url.match(/spotify\.com\/(track|album)\/([a-zA-Z0-9]+)/);
        return match ? match[2] : null;
    }

    /**
     * Extract YouTube video ID from URL
     */
    function extractYoutubeId(url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    }

    // ============================================
    // UI HELPERS
    // ============================================

    /**
     * Show error state
     */
    function showError(message) {
        elements.loading.style.display = 'none';
        elements.error.style.display = 'flex';
        elements.errorMessage.textContent = message;
    }

    /**
     * Show toast notification
     */
    function showToast(icon, message, duration = 3000) {
        elements.toastIcon.textContent = icon;
        elements.toastMessage.textContent = message;
        elements.toast.style.display = 'flex';

        setTimeout(() => {
            elements.toast.style.display = 'none';
        }, duration);
    }

    /**
     * Show first candle celebration with golden glow animation
     */
    function showFirstCandleCelebration(totalCandles) {
        // Create celebration overlay
        const celebrationOverlay = document.createElement('div');
        celebrationOverlay.className = 'first-candle-celebration';
        celebrationOverlay.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-candle">🕯️</div>
                <h2 class="celebration-title">First Candle Lit!</h2>
                <p class="celebration-message">
                    You just lit the first candle on ${currentMemorial.deceasedName}'s memorial.
                    <br>
                    Their light shines on forever.
                </p>
                <div class="golden-glow"></div>
            </div>
        `;

        document.body.appendChild(celebrationOverlay);

        // Trigger animation
        setTimeout(() => {
            celebrationOverlay.classList.add('show');
        }, 100);

        // Remove after animation
        setTimeout(() => {
            celebrationOverlay.classList.remove('show');
            setTimeout(() => {
                celebrationOverlay.remove();
            }, 500);
        }, 5000);
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Format date to readable string
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    /**
     * Calculate age between two dates
     */
    function calculateAge(birthDate, deathDate) {
        const birth = new Date(birthDate);
        const death = new Date(deathDate);
        let age = death.getFullYear() - birth.getFullYear();
        const monthDiff = death.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    }

    /**
     * Time ago helper
     */
    function timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60,
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
            }
        }

        return 'Just now';
    }

    /**
     * Capitalize first letter
     */
    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Extract song name from URL
     */
    function extractSongName(url) {
        // Simple extraction - can be enhanced
        if (!url) return null;
        const parts = url.split('/').pop();
        return parts || 'Their Favorite Song';
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ============================================
    // START APPLICATION
    // ============================================

    // Run init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
