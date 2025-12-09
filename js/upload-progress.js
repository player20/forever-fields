/**
 * Upload Progress Indicator
 * A/B Test Variant B: Linear progress bar (vs circular spinner)
 * Shows "52% uploaded..." for better perceived performance
 */

class UploadProgressManager {
    constructor() {
        this.activeUploads = new Map();
        this.init();
    }

    init() {
        // Create global progress container (appears at top of page)
        this.createProgressContainer();
    }

    createProgressContainer() {
        if (document.getElementById('upload-progress-container')) return;

        const container = document.createElement('div');
        container.id = 'upload-progress-container';
        container.className = 'upload-progress-container';
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');

        document.body.appendChild(container);

        // Add styles dynamically
        if (!document.getElementById('upload-progress-styles')) {
            const style = document.createElement('style');
            style.id = 'upload-progress-styles';
            style.textContent = `
                .upload-progress-container {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    width: 400px;
                    max-width: calc(100vw - 40px);
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .upload-progress-item {
                    background: white;
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                    border: 1px solid var(--sage-light);
                    animation: slideInRight 0.3s ease;
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .upload-progress-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 12px;
                }

                .upload-progress-filename {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--gray-dark);
                    max-width: 280px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .upload-progress-cancel {
                    background: none;
                    border: none;
                    color: var(--gray-light);
                    cursor: pointer;
                    padding: 4px 8px;
                    font-size: 1.2rem;
                    line-height: 1;
                    transition: color 0.2s ease;
                }

                .upload-progress-cancel:hover {
                    color: var(--error);
                }

                .upload-progress-bar-container {
                    width: 100%;
                    height: 8px;
                    background: var(--sage-pale);
                    border-radius: 8px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }

                .upload-progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, var(--gold-primary), var(--gold-dark));
                    border-radius: 8px;
                    transition: width 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .upload-progress-bar::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.3),
                        transparent
                    );
                    animation: shimmer 2s infinite;
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                .upload-progress-text {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.85rem;
                    color: var(--gray-body);
                }

                .upload-progress-percent {
                    font-weight: 600;
                    color: var(--gold-primary);
                }

                .upload-progress-complete {
                    background: var(--sage-pale);
                    border-color: var(--sage-primary);
                }

                .upload-progress-complete .upload-progress-bar {
                    background: linear-gradient(90deg, var(--sage-primary), var(--sage-dark));
                }

                .upload-progress-complete .upload-progress-percent {
                    color: var(--sage-primary);
                }

                .upload-progress-error {
                    background: #ffebee;
                    border-color: var(--error);
                }

                .upload-progress-error .upload-progress-bar {
                    background: var(--error);
                }

                @media (max-width: 768px) {
                    .upload-progress-container {
                        top: 60px;
                        right: 10px;
                        width: calc(100vw - 20px);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Start tracking an upload
     * @param {string} uploadId - Unique ID for this upload
     * @param {string} filename - Name of file being uploaded
     * @param {XMLHttpRequest} xhr - XHR object for upload
     * @returns {Object} Progress tracker object
     */
    startUpload(uploadId, filename, xhr) {
        const container = document.getElementById('upload-progress-container');

        // Create progress item
        const progressItem = document.createElement('div');
        progressItem.id = `upload-${uploadId}`;
        progressItem.className = 'upload-progress-item';
        progressItem.innerHTML = `
            <div class="upload-progress-header">
                <span class="upload-progress-filename" title="${filename}">${filename}</span>
                <button class="upload-progress-cancel"
                        aria-label="Cancel upload"
                        data-upload-id="${uploadId}">
                    ✕
                </button>
            </div>
            <div class="upload-progress-bar-container">
                <div class="upload-progress-bar" style="width: 0%"></div>
            </div>
            <div class="upload-progress-text">
                <span>Uploading...</span>
                <span class="upload-progress-percent">0%</span>
            </div>
        `;

        container.appendChild(progressItem);

        // Add cancel handler
        const cancelBtn = progressItem.querySelector('.upload-progress-cancel');
        cancelBtn.addEventListener('click', () => {
            if (confirm('Cancel this upload?')) {
                xhr.abort();
                this.setError(uploadId, 'Upload cancelled');
            }
        });

        // Store upload reference
        this.activeUploads.set(uploadId, {
            xhr,
            filename,
            element: progressItem,
            startTime: Date.now()
        });

        return {
            updateProgress: (percent) => this.updateProgress(uploadId, percent),
            setComplete: () => this.setComplete(uploadId),
            setError: (message) => this.setError(uploadId, message)
        };
    }

    /**
     * Update upload progress
     * @param {string} uploadId - Upload ID
     * @param {number} percent - Progress percentage (0-100)
     */
    updateProgress(uploadId, percent) {
        const upload = this.activeUploads.get(uploadId);
        if (!upload) return;

        const progressBar = upload.element.querySelector('.upload-progress-bar');
        const percentText = upload.element.querySelector('.upload-progress-percent');
        const statusText = upload.element.querySelector('.upload-progress-text span:first-child');

        progressBar.style.width = `${percent}%`;
        percentText.textContent = `${Math.round(percent)}%`;

        // Calculate ETA
        if (percent > 5) {
            const elapsed = Date.now() - upload.startTime;
            const total = (elapsed / percent) * 100;
            const remaining = total - elapsed;
            const seconds = Math.ceil(remaining / 1000);

            if (seconds > 60) {
                statusText.textContent = `${Math.ceil(seconds / 60)} min remaining`;
            } else if (seconds > 0) {
                statusText.textContent = `${seconds} sec remaining`;
            }
        }

        // Update ARIA for screen readers
        upload.element.setAttribute('aria-label', `Uploading ${upload.filename}: ${Math.round(percent)}% complete`);
    }

    /**
     * Mark upload as complete
     * @param {string} uploadId - Upload ID
     */
    setComplete(uploadId) {
        const upload = this.activeUploads.get(uploadId);
        if (!upload) return;

        upload.element.classList.add('upload-progress-complete');
        const progressBar = upload.element.querySelector('.upload-progress-bar');
        const percentText = upload.element.querySelector('.upload-progress-percent');
        const statusText = upload.element.querySelector('.upload-progress-text span:first-child');
        const cancelBtn = upload.element.querySelector('.upload-progress-cancel');

        progressBar.style.width = '100%';
        percentText.textContent = '100%';
        statusText.textContent = '✓ Complete';
        cancelBtn.remove();

        // Update ARIA
        upload.element.setAttribute('aria-label', `Upload complete: ${upload.filename}`);

        // Remove after 3 seconds
        setTimeout(() => {
            upload.element.style.opacity = '0';
            upload.element.style.transform = 'translateX(100%)';
            setTimeout(() => {
                upload.element.remove();
                this.activeUploads.delete(uploadId);
            }, 300);
        }, 3000);
    }

    /**
     * Mark upload as error
     * @param {string} uploadId - Upload ID
     * @param {string} errorMessage - Error message to display
     */
    setError(uploadId, errorMessage) {
        const upload = this.activeUploads.get(uploadId);
        if (!upload) return;

        upload.element.classList.add('upload-progress-error');
        const statusText = upload.element.querySelector('.upload-progress-text span:first-child');
        const percentText = upload.element.querySelector('.upload-progress-percent');
        const cancelBtn = upload.element.querySelector('.upload-progress-cancel');

        statusText.textContent = errorMessage;
        percentText.textContent = 'Failed';
        cancelBtn.textContent = '✕';
        cancelBtn.setAttribute('aria-label', 'Dismiss error');

        // Change cancel button to close button
        cancelBtn.onclick = () => {
            upload.element.remove();
            this.activeUploads.delete(uploadId);
        };

        // Update ARIA
        upload.element.setAttribute('role', 'alert');
        upload.element.setAttribute('aria-label', `Upload failed: ${errorMessage}`);
    }

    /**
     * Upload a file with progress tracking
     * @param {File} file - File to upload
     * @param {string} url - Upload URL
     * @param {Object} options - Upload options
     * @returns {Promise} Upload promise
     */
    uploadFile(file, url, options = {}) {
        return new Promise((resolve, reject) => {
            const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const xhr = new XMLHttpRequest();

            // Start tracking
            const tracker = this.startUpload(uploadId, file.name, xhr);

            // Upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = (e.loaded / e.total) * 100;
                    tracker.updateProgress(percent);
                }
            });

            // Upload complete
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    tracker.setComplete();
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        resolve(xhr.responseText);
                    }
                } else {
                    const errorMsg = `Upload failed (${xhr.status})`;
                    tracker.setError(errorMsg);
                    reject(new Error(errorMsg));
                }
            });

            // Upload error
            xhr.addEventListener('error', () => {
                tracker.setError('Network error. Please check your connection.');
                reject(new Error('Network error'));
            });

            // Upload aborted
            xhr.addEventListener('abort', () => {
                // Error already shown by cancel handler
                reject(new Error('Upload cancelled'));
            });

            // Prepare form data
            const formData = new FormData();
            formData.append(options.fieldName || 'file', file);

            // Add additional fields
            if (options.additionalFields) {
                Object.keys(options.additionalFields).forEach(key => {
                    formData.append(key, options.additionalFields[key]);
                });
            }

            // Send request
            xhr.open('POST', url);

            // Add custom headers
            if (options.headers) {
                Object.keys(options.headers).forEach(key => {
                    xhr.setRequestHeader(key, options.headers[key]);
                });
            }

            xhr.send(formData);
        });
    }
}

// Initialize global upload manager
window.uploadProgressManager = new UploadProgressManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UploadProgressManager;
}
