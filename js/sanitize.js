/**
 * HTML Sanitization Utility
 * Prevents XSS attacks by escaping dangerous characters
 *
 * Usage:
 *   const safe = Sanitizer.escapeHtml(userInput);
 *   element.textContent = userInput; // Always safe
 *   Sanitizer.createTextElement('div', userInput); // Safe DOM creation
 */
const Sanitizer = {
  /**
   * Escape HTML special characters to prevent XSS
   * Converts: < > & " ' to their HTML entities
   */
  escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';

    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Sanitize an entire object recursively
   * Useful for sanitizing API responses before display
   */
  sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return this.escapeHtml(obj);
    }

    const sanitized = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = this.sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  },

  /**
   * Create a DOM element with text content (always safe)
   * Preferred method for creating elements with user data
   *
   * @param {string} tag - HTML tag name (e.g., 'div', 'span')
   * @param {string} text - Text content (will be auto-escaped)
   * @returns {HTMLElement}
   */
  createTextElement(tag, text) {
    const element = document.createElement(tag);
    element.textContent = text; // textContent always escapes
    return element;
  },

  /**
   * Create a DOM element with optional className and text
   *
   * @param {string} tag - HTML tag name
   * @param {string} className - CSS class name(s)
   * @param {string} text - Text content
   * @returns {HTMLElement}
   */
  createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (text !== undefined && text !== null) {
      element.textContent = text;
    }
    return element;
  },

  /**
   * Sanitize a URL to prevent javascript: protocol attacks
   *
   * @param {string} url - URL to sanitize
   * @returns {string} - Safe URL or empty string
   */
  sanitizeUrl(url) {
    if (!url) return '';

    const urlString = String(url).trim().toLowerCase();

    // Block javascript: and data: URIs
    if (urlString.startsWith('javascript:') ||
        urlString.startsWith('data:') ||
        urlString.startsWith('vbscript:')) {
      return '';
    }

    return url;
  },

  /**
   * Strip all HTML tags from a string
   * Useful for plain text display of rich content
   *
   * @param {string} html - HTML string
   * @returns {string} - Plain text
   */
  stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
};

// Make Sanitizer available globally
window.Sanitizer = Sanitizer;
