"use strict";

const User = require('../models/User');
const jsonWebToken = require('jsonwebtoken');

/**
 * Password Reset Check Middleware Class
 * Checks if user must reset their password before accessing other pages
 */
class PasswordResetMiddleware {
    constructor() {
        this.secretKey = process.env.ACCESS_SECRET_KEY;
        this.resetPaths = [
            '/auth/force-reset',
            '/auth/reset-password',
            '/auth/logout',
            '/auth/force-reset-password'
        ];
    }

    /**
     * Check if current path should skip password reset check
     * @param {string} path - Current request path
     * @returns {boolean} Whether to skip the check
     */
    shouldSkipPath(path) {
        return this.resetPaths.some(resetPath => path.startsWith(resetPath));
    }

    /**
     * Middleware to check if user must reset password
     * @returns {Function} Express middleware function
     */
    check() {
        return async (req, res, next) => {
            try {
                // Skip if no token
                if (!req.session.token) {
                    return next();
                }

                // Skip if accessing reset password pages
                if (this.shouldSkipPath(req.path)) {
                    return next();
                }

                // Decode token to get user ID
                const decoded = jsonWebToken.verify(req.session.token, this.secretKey);
                
                // Get user from database
                const user = await User.query().findById(decoded.userId);
                
                if (!user) {
                    req.session.destroy();
                    return res.redirect('/auth/login');
                }

                // Check if user must reset password
                if (!user.password || user.mustResetPassword) {
                    console.log(`🔄 User ${user.email} harus reset password`);
                    return res.redirect('/auth/force-reset');
                }

                // Store user data in request
                req.user = {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    status: user.status
                };

                next();

            } catch (error) {
                console.error('Error in checkPasswordReset middleware:', error);
                
                if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                    req.session.destroy();
                    return res.redirect('/auth/login');
                }
                
                next();
            }
        };
    }

    /**
     * Add custom paths to skip list
     * @param {string|Array<string>} paths - Path(s) to add
     */
    addSkipPaths(paths) {
        const pathsArray = Array.isArray(paths) ? paths : [paths];
        this.resetPaths.push(...pathsArray);
    }

    /**
     * Remove paths from skip list
     * @param {string|Array<string>} paths - Path(s) to remove
     */
    removeSkipPaths(paths) {
        const pathsArray = Array.isArray(paths) ? paths : [paths];
        this.resetPaths = this.resetPaths.filter(p => !pathsArray.includes(p));
    }
}

// Create singleton instance
const passwordResetMiddleware = new PasswordResetMiddleware();

// Export class and middleware function for backward compatibility
module.exports = passwordResetMiddleware.check();
module.exports.PasswordResetMiddleware = PasswordResetMiddleware;
module.exports.instance = passwordResetMiddleware;
