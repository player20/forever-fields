/**
 * Forever Fields - Upload Progress
 * Visual feedback for file uploads
 */

(function() {
    'use strict';

    class UploadProgress {
        constructor(containerId) {
            this.container = document.getElementById(containerId) || this.createContainer();
            this.uploads = new Map();
        }

        createContainer() {
            const container = document.createElement('div');
            container.id = 'upload-progress-container';
            container.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 320px;
                max-height: 400px;
                overflow-y: auto;
                z-index: 9999;
            `;
            document.body.appendChild(container);
            return container;
        }

        addUpload(id, fileName) {
            const uploadEl = document.createElement('div');
            uploadEl.id = `upload-${id}`;
            uploadEl.className = 'upload-item';
            uploadEl.style.cssText = `
                background: white;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            `;

            uploadEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span class="upload-filename" style="font-size: 14px; color: #333; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${this.escapeHtml(fileName)}
                    </span>
                    <span class="upload-status" style="font-size: 12px; color: #666;">0%</span>
                </div>
                <div class="progress-bar" style="height: 4px; background: #eee; border-radius: 2px; overflow: hidden;">
                    <div class="progress-fill" style="height: 100%; width: 0%; background: #a7c9a2; transition: width 0.3s ease;"></div>
                </div>
            `;

            this.container.appendChild(uploadEl);
            this.uploads.set(id, uploadEl);

            return uploadEl;
        }

        updateProgress(id, percent) {
            const uploadEl = this.uploads.get(id);
            if (!uploadEl) return;

            const fill = uploadEl.querySelector('.progress-fill');
            const status = uploadEl.querySelector('.upload-status');

            fill.style.width = `${percent}%`;
            status.textContent = `${Math.round(percent)}%`;
        }

        markComplete(id) {
            const uploadEl = this.uploads.get(id);
            if (!uploadEl) return;

            const fill = uploadEl.querySelector('.progress-fill');
            const status = uploadEl.querySelector('.upload-status');

            fill.style.width = '100%';
            fill.style.background = '#27ae60';
            status.textContent = '✓ Complete';
            status.style.color = '#27ae60';

            // Remove after delay
            setTimeout(() => this.removeUpload(id), 3000);
        }

        markError(id, errorMessage = 'Upload failed') {
            const uploadEl = this.uploads.get(id);
            if (!uploadEl) return;

            const fill = uploadEl.querySelector('.progress-fill');
            const status = uploadEl.querySelector('.upload-status');

            fill.style.background = '#e74c3c';
            status.textContent = '✕ ' + errorMessage;
            status.style.color = '#e74c3c';

            // Remove after delay
            setTimeout(() => this.removeUpload(id), 5000);
        }

        removeUpload(id) {
            const uploadEl = this.uploads.get(id);
            if (uploadEl) {
                uploadEl.style.opacity = '0';
                uploadEl.style.transform = 'translateX(100%)';
                uploadEl.style.transition = 'all 0.3s ease';
                setTimeout(() => {
                    uploadEl.remove();
                    this.uploads.delete(id);
                }, 300);
            }
        }

        clear() {
            this.uploads.forEach((_, id) => this.removeUpload(id));
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // Utility function for uploading with progress
    async function uploadWithProgress(url, file, options = {}) {
        const {
            onProgress = () => {},
            onComplete = () => {},
            onError = () => {},
            headers = {}
        } = options;

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = (e.loaded / e.total) * 100;
                    onProgress(percent);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        onComplete(response);
                        resolve(response);
                    } catch {
                        onComplete(xhr.responseText);
                        resolve(xhr.responseText);
                    }
                } else {
                    const error = new Error(`Upload failed: ${xhr.status}`);
                    onError(error);
                    reject(error);
                }
            });

            xhr.addEventListener('error', () => {
                const error = new Error('Network error');
                onError(error);
                reject(error);
            });

            xhr.open('POST', url);

            Object.keys(headers).forEach(key => {
                xhr.setRequestHeader(key, headers[key]);
            });

            xhr.withCredentials = true;

            const formData = new FormData();
            formData.append('file', file);

            xhr.send(formData);
        });
    }

    // Create global instance
    window.uploadProgress = new UploadProgress();
    window.UploadProgress = UploadProgress;
    window.uploadWithProgress = uploadWithProgress;
})();
