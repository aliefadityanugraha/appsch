"use strict";

const jwt = require("jsonwebtoken");

/**
 * Authentication Middleware Class
 * Handles user authentication and token verification
 */
class AuthMiddleware {
    constructor() {
        this.secretKey = process.env.ACCESS_SECRET_KEY;
    }

    /**
     * Check if user is already logged in
     * Redirects to home if user has valid session
     * @returns {Function} Express middleware function
     */
    isLogin() {
        return (req, res, next) => {
            const { token } = req.session;
            if (token) {
                return res.redirect("/");
            }
            next();
        };
    }

    /**
     * Authenticate user token from session
     * Redirects to login if no token or invalid token
     * @returns {Function} Express middleware function
     */
    authenticateToken() {
        return (req, res, next) => {
            const { token } = req.session;

            if (!token) {
                return res.status(401).redirect("/auth/login");
            }

            jwt.verify(token, this.secretKey, (err, user) => {
                if (err) {
                    if (req.path === "/auth/refresh-token") {
                        return res.status(403).json({ message: "Forbidden" });
                    }
                    return res.redirect("/auth/refresh-token");
                }

                req.user = user;
                next();
            });
        };
    }

    /**
     * Verify token and return user data (for API routes)
     * @returns {Function} Express middleware function
     */
    verifyToken() {
        return (req, res, next) => {
            const { token } = req.session;

            if (!token) {
                return res.status(401).json({ 
                    success: false, 
                    message: "No authentication token provided" 
                });
            }

            try {
                const decoded = jwt.verify(token, this.secretKey);
                req.user = decoded;
                next();
            } catch (err) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Invalid or expired token" 
                });
            }
        };
    }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export class and convenience methods for backward compatibility
module.exports = {
    AuthMiddleware,
    isLogin: authMiddleware.isLogin(),
    authenticateToken: authMiddleware.authenticateToken(),
    verifyToken: authMiddleware.verifyToken()
};
