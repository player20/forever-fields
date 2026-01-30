/**
 * Forever Fields - Undo System
 * Provides undo/redo functionality for form actions
 */

(function() {
    'use strict';

    class UndoSystem {
        constructor(maxHistory = 50) {
            this.history = [];
            this.future = [];
            this.maxHistory = maxHistory;
            this.isUndoing = false;
        }

        // Record an action
        record(action) {
            if (this.isUndoing) return;

            this.history.push(action);
            this.future = []; // Clear redo stack

            // Limit history size
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }

            this.updateUI();
        }

        // Undo last action
        undo() {
            if (this.history.length === 0) return null;

            this.isUndoing = true;
            const action = this.history.pop();
            this.future.push(action);

            if (action.undo && typeof action.undo === 'function') {
                action.undo();
            }

            this.isUndoing = false;
            this.updateUI();

            return action;
        }

        // Redo last undone action
        redo() {
            if (this.future.length === 0) return null;

            this.isUndoing = true;
            const action = this.future.pop();
            this.history.push(action);

            if (action.redo && typeof action.redo === 'function') {
                action.redo();
            }

            this.isUndoing = false;
            this.updateUI();

            return action;
        }

        // Check if undo is available
        canUndo() {
            return this.history.length > 0;
        }

        // Check if redo is available
        canRedo() {
            return this.future.length > 0;
        }

        // Clear all history
        clear() {
            this.history = [];
            this.future = [];
            this.updateUI();
        }

        // Update UI elements
        updateUI() {
            const undoBtn = document.querySelector('[data-undo]');
            const redoBtn = document.querySelector('[data-redo]');

            if (undoBtn) {
                undoBtn.disabled = !this.canUndo();
            }
            if (redoBtn) {
                redoBtn.disabled = !this.canRedo();
            }
        }

        // Initialize keyboard shortcuts
        initKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + Z for undo
                if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    this.undo();
                }
                // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
                if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                    e.preventDefault();
                    this.redo();
                }
            });
        }
    }

    // Create global instance
    window.undoSystem = new UndoSystem();

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        window.undoSystem.initKeyboardShortcuts();

        // Connect undo/redo buttons
        document.querySelectorAll('[data-undo]').forEach(btn => {
            btn.addEventListener('click', () => window.undoSystem.undo());
        });
        document.querySelectorAll('[data-redo]').forEach(btn => {
            btn.addEventListener('click', () => window.undoSystem.redo());
        });
    });
})();
