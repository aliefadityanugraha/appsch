"use strict";

const crypto = require('crypto');

/**
 * CSRF Protection Middleware Class
 * Generates and validates CSRF tokens to prevent Cross-Site Request Forgery attacks
 */
class CSRFMiddleware {
    constructor() {
        this.tokenLength = 32;
        this.safeMethods = ['GET', 'HEAD', 'OPTIONS'];
        this.skipPaths = ['/api/health/error-report', '/health/error-report'];
    }

    /**
     * Generate a secure random CSRF token
     * @returns {string} Generated token
     */
    generateToken() {
        return crypto.randomBytes(this.tokenLength).toString('hex');
    }

    /**
     * Check if request method is safe (doesn't require CSRF validation)
     * @param {string} method - HTTP method
     * @returns {boolean} Whether method is safe
     */
    isSafeMethod(method) {
        return this.safeMethods.includes(method);
    }

    /**
     * Check if path should skip CSRF validation
     * @param {string} path - Request path
     * @returns {boolean} Whether to skip validation
     */
    shouldSkipPath(path) {
        return this.skipPaths.includes(path);
    }

    /**
     * Get submitted token from request
     * @param {Object} req - Express request object
     * @returns {string|null} Submitted token
     */
    getSubmittedToken(req) {
        return req.body._token || 
               req.headers['x-csrf-token'] || 
               req.headers['csrf-token'];
    }

    /**
     * Validate tokens using timing-safe comparison
     * @param {string} sessionToken - Token from session
     * @param {string} submittedToken - Token from request
     * @returns {boolean} Whether tokens match
     */
    validateTokens(sessionToken, submittedToken) {
        if (!sessionToken || !submittedToken) {
            return false;
        }
        
        try {
            return crypto.timingSafeEqual(
                Buffer.from(sessionToken), 
                Buffer.from(submittedToken)
            );
        } catch {
            return false;
        }
    }

    /**
     * Main CSRF protection middleware for web routes
     * @returns {Function} Express middleware function
     */
    protection() {
        return (req, res, next) => {
            // For safe methods, just generate token for forms
            if (this.isSafeMethod(req.method)) {
                if (!req.session.csrfToken) {
                    req.session.csrfToken = this.generateToken();
                }
                res.locals.csrfToken = req.session.csrfToken;
                return next();
            }

            // Skip for health endpoints
            if (this.shouldSkipPath(req.path)) {
                return next();
            }

            // Validate token for unsafe methods
            const sessionToken = req.session.csrfToken;
            const submittedToken = this.getSubmittedToken(req);

            if (!sessionToken) {
                console.log('❌ CSRF: No session token found');
                return res.status(403).json({
                    error: 'CSRF token missing from session',
                    message: 'Security error: Please refresh the page and try again'
                });
            }

            if (!submittedToken) {
                console.log('❌ CSRF: No token submitted with request');
                return res.status(403).json({
                    error: 'CSRF token missing from request',
                    message: 'Security error: Missing security token'
                });
            }

            if (!this.validateTokens(sessionToken, submittedToken)) {
                console.log('❌ CSRF: Token mismatch');
                console.log('   Session token:', sessionToken.substring(0, 8) + '...');
                console.log('   Submitted token:', submittedToken.substring(0, 8) + '...');

                req.session.csrfToken = this.generateToken();

                return res.status(403).json({
                    error: 'CSRF token mismatch',
                    message: 'Security error: Invalid security token. Please refresh the page and try again'
                });
            }

            console.log('✅ CSRF: Token validated successfully');
            next();
        };
    }

    /**
     * CSRF protection middleware for API routes
     * @returns {Function} Express middleware function
     */
    protectionAPI() {
        return (req, res, next) => {
            if (this.isSafeMethod(req.method)) {
                return next();
            }

            const sessionToken = req.session.csrfToken;
            const submittedToken = this.getSubmittedToken(req);

            if (!sessionToken || !submittedToken) {
                return res.status(403).json({
                    success: false,
                    error: 'CSRF_TOKEN_MISSING',
                    message: 'CSRF token is required for this request'
                });
            }

            if (!this.validateTokens(sessionToken, submittedToken)) {
                req.session.csrfToken = this.generateToken();

                return res.status(403).json({
                    success: false,
                    error: 'CSRF_TOKEN_INVALID',
                    message: 'Invalid CSRF token'
                });
            }

            next();
        };
    }

    /**
     * Get CSRF token endpoint handler
     * @returns {Function} Express route handler
     */
    getToken() {
        return (req, res) => {
            if (!req.session.csrfToken) {
                req.session.csrfToken = this.generateToken();
            }

            res.json({
                success: true,
                csrfToken: req.session.csrfToken
            });
        };
    }

    /**
     * Add paths to skip list
     * @param {string|Array<string>} paths - Path(s) to skip
     */
    addSkipPaths(paths) {
        const pathsArray = Array.isArray(paths) ? paths : [paths];
        this.skipPaths.push(...pathsArray);
    }
}

// Create singleton instance
const csrfMiddleware = new CSRFMiddleware();

// Export class and convenience methods for backward compatibility
module.exports = {
    CSRFMiddleware,
    csrfProtection: csrfMiddleware.protection(),
    csrfProtectionAPI: csrfMiddleware.protectionAPI(),
    getCSRFToken: csrfMiddleware.getToken(),
    generateCSRFToken: () => csrfMiddleware.generateToken()
};
