/**
 * Forever Fields - Photo Uploader Component
 * Drag-drop uploader with Cloudinary integration
 */

class PhotoUploader {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container element #${containerId} not found`);
        }

        // Configuration
        this.options = {
            memorialId: options.memorialId || null,
            api: options.api || null,
            maxFiles: options.maxFiles || 20,
            maxSizeMB: options.maxSizeMB || 10,
            allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            onUploadComplete: options.onUploadComplete || null,
            onError: options.onError || null,
        };

        // State
        this.files = [];
        this.uploads = new Map();

        // Initialize
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="photo-uploader">
                <div class="photo-drop-zone" id="drop-zone-${this.getUniqueId()}">
                    <div class="drop-zone-content">
                        <span class="drop-zone-icon">📷</span>
                        <h3 class="drop-zone-title">Upload Photos</h3>
                        <p class="drop-zone-text">Drag and drop photos here, or click to browse</p>
                        <button type="button" class="btn btn-secondary" id="browse-btn-${this.getUniqueId()}">
                            Choose Photos
                        </button>
                        <p class="drop-zone-hint">
                            Max ${this.options.maxFiles} photos, ${this.options.maxSizeMB}MB each
                        </p>
                    </div>
                    <input
                        type="file"
                        id="file-input-${this.getUniqueId()}"
                        accept="${this.options.allowedTypes.join(',')}"
                        multiple
                        style="display: none;"
                    >
                </div>
                <div class="photo-previews" id="previews-${this.getUniqueId()}" style="display: none;">
                    <!-- Preview items will be inserted here -->
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const dropZone = this.container.querySelector('.photo-drop-zone');
        const fileInput = this.container.querySelector('input[type="file"]');
        const browseBtn = this.container.querySelector('button[id^="browse-btn"]');

        // Browse button click
        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(Array.from(e.target.files));
        });

        // Drag and drop events
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');

            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });

        // Click to browse
        dropZone.addEventListener('click', (e) => {
            if (e.target === dropZone || e.target.closest('.drop-zone-content')) {
                fileInput.click();
            }
        });
    }

    handleFiles(newFiles) {
        // Filter valid files
        const validFiles = newFiles.filter(file => this.validateFile(file));

        // Check max files limit
        const totalFiles = this.files.length + validFiles.length;
        if (totalFiles > this.options.maxFiles) {
            const remaining = this.options.maxFiles - this.files.length;
            this.showError(`Maximum ${this.options.maxFiles} photos allowed. You can add ${remaining} more.`);
            return;
        }

        // Add files
        validFiles.forEach(file => {
            const fileId = this.generateFileId();
            this.files.push({
                id: fileId,
                file: file,
                status: 'pending', // pending, uploading, completed, error
                progress: 0,
                preview: null,
            });

            // Create preview
            this.createPreview(fileId, file);
        });

        // Show previews section
        this.showPreviews();

        // Auto-upload if API and memorialId are configured
        if (this.options.api && this.options.memorialId) {
            this.uploadAll();
        }
    }

    validateFile(file) {
        // Check file type
        if (!this.options.allowedTypes.includes(file.type)) {
            this.showError(`Invalid file type: ${file.name}. Allowed: JPG, PNG, WebP, GIF`);
            return false;
        }

        // Check file size
        const maxSizeBytes = this.options.maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            this.showError(`File too large: ${file.name}. Max size: ${this.options.maxSizeMB}MB`);
            return false;
        }

        return true;
    }

    createPreview(fileId, file) {
        const previewsContainer = this.container.querySelector('.photo-previews');

        // Create preview element
        const previewItem = document.createElement('div');
        previewItem.className = 'photo-preview-item';
        previewItem.id = `preview-${fileId}`;
        previewItem.innerHTML = `
            <div class="preview-image">
                <div class="preview-loading">Loading...</div>
            </div>
            <div class="preview-info">
                <div class="preview-name">${this.escapeHTML(file.name)}</div>
                <div class="preview-size">${this.formatFileSize(file.size)}</div>
            </div>
            <div class="preview-progress" style="display: none;">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text">0%</div>
            </div>
            <div class="preview-status">
                <span class="status-pending">Pending</span>
            </div>
            <button type="button" class="preview-remove" data-file-id="${fileId}">×</button>
        `;

        previewsContainer.appendChild(previewItem);

        // Use FileReader to create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageContainer = previewItem.querySelector('.preview-image');
            imageContainer.innerHTML = `<img src="${e.target.result}" alt="${this.escapeHTML(file.name)}">`;

            // Update file object with preview
            const fileObj = this.files.find(f => f.id === fileId);
            if (fileObj) {
                fileObj.preview = e.target.result;
            }
        };
        reader.readAsDataURL(file);

        // Remove button handler
        const removeBtn = previewItem.querySelector('.preview-remove');
        removeBtn.addEventListener('click', () => {
            this.removeFile(fileId);
        });
    }

    showPreviews() {
        const previewsContainer = this.container.querySelector('.photo-previews');
        if (this.files.length > 0) {
            previewsContainer.style.display = 'grid';
        } else {
            previewsContainer.style.display = 'none';
        }
    }

    removeFile(fileId) {
        // Remove from files array
        this.files = this.files.filter(f => f.id !== fileId);

        // Remove preview element
        const previewItem = document.getElementById(`preview-${fileId}`);
        if (previewItem) {
            previewItem.remove();
        }

        // Cancel upload if in progress
        if (this.uploads.has(fileId)) {
            const xhr = this.uploads.get(fileId);
            xhr.abort();
            this.uploads.delete(fileId);
        }

        // Hide previews if no files
        this.showPreviews();
    }

    async uploadAll() {
        const pendingFiles = this.files.filter(f => f.status === 'pending');

        for (const fileObj of pendingFiles) {
            await this.uploadFile(fileObj);
        }
    }

    async uploadFile(fileObj) {
        if (!this.options.api || !this.options.memorialId) {
            this.showError('Upload configuration missing');
            return;
        }

        try {
            // Update status
            this.updateFileStatus(fileObj.id, 'uploading');

            // Step 1: Get signed upload URL from backend
            const signatureResponse = await this.options.api.getUploadSignature(
                fileObj.file.type,
                fileObj.file.name,
                this.options.memorialId
            );

            const { uploadUrl, uploadParams } = signatureResponse;

            // Step 2: Upload to Cloudinary
            const cloudinaryResult = await this.uploadToCloudinary(
                fileObj,
                uploadUrl,
                uploadParams
            );

            // Step 3: Complete upload on backend (creates pending item)
            await this.options.api.completeUpload(
                this.options.memorialId,
                cloudinaryResult
            );

            // Update status
            this.updateFileStatus(fileObj.id, 'completed');

            // Callback
            if (this.options.onUploadComplete) {
                this.options.onUploadComplete(fileObj, cloudinaryResult);
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.updateFileStatus(fileObj.id, 'error');

            if (this.options.onError) {
                this.options.onError(error, fileObj);
            } else {
                this.showError(`Failed to upload ${fileObj.file.name}`);
            }
        }
    }

    uploadToCloudinary(fileObj, uploadUrl, uploadParams) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();

            // Add upload parameters
            Object.entries(uploadParams).forEach(([key, value]) => {
                formData.append(key, value);
            });

            // Add file
            formData.append('file', fileObj.file);

            // Create XHR for progress tracking
            const xhr = new XMLHttpRequest();
            this.uploads.set(fileObj.id, xhr);

            // Progress handler
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    this.updateFileProgress(fileObj.id, progress);
                }
            });

            // Success handler
            xhr.addEventListener('load', () => {
                this.uploads.delete(fileObj.id);

                if (xhr.status >= 200 && xhr.status < 300) {
                    const result = JSON.parse(xhr.responseText);
                    resolve(result);
                } else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            });

            // Error handler
            xhr.addEventListener('error', () => {
                this.uploads.delete(fileObj.id);
                reject(new Error('Network error during upload'));
            });

            // Abort handler
            xhr.addEventListener('abort', () => {
                this.uploads.delete(fileObj.id);
                reject(new Error('Upload cancelled'));
            });

            // Send request
            xhr.open('POST', uploadUrl);
            xhr.send(formData);
        });
    }

    updateFileStatus(fileId, status) {
        const fileObj = this.files.find(f => f.id === fileId);
        if (fileObj) {
            fileObj.status = status;
        }

        const previewItem = document.getElementById(`preview-${fileId}`);
        if (!previewItem) return;

        const statusElement = previewItem.querySelector('.preview-status');
        const progressElement = previewItem.querySelector('.preview-progress');

        // Update status display
        const statusMap = {
            pending: '<span class="status-pending">Pending</span>',
            uploading: '<span class="status-uploading">Uploading...</span>',
            completed: '<span class="status-completed">✓ Pending approval</span>',
            error: '<span class="status-error">✗ Failed</span>',
        };

        statusElement.innerHTML = statusMap[status] || '';

        // Show/hide progress bar
        if (status === 'uploading') {
            progressElement.style.display = 'block';
        } else if (status === 'completed' || status === 'error') {
            progressElement.style.display = 'none';
        }

        // Update preview item class
        previewItem.className = `photo-preview-item status-${status}`;
    }

    updateFileProgress(fileId, progress) {
        const fileObj = this.files.find(f => f.id === fileId);
        if (fileObj) {
            fileObj.progress = progress;
        }

        const previewItem = document.getElementById(`preview-${fileId}`);
        if (!previewItem) return;

        const progressFill = previewItem.querySelector('.progress-fill');
        const progressText = previewItem.querySelector('.progress-text');

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        if (progressText) {
            progressText.textContent = `${progress}%`;
        }
    }

    showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'upload-error-toast';
        toast.innerHTML = `
            <span class="toast-icon">⚠️</span>
            <span class="toast-message">${this.escapeHTML(message)}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Utility methods
    generateFileId() {
        return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getUniqueId() {
        return Math.random().toString(36).substr(2, 9);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Public methods
    getFiles() {
        return this.files;
    }

    getCompletedFiles() {
        return this.files.filter(f => f.status === 'completed');
    }

    clear() {
        this.files.forEach(f => this.removeFile(f.id));
        this.files = [];
        this.showPreviews();
    }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.PhotoUploader = PhotoUploader;
}
