"use strict";

const jwt = require("jsonwebtoken");
const Role = require('../models/Role');
const User = require('../models/User');
const { AuthenticationError, AuthorizationError } = require('./errorHandler');
const logger = require('../config/logger');

/**
 * Permission-based access control middleware
 * More flexible than role-based, allows for granular permissions
 */
class RBACMiddleware {
    constructor() {
        // Cache for user permissions to avoid repeated database queries
        this.permissionCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Middleware to require specific permission
     * @param {string} permission - Required permission
     * @returns {Function} Express middleware function
     */
    requirePermission(permission) {
        return async (req, res, next) => {
            try {
                const user = await this.authenticateUser(req);
                const hasPermission = await this.checkUserPermission(user.userId, permission);
                
                if (!hasPermission) {
                    logger.warn('Access denied', {
                        userId: user.userId,
                        permission,
                        url: req.originalUrl,
                        method: req.method,
                        ip: req.ip
                    });
                    throw new AuthorizationError(`Access denied: ${permission} permission required`);
                }
                
                req.user = user;
                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Middleware to require any of the specified permissions
     * @param {Array<string>} permissions - Array of permissions (user needs at least one)
     * @returns {Function} Express middleware function
     */
    requireAnyPermission(permissions) {
        return async (req, res, next) => {
            try {
                const user = await this.authenticateUser(req);
                const userPermissions = await this.getUserPermissions(user.userId);
                
                const hasAnyPermission = permissions.some(permission => 
                    userPermissions.includes(permission)
                );
                
                if (!hasAnyPermission) {
                    logger.warn('Access denied - no required permissions', {
                        userId: user.userId,
                        requiredPermissions: permissions,
                        userPermissions,
                        url: req.originalUrl,
                        method: req.method,
                        ip: req.ip
                    });
                    throw new AuthorizationError(`Access denied: One of [${permissions.join(', ')}] permissions required`);
                }
                
                req.user = user;
                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Middleware to require all specified permissions
     * @param {Array<string>} permissions - Array of permissions (user needs all)
     * @returns {Function} Express middleware function
     */
    requireAllPermissions(permissions) {
        return async (req, res, next) => {
            try {
                const user = await this.authenticateUser(req);
                const userPermissions = await this.getUserPermissions(user.userId);
                
                const hasAllPermissions = permissions.every(permission => 
                    userPermissions.includes(permission)
                );
                
                if (!hasAllPermissions) {
                    const missingPermissions = permissions.filter(permission => 
                        !userPermissions.includes(permission)
                    );
                    
                    logger.warn('Access denied - missing permissions', {
                        userId: user.userId,
                        missingPermissions,
                        userPermissions,
                        url: req.originalUrl,
                        method: req.method,
                        ip: req.ip
                    });
                    throw new AuthorizationError(`Access denied: Missing permissions [${missingPermissions.join(', ')}]`);
                }
                
                req.user = user;
                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Legacy role-based middleware for backward compatibility
     * @param {number} roleLevel - Required role level
     * @returns {Function} Express middleware function
     */
    requireRole(roleLevel) {
        return async (req, res, next) => {
            try {
                const user = await this.authenticateUser(req);
                const userData = await User.query().findById(user.userId);
                
                if (!userData || userData.role !== roleLevel) {
                    logger.warn('Access denied - insufficient role', {
                        userId: user.userId,
                        userRole: userData?.role,
                        requiredRole: roleLevel,
                        url: req.originalUrl,
                        method: req.method,
                        ip: req.ip
                    });
                    throw new AuthorizationError(`Access denied: Role level ${roleLevel} required`);
                }
                
                req.user = user;
                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Authenticate user from session token
     * @param {Object} req - Express request object
     * @returns {Object} Decoded user token
     */
    async authenticateUser(req) {
        const session = req.session;
        
        if (!session || !session.token) {
            logger.warn('Authentication failed - no session token', {
                url: req.originalUrl,
                method: req.method,
                ip: req.ip
            });
            throw new AuthenticationError('No authentication token provided');
        }

        try {
            const token = jwt.verify(session.token, process.env.ACCESS_SECRET_KEY);
            
            if (!token || !token.userId) {
                throw new AuthenticationError('Invalid token structure');
            }

            return token;
        } catch (error) {
            logger.warn('Authentication failed - invalid token', {
                error: error.message,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip
            });
            
            if (error.name === 'TokenExpiredError') {
                throw new AuthenticationError('Token expired');
            }
            throw new AuthenticationError('Invalid authentication token');
        }
    }

    /**
     * Check if user has specific permission
     * @param {string} userId - User ID
     * @param {string} permission - Permission to check
     * @returns {boolean} Whether user has permission
     */
    async checkUserPermission(userId, permission) {
        const userPermissions = await this.getUserPermissions(userId);
        return userPermissions.includes(permission);
    }

    /**
     * Get all permissions for a user
     * @param {string} userId - User ID
     * @returns {Array<string>} Array of permission strings
     */
    async getUserPermissions(userId) {
        // Check cache first
        const cacheKey = `permissions_${userId}`;
        const cached = this.permissionCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.permissions;
        }

        try {
            const user = await User.query().findById(userId);
            
            if (!user) {
                throw new AuthenticationError('User not found');
            }

            // Get role permissions
            const roleMapping = {
                1: 'Administrator',
                2: 'Manager', 
                3: 'User'
            };
            
            const roleName = roleMapping[user.role];
            if (!roleName) {
                logger.warn('Invalid role ID', { userId, role: user.role });
                return [];
            }
            
            const role = await Role.query().where('role', roleName).first();
            
            if (!role || !role.permission) {
                logger.warn('Role not found or no permissions', { userId, roleName });
                return [];
            }

            // Parse permissions from role
            let permissions = [];
            try {
                const rolePermissions = typeof role.permission === 'string' 
                    ? JSON.parse(role.permission) 
                    : role.permission;
                
                permissions = this.extractPermissions(rolePermissions);
            } catch (error) {
                logger.error('Failed to parse role permissions', {
                    userId,
                    roleName,
                    permission: role.permission,
                    error: error.message
                });
                return [];
            }

            // Cache the result
            this.permissionCache.set(cacheKey, {
                permissions,
                timestamp: Date.now()
            });

            return permissions;
        } catch (error) {
            logger.error('Failed to get user permissions', {
                userId,
                error: error.message
            });
            return [];
        }
    }

    /**
     * Extract permission strings from role permission object
     * @param {Object} rolePermissions - Role permission object
     * @returns {Array<string>} Array of permission strings
     */
    extractPermissions(rolePermissions) {
        const permissions = [];
        
        // Map role permissions to specific permission strings
        if (rolePermissions.posts === 1) {
            permissions.push('posts.read', 'posts.create', 'posts.update', 'posts.delete');
        }
        
        if (rolePermissions.categories === 1) {
            permissions.push('categories.read', 'categories.create', 'categories.update', 'categories.delete');
        }
        
        if (rolePermissions.role_management === 1) {
            permissions.push('roles.read', 'roles.create', 'roles.update', 'roles.delete');
        }
        
        if (rolePermissions.user_management === 1) {
            permissions.push('users.read', 'users.create', 'users.update', 'users.delete');
            permissions.push('staff.read', 'staff.create', 'staff.update', 'staff.delete');
        }

        return permissions;
    }

    /**
     * Clear permission cache for a user
     * @param {string} userId - User ID
     */
    clearUserCache(userId) {
        const cacheKey = `permissions_${userId}`;
        this.permissionCache.delete(cacheKey);
    }

    /**
     * Clear all permission cache
     */
    clearAllCache() {
        this.permissionCache.clear();
    }
}

// Create singleton instance
const rbacMiddleware = new RBACMiddleware();

// Export both the class and convenience functions
module.exports = {
    RBACMiddleware,
    requirePermission: (permission) => rbacMiddleware.requirePermission(permission),
    requireAnyPermission: (permissions) => rbacMiddleware.requireAnyPermission(permissions),
    requireAllPermissions: (permissions) => rbacMiddleware.requireAllPermissions(permissions),
    requireRole: (roleLevel) => rbacMiddleware.requireRole(roleLevel),
    clearUserCache: (userId) => rbacMiddleware.clearUserCache(userId),
    clearAllCache: () => rbacMiddleware.clearAllCache(),
    
    // Legacy compatibility
    isRole: (roleLevel) => rbacMiddleware.requireRole(roleLevel)
};