"use strict";

const jwt = require("jsonwebtoken");
const Role = require('../models/Role');
const User = require('../models/User');

/**
 * Role Middleware Class
 * Handles role-based access control
 */
class RoleMiddleware {
    constructor() {
        this.secretKey = process.env.ACCESS_SECRET_KEY;
        this.roleMapping = {
            1: 'Administrator',
            2: 'Manager',
            3: 'User'
        };
    }

    /**
     * Verify session token and get user
     * @param {Object} req - Express request object
     * @returns {Object|null} Decoded token or null
     */
    verifyToken(req) {
        const session = req.session;

        if (!session || !session.token) {
            return null;
        }

        try {
            const token = jwt.verify(session.token, this.secretKey);
            if (!token || !token.userId) {
                return null;
            }
            return token;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get user role from database
     * @param {number} roleId - User's role ID
     * @returns {Object|null} Role object or null
     */
    async getUserRole(roleId) {
        // Try to find by roleId first
        let findRole = await Role.query().where('roleId', roleId);

        // Fallback to role name if roleId not found
        if (findRole.length === 0) {
            const roleName = this.roleMapping[roleId];
            if (roleName) {
                const fallbackRole = await Role.query().where('role', roleName).first();
                if (fallbackRole) {
                    findRole = [fallbackRole];
                }
            }
        }

        return findRole.length > 0 ? findRole[0] : null;
    }

    /**
     * Check if user has required permission
     * @param {string} userPermissions - User's permissions
     * @param {string} requiredPerm - Required permission
     * @returns {boolean} Whether user has permission
     */
    hasPermission(userPermissions, requiredPerm) {
        const permStr = String(userPermissions);
        const requiredPermStr = String(requiredPerm);
        return permStr.includes(requiredPermStr);
    }

    /**
     * Middleware to check if user has required role/permission
     * @param {string} perm - Required permission
     * @returns {Function} Express middleware function
     */
    isRole(perm) {
        return async (req, res, next) => {
            try {
                const token = this.verifyToken(req);

                if (!token) {
                    return res.status(401).redirect('/auth/login');
                }

                const user = await User.query().findById(token.userId);

                if (!user) {
                    return res.status(401).redirect('/auth/login');
                }

                const userRole = await this.getUserRole(user.role);

                if (!userRole) {
                    return res.status(403).json({ error: 'Role not found' });
                }

                const userPermissions = userRole.permission;

                if (this.hasPermission(userPermissions, perm)) {
                    req.user = {
                        ...req.user,
                        role: user.role,
                        permissions: userPermissions
                    };
                    next();
                } else {
                    return res.status(403).render('error', {
                        layout: 'layouts/main-layouts',
                        title: 'Access Denied',
                        message: 'You do not have permission to access this resource',
                        statusCode: 403,
                        req: req.path
                    });
                }
            } catch (error) {
                if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                    return res.status(401).redirect('/auth/login');
                }
                return res.status(500).json({ error: 'Internal server error' });
            }
        };
    }

    /**
     * Middleware to require specific role level
     * @param {number} roleLevel - Required role level
     * @returns {Function} Express middleware function
     */
    requireRoleLevel(roleLevel) {
        return async (req, res, next) => {
            try {
                const token = this.verifyToken(req);

                if (!token) {
                    return res.status(401).redirect('/auth/login');
                }

                const user = await User.query().findById(token.userId);

                if (!user) {
                    return res.status(401).redirect('/auth/login');
                }

                if (user.role > roleLevel) {
                    return res.status(403).render('error', {
                        layout: 'layouts/main-layouts',
                        title: 'Access Denied',
                        message: 'Insufficient role level',
                        statusCode: 403,
                        req: req.path
                    });
                }

                req.user = { ...req.user, role: user.role };
                next();
            } catch (error) {
                if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                    return res.status(401).redirect('/auth/login');
                }
                return res.status(500).json({ error: 'Internal server error' });
            }
        };
    }
}

// Create singleton instance
const roleMiddleware = new RoleMiddleware();

// Export class and convenience method for backward compatibility
module.exports = {
    RoleMiddleware,
    isRole: (perm) => roleMiddleware.isRole(perm),
    requireRoleLevel: (level) => roleMiddleware.requireRoleLevel(level)
};
