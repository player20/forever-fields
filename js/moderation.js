/**
 * Forever Fields - Content Moderation Module (UI ONLY)
 * Gentle, grief-aware content safety checks
 *
 * ⚠️ SECURITY NOTICE:
 * This module handles DISPLAY LOGIC ONLY (showing/hiding buttons based on UI state).
 * ALL ACTUAL PERMISSIONS are enforced server-side in the backend API.
 *
 * localStorage permissions are for UX only - they control what buttons
 * users see, but the backend ALWAYS validates permissions before
 * allowing any action.
 *
 * DO NOT rely on these checks for security. Users can modify localStorage,
 * but they cannot bypass backend permission validation.
 *
 * This module handles:
 * - Permission roles UI (Owner, Editor, Viewer) - DISPLAY ONLY
 * - Content safety filters (text, images, voice) - CLIENT-SIDE HINTS
 * - Pending approval queue management - UI STATE
 * - Report functionality - UI DISPLAY
 * - Legacy contacts - UI MANAGEMENT
 *
 * All server-side permission enforcement happens in:
 * - server/src/utils/permissions.ts (permission checks)
 * - server/src/middleware/auth.ts (authentication)
 * - server/src/middleware/authorization.ts (authorization)
 */

const ForeverFieldsModeration = {
    // =============================================
    // CONFIGURATION
    // =============================================

    // Blocked words list (expandable - add actual profanity for production)
    blockedWords: [
        'spam', 'scam', 'hate', 'kill', 'die',
        // Add more inappropriate words as needed
    ],

    // Gentle rejection messages
    messages: {
        photo_inappropriate: "This image doesn't seem appropriate for a memorial. Please choose a different photo that honors their memory.",
        text_inappropriate: "Some words in your message may not be suitable for this space. Please revise with gentle, loving language.",
        voice_too_long: "Voice memories are limited to 60 seconds to keep things meaningful and focused.",
        file_blocked: "This file couldn't be added. Please try a different one.",
        file_too_large: "This file is too large. Please choose a smaller file (max 10MB).",
        generic: "This content couldn't be added. If you believe this is an error, please contact us.",
        submission_pending: "Thank you for sharing. Your message will appear once the family approves it.",
        submission_approved: "Your contribution has been added to the memorial.",
        report_confirmed: "Thank you. This item has been hidden and reported to the family.",
        legacy_added: "Legacy contact has been added successfully.",
        legacy_max: "You can add up to 3 legacy contacts."
    },

    // Max file sizes
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_VOICE_DURATION: 60, // seconds
    MAX_LEGACY_CONTACTS: 3,

    // =============================================
    // PERMISSION SYSTEM
    // =============================================

    /**
     * Get current user email from localStorage
     */
    getCurrentUser() {
        return localStorage.getItem('ff_current_user') || null;
    },

    /**
     * Set current user (for demo/testing)
     */
    setCurrentUser(email) {
        localStorage.setItem('ff_current_user', email);
    },

    /**
     * Get permissions for a memorial
     */
    getPermissions(memorialId) {
        const key = `ff_memorial_${memorialId}_permissions`;
        return JSON.parse(localStorage.getItem(key)) || {
            memorialId: memorialId,
            owner: null,
            editors: [],
            viewers: [],
            pendingInvites: []
        };
    },

    /**
     * Save permissions for a memorial
     */
    savePermissions(memorialId, permissions) {
        const key = `ff_memorial_${memorialId}_permissions`;
        localStorage.setItem(key, JSON.stringify(permissions));
    },

    /**
     * Get current user's role for a memorial
     */
    getCurrentUserRole(memorialId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return 'visitor';

        const permissions = this.getPermissions(memorialId);

        if (permissions.owner === currentUser) return 'owner';
        if (permissions.editors && permissions.editors.includes(currentUser)) return 'editor';
        if (permissions.viewers && permissions.viewers.includes(currentUser)) return 'viewer';
        return 'visitor';
    },

    /**
     * Check if user can perform action
     */
    canPerformAction(memorialId, action) {
        const role = this.getCurrentUserRole(memorialId);

        const permissions = {
            'edit_memorial': ['owner'],
            'add_content': ['owner', 'editor'],
            'approve_pending': ['owner'],
            'light_candle': ['owner', 'editor', 'viewer', 'visitor'],
            'leave_flowers': ['owner', 'editor', 'viewer', 'visitor'],
            'leave_guestbook': ['owner', 'editor', 'viewer', 'visitor'],
            'report_content': ['owner', 'editor', 'viewer', 'visitor'],
            'manage_permissions': ['owner'],
            'add_legacy_contacts': ['owner']
        };

        return permissions[action] ? permissions[action].includes(role) : false;
    },

    /**
     * Add an invite
     */
    addInvite(memorialId, email, role) {
        const permissions = this.getPermissions(memorialId);

        // Check if already invited
        const existingInvite = permissions.pendingInvites.find(i => i.email === email);
        if (existingInvite) {
            return { success: false, message: 'This person has already been invited.' };
        }

        // Check if already has a role
        if (permissions.owner === email ||
            permissions.editors.includes(email) ||
            permissions.viewers.includes(email)) {
            return { success: false, message: 'This person already has access.' };
        }

        permissions.pendingInvites.push({
            email: email,
            role: role,
            sentAt: new Date().toISOString()
        });

        this.savePermissions(memorialId, permissions);
        return { success: true, message: 'Invitation sent.' };
    },

    /**
     * Remove an invite
     */
    removeInvite(memorialId, email) {
        const permissions = this.getPermissions(memorialId);
        permissions.pendingInvites = permissions.pendingInvites.filter(i => i.email !== email);
        this.savePermissions(memorialId, permissions);
    },

    /**
     * Accept an invite (assign role)
     */
    acceptInvite(memorialId, email) {
        const permissions = this.getPermissions(memorialId);
        const invite = permissions.pendingInvites.find(i => i.email === email);

        if (!invite) return { success: false, message: 'Invite not found.' };

        if (invite.role === 'editor') {
            permissions.editors.push(email);
        } else if (invite.role === 'viewer') {
            permissions.viewers.push(email);
        }

        permissions.pendingInvites = permissions.pendingInvites.filter(i => i.email !== email);
        this.savePermissions(memorialId, permissions);
        return { success: true, message: 'You now have access to this memorial.' };
    },

    // =============================================
    // PENDING QUEUE SYSTEM
    // =============================================

    /**
     * Get pending items for a memorial
     */
    getPendingItems(memorialId) {
        const key = `ff_memorial_${memorialId}_pending`;
        const data = JSON.parse(localStorage.getItem(key)) || { memorialId: memorialId, items: [] };
        return data.items.filter(item => item.status === 'pending');
    },

    /**
     * Get all pending items (for all user's memorials)
     */
    getAllPendingItems() {
        const allPending = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('ff_memorial_') && key.endsWith('_pending')) {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && data.items) {
                    const pending = data.items.filter(item => item.status === 'pending');
                    allPending.push(...pending.map(item => ({
                        ...item,
                        memorialId: data.memorialId
                    })));
                }
            }
        }
        return allPending;
    },

    /**
     * Alias for getPendingItems (for backwards compatibility)
     */
    getPendingQueue(memorialId) {
        return this.getPendingItems(memorialId);
    },

    /**
     * Add item to pending queue
     */
    addToPendingQueue(memorialId, type, content, submittedBy) {
        const key = `ff_memorial_${memorialId}_pending`;
        const data = JSON.parse(localStorage.getItem(key)) || { memorialId: memorialId, items: [] };

        const newItem = {
            id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type, // photo | memory | voice | guestbook | candle_note | recipe
            content: content,
            submittedBy: submittedBy || this.getCurrentUser() || 'anonymous',
            submittedAt: new Date().toISOString(),
            status: 'pending',
            reportedBy: null,
            isReport: false
        };

        data.items.push(newItem);
        localStorage.setItem(key, JSON.stringify(data));

        return newItem;
    },

    /**
     * Approve a pending item
     */
    approveItem(memorialId, itemId) {
        const key = `ff_memorial_${memorialId}_pending`;
        const data = JSON.parse(localStorage.getItem(key));

        if (!data) return { success: false, message: 'Item not found.' };

        const item = data.items.find(i => i.id === itemId);
        if (!item) return { success: false, message: 'Item not found.' };

        item.status = 'approved';
        item.approvedAt = new Date().toISOString();

        localStorage.setItem(key, JSON.stringify(data));

        // Move to approved content
        this.addToApprovedContent(memorialId, item.type, item.content);

        return { success: true, message: 'Item approved.' };
    },

    /**
     * Reject a pending item
     */
    rejectItem(memorialId, itemId) {
        const key = `ff_memorial_${memorialId}_pending`;
        const data = JSON.parse(localStorage.getItem(key));

        if (!data) return { success: false, message: 'Item not found.' };

        const item = data.items.find(i => i.id === itemId);
        if (!item) return { success: false, message: 'Item not found.' };

        item.status = 'rejected';
        item.rejectedAt = new Date().toISOString();

        localStorage.setItem(key, JSON.stringify(data));

        return { success: true, message: 'Item removed.' };
    },

    /**
     * Add to approved content
     */
    addToApprovedContent(memorialId, type, content) {
        const key = `ff_memorial_${memorialId}_content`;
        const data = JSON.parse(localStorage.getItem(key)) || {
            memorialId: memorialId,
            photos: [],
            memories: [],
            voiceNotes: [],
            guestbook: [],
            recipes: []
        };

        const typeMap = {
            photo: 'photos',
            memory: 'memories',
            voice: 'voiceNotes',
            guestbook: 'guestbook',
            recipe: 'recipes'
        };

        const arrayKey = typeMap[type];
        if (arrayKey && data[arrayKey]) {
            data[arrayKey].push({
                ...content,
                addedAt: new Date().toISOString()
            });
        }

        localStorage.setItem(key, JSON.stringify(data));
    },

    // =============================================
    // SAFETY FILTERS
    // =============================================

    /**
     * Check text content for inappropriate words
     */
    checkText(text) {
        if (!text) return { passed: true };

        const lowerText = text.toLowerCase();
        for (const word of this.blockedWords) {
            if (lowerText.includes(word.toLowerCase())) {
                return {
                    passed: false,
                    reason: 'text_inappropriate'
                };
            }
        }
        return { passed: true };
    },

    /**
     * Check image for potential issues
     * Uses canvas to analyze pixel data for high skin-tone ratio
     */
    async checkImage(file) {
        // Check file size first
        if (file.size > this.MAX_FILE_SIZE) {
            return {
                passed: false,
                reason: 'file_too_large'
            };
        }

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        // Resize for performance
                        canvas.width = 100;
                        canvas.height = 100;
                        ctx.drawImage(img, 0, 0, 100, 100);

                        const imageData = ctx.getImageData(0, 0, 100, 100);
                        const skinToneRatio = this.detectSkinToneRatio(imageData);

                        if (skinToneRatio > 0.85) {
                            resolve({
                                passed: false,
                                reason: 'photo_inappropriate'
                            });
                        } else {
                            resolve({ passed: true });
                        }
                    } catch (err) {
                        // If canvas analysis fails, allow the image
                        resolve({ passed: true });
                    }
                };
                img.onerror = () => {
                    resolve({
                        passed: false,
                        reason: 'file_blocked'
                    });
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                resolve({
                    passed: false,
                    reason: 'file_blocked'
                });
            };
            reader.readAsDataURL(file);
        });
    },

    /**
     * Detect ratio of skin-tone pixels (simplified heuristic)
     */
    detectSkinToneRatio(imageData) {
        const data = imageData.data;
        let skinPixels = 0;
        let totalPixels = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Simple skin tone detection heuristic (works for various skin tones)
            if (r > 95 && g > 40 && b > 20 &&
                r > g && r > b &&
                Math.abs(r - g) > 15 &&
                r - b > 15) {
                skinPixels++;
            }
        }

        return skinPixels / totalPixels;
    },

    /**
     * Check voice note
     */
    checkVoiceNote(file, durationSeconds) {
        // Check file size
        if (file.size > this.MAX_FILE_SIZE) {
            return {
                passed: false,
                reason: 'file_too_large'
            };
        }

        // Check duration (max 60 seconds)
        if (durationSeconds && durationSeconds > this.MAX_VOICE_DURATION) {
            return {
                passed: false,
                reason: 'voice_too_long'
            };
        }

        // Check filename for inappropriate words
        const filename = file.name.toLowerCase();
        for (const word of this.blockedWords) {
            if (filename.includes(word.toLowerCase())) {
                return {
                    passed: false,
                    reason: 'file_blocked'
                };
            }
        }

        return { passed: true };
    },

    /**
     * Show gentle rejection message
     */
    showRejection(reason) {
        const message = this.messages[reason] || this.messages.generic;
        if (typeof showToast === 'function') {
            showToast(message, 'warning');
        } else {
            alert(message);
        }
    },

    // =============================================
    // REPORT SYSTEM
    // =============================================

    /**
     * Report content
     */
    reportContent(memorialId, itemId, itemType) {
        const key = `ff_memorial_${memorialId}_pending`;
        const data = JSON.parse(localStorage.getItem(key)) || { memorialId: memorialId, items: [] };

        const reportEntry = {
            id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            originalItemId: itemId,
            type: itemType,
            reportedAt: new Date().toISOString(),
            reportedBy: this.getCurrentUser() || 'visitor',
            status: 'pending',
            isReport: true
        };

        data.items.push(reportEntry);
        localStorage.setItem(key, JSON.stringify(data));

        return reportEntry;
    },

    // =============================================
    // LEGACY CONTACTS
    // =============================================

    /**
     * Get legacy contacts
     */
    getLegacyContacts() {
        return JSON.parse(localStorage.getItem('ff_legacy_contacts')) || [];
    },

    /**
     * Save legacy contacts
     */
    saveLegacyContacts(contacts) {
        localStorage.setItem('ff_legacy_contacts', JSON.stringify(contacts));
    },

    /**
     * Add a legacy contact
     */
    addLegacyContact(email, name, relation) {
        const contacts = this.getLegacyContacts();

        if (contacts.length >= this.MAX_LEGACY_CONTACTS) {
            return { success: false, message: this.messages.legacy_max };
        }

        // Check for duplicate
        if (contacts.find(c => c.email === email)) {
            return { success: false, message: 'This contact has already been added.' };
        }

        contacts.push({
            id: `legacy_${Date.now()}`,
            email: email,
            name: name,
            relation: relation,
            addedAt: new Date().toISOString()
        });

        this.saveLegacyContacts(contacts);
        return { success: true, message: this.messages.legacy_added };
    },

    /**
     * Remove a legacy contact
     */
    removeLegacyContact(id) {
        let contacts = this.getLegacyContacts();
        contacts = contacts.filter(c => c.id !== id);
        this.saveLegacyContacts(contacts);
        return { success: true };
    },

    // =============================================
    // CONTENT SUBMISSION HANDLERS
    // =============================================

    /**
     * Handle photo upload with safety check
     */
    async handlePhotoUpload(memorialId, file) {
        const check = await this.checkImage(file);

        if (!check.passed) {
            this.showRejection(check.reason);
            return { success: false, reason: check.reason };
        }

        const role = this.getCurrentUserRole(memorialId);

        if (role === 'owner') {
            // Auto-approve owner's content
            this.addToApprovedContent(memorialId, 'photo', {
                name: file.name,
                size: file.size,
                dataUrl: await this.fileToDataUrl(file)
            });
            if (typeof showToast === 'function') {
                showToast(this.messages.submission_approved, 'success');
            }
            return { success: true, approved: true };
        } else {
            // Add to pending queue
            this.addToPendingQueue(memorialId, 'photo', {
                name: file.name,
                size: file.size,
                dataUrl: await this.fileToDataUrl(file)
            });
            if (typeof showToast === 'function') {
                showToast(this.messages.submission_pending, 'info');
            }
            return { success: true, approved: false };
        }
    },

    /**
     * Handle text submission (memory/guestbook) with safety check
     */
    handleTextSubmission(memorialId, type, content) {
        const textToCheck = typeof content === 'string' ? content : content.text || content.message;
        const check = this.checkText(textToCheck);

        if (!check.passed) {
            this.showRejection(check.reason);
            return { success: false, reason: check.reason };
        }

        const role = this.getCurrentUserRole(memorialId);

        if (role === 'owner') {
            // Auto-approve owner's content
            this.addToApprovedContent(memorialId, type, content);
            if (typeof showToast === 'function') {
                showToast(this.messages.submission_approved, 'success');
            }
            return { success: true, approved: true };
        } else {
            // Add to pending queue
            this.addToPendingQueue(memorialId, type, content);
            if (typeof showToast === 'function') {
                showToast(this.messages.submission_pending, 'info');
            }
            return { success: true, approved: false };
        }
    },

    /**
     * Convert file to data URL for localStorage storage
     */
    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // =============================================
    // UTILITY FUNCTIONS
    // =============================================

    /**
     * Format relative time (e.g., "2 hours ago")
     */
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    },

    /**
     * Get type badge info
     */
    getTypeBadge(type) {
        const badges = {
            photo: { icon: '📸', label: 'Photo' },
            memory: { icon: '💭', label: 'Memory' },
            voice: { icon: '🎙️', label: 'Voice Note' },
            guestbook: { icon: '✉️', label: 'Message' },
            recipe: { icon: '🍳', label: 'Recipe' },
            candle_note: { icon: '🕯️', label: 'Candle Note' }
        };
        return badges[type] || { icon: '📝', label: 'Content' };
    },

    /**
     * Initialize demo data for testing
     */
    initializeDemoData(memorialId) {
        // Set demo user as owner
        this.setCurrentUser('sarah@example.com');

        // Set permissions
        this.savePermissions(memorialId, {
            memorialId: memorialId,
            owner: 'sarah@example.com',
            editors: ['elizabeth@example.com'],
            viewers: ['friend@example.com'],
            pendingInvites: []
        });

        // Add some demo pending items
        const pendingKey = `ff_memorial_${memorialId}_pending`;
        localStorage.setItem(pendingKey, JSON.stringify({
            memorialId: memorialId,
            items: [
                {
                    id: 'demo_pending_1',
                    type: 'memory',
                    content: {
                        text: 'Grandma always made the best cookies for Christmas. I miss her warm hugs.',
                        authorName: 'Emily',
                        authorRelation: 'Granddaughter'
                    },
                    submittedBy: 'emily@example.com',
                    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    status: 'pending',
                    reportedBy: null,
                    isReport: false
                },
                {
                    id: 'demo_pending_2',
                    type: 'guestbook',
                    content: {
                        message: 'Margaret was such a wonderful neighbor. She always had a kind word and a smile.',
                        name: 'Tom Wilson'
                    },
                    submittedBy: 'tom@example.com',
                    submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    status: 'pending',
                    reportedBy: null,
                    isReport: false
                }
            ]
        }));

        console.log('Demo moderation data initialized for memorial:', memorialId);
    }
};

// Export for global use
window.ForeverFieldsModeration = ForeverFieldsModeration;

// Shorthand alias
window.FFMod = ForeverFieldsModeration;
