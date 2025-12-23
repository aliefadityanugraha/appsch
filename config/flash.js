"use strict";

/**
 * Flash Message Middleware Class
 * Handles flash messages for displaying notifications to users
 */
class FlashMiddleware {
    constructor() {
        this.messageTypes = ['error', 'success', 'warning', 'info'];
    }

    /**
     * Get flash messages from request
     * @param {Object} req - Express request object
     * @returns {Object} Flash messages object
     */
    getMessages(req) {
        const messages = {};
        
        for (const type of this.messageTypes) {
            const flashMessages = req.flash(type);
            messages[type] = flashMessages.length > 0 ? flashMessages[0] : null;
        }
        
        return messages;
    }

    /**
     * Flash middleware function
     * @returns {Function} Express middleware function
     */
    middleware() {
        return (req, res, next) => {
            res.locals.messages = this.getMessages(req);
            // Keep backward compatibility
            res.locals.message = req.flash("message");
            next();
        };
    }

    /**
     * Set flash message helper
     * @param {Object} req - Express request object
     * @param {string} type - Message type (error, success, warning, info)
     * @param {string} message - Message content
     */
    setMessage(req, type, message) {
        if (this.messageTypes.includes(type)) {
            req.flash(type, message);
        }
    }

    /**
     * Set error flash message
     * @param {Object} req - Express request object
     * @param {string} message - Error message
     */
    setError(req, message) {
        this.setMessage(req, 'error', message);
    }

    /**
     * Set success flash message
     * @param {Object} req - Express request object
     * @param {string} message - Success message
     */
    setSuccess(req, message) {
        this.setMessage(req, 'success', message);
    }

    /**
     * Set warning flash message
     * @param {Object} req - Express request object
     * @param {string} message - Warning message
     */
    setWarning(req, message) {
        this.setMessage(req, 'warning', message);
    }

    /**
     * Set info flash message
     * @param {Object} req - Express request object
     * @param {string} message - Info message
     */
    setInfo(req, message) {
        this.setMessage(req, 'info', message);
    }
}

// Create singleton instance
const flashMiddleware = new FlashMiddleware();

// Export class and convenience method for backward compatibility
module.exports = {
    FlashMiddleware,
    flash: flashMiddleware.middleware(),
    setError: (req, msg) => flashMiddleware.setError(req, msg),
    setSuccess: (req, msg) => flashMiddleware.setSuccess(req, msg),
    setWarning: (req, msg) => flashMiddleware.setWarning(req, msg),
    setInfo: (req, msg) => flashMiddleware.setInfo(req, msg)
};
