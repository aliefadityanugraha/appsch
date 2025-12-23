"use strict";

const Role = require('../models/Role');
const User = require('../models/User');
const logger = require('../config/logger');

class RBACController {
    /**
     * Display RBAC Control Dashboard
     */
    static async dashboard(req, res) {
        try {
            const roles = await Role.query().orderBy('createdAt', 'desc');
            
            // Convert permission to string for view compatibility
            const rolesWithStringPermission = roles.map(r => ({
                ...r,
                permission: String(r.permission)
            }));
            
            const users = await User.query();
            
            // Count users per role
            const roleCounts = {};
            for (const role of roles) {
                const count = await User.query().where('role', role.roleId).resultSize();
                roleCounts[role.id] = count;
            }
            
            const stats = {
                totalRoles: roles.length,
                totalUsers: users.length,
                activeUsers: users.filter(u => u.status).length,
                recentChanges: 0
            };
            
            res.render('rbac-control', {
                title: 'RBAC Control Dashboard',
                role: rolesWithStringPermission,
                users: users,
                stats: stats,
                roleCounts: roleCounts,
                layout: 'layouts/main-layouts',
                req: req.path,
                csrfToken: res.locals.csrfToken || req.session.csrfToken || '',
                messages: {
                    success: req.flash('success'),
                    error: req.flash('error'),
                    warning: req.flash('warning')
                }
            });
        } catch (error) {
            logger.error('Error loading RBAC dashboard', {
                error: error.message,
                stack: error.stack,
                userId: req.user?.userId
            });
            
            res.status(500).render('error/500', {
                title: 'Server Error',
                message: 'Failed to load RBAC dashboard'
            });
        }
    }
    
    /**
     * Update permission matrix
     */
    static async updatePermissionMatrix(req, res) {
        try {
            const { roleId, permissions } = req.body;
            
            if (!roleId) {
                return res.status(400).json({
                    success: false,
                    message: 'Role ID is required'
                });
            }
            
            const role = await Role.query().findById(roleId);
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }
            
            // Build permission string from array
            const newPermissions = Array.isArray(permissions) 
                ? permissions.sort().join('') 
                : String(permissions);
            
            const oldPermissions = role.permission;
            
            await Role.query()
                .findById(roleId)
                .patch({ permission: newPermissions });
            
            logger.info('Permission matrix updated', {
                roleId: roleId,
                roleName: role.role,
                oldPermissions: oldPermissions,
                newPermissions: newPermissions,
                userId: req.user?.userId,
                ip: req.ip
            });
            
            res.json({
                success: true,
                message: 'Permission updated successfully'
            });
            
        } catch (error) {
            logger.error('Error updating permission matrix', {
                error: error.message,
                userId: req.user?.userId
            });
            
            res.status(500).json({
                success: false,
                message: 'Failed to update permission matrix',
                error: error.message
            });
        }
    }
    
    /**
     * Search users for role assignment
     */
    static async searchUsers(req, res) {
        try {
            const { query, limit = 10 } = req.query;
            
            if (!query || query.length < 2) {
                return res.json({
                    success: true,
                    users: []
                });
            }
            
            // Use LIKE for MySQL compatibility
            const users = await User.query()
                .where(builder => {
                    builder
                        .where('email', 'like', `%${query}%`);
                })
                .limit(parseInt(limit));
            
            // Get role info for each user
            const usersWithRoles = await Promise.all(users.map(async (user) => {
                const role = await Role.query().where('roleId', user.role).first();
                return {
                    id: user.id,
                    email: user.email,
                    currentRole: role ? {
                        id: role.id,
                        roleId: role.roleId,
                        name: role.role
                    } : null,
                    isActive: user.status
                };
            }));
            
            res.json({
                success: true,
                users: usersWithRoles
            });
            
        } catch (error) {
            logger.error('Error searching users', {
                error: error.message,
                query: req.query,
                userId: req.user?.userId
            });
            
            res.status(500).json({
                success: false,
                message: 'Failed to search users'
            });
        }
    }
    
    /**
     * Assign role to user
     */
    static async assignRole(req, res) {
        try {
            const { userId, roleId } = req.body;
            
            if (!userId || !roleId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID and Role ID are required'
                });
            }
            
            // Check if user exists
            const user = await User.query().findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Check if role exists (roleId is the UUID)
            const role = await Role.query().findById(roleId);
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }
            
            const oldRoleId = user.role;
            const oldRole = await Role.query().where('roleId', oldRoleId).first();
            
            // Update user role with roleId (integer), not UUID
            await User.query()
                .findById(userId)
                .patch({ role: role.roleId });
            
            logger.info('User role assigned', {
                userId: userId,
                userEmail: user.email,
                oldRole: oldRole?.role || 'None',
                newRole: role.role,
                assignedBy: req.user?.userId,
                ip: req.ip
            });
            
            res.json({
                success: true,
                message: `Role '${role.role}' assigned to user '${user.email}' successfully`
            });
            
        } catch (error) {
            logger.error('Error assigning user role', {
                error: error.message,
                body: req.body,
                userId: req.user?.userId
            });
            
            res.status(500).json({
                success: false,
                message: 'Failed to assign user role',
                error: error.message
            });
        }
    }
    
    /**
     * Get role distribution statistics
     */
    static async getRoleStats(req, res) {
        try {
            const roles = await Role.query();
            const distribution = [];
            
            for (const role of roles) {
                const userCount = await User.query()
                    .where('role', role.roleId)
                    .resultSize();
                
                const permStr = String(role.permission);
                distribution.push({
                    roleId: role.id,
                    roleNumId: role.roleId,
                    roleName: role.role,
                    userCount: userCount,
                    permissions: permStr.split('').map(p => parseInt(p))
                });
            }
            
            res.json({
                success: true,
                distribution: distribution
            });
            
        } catch (error) {
            logger.error('Error getting role distribution', {
                error: error.message,
                userId: req.user?.userId
            });
            
            res.status(500).json({
                success: false,
                message: 'Failed to get role distribution'
            });
        }
    }
    
    /**
     * Get audit trail
     */
    static async getAuditTrail(req, res) {
        try {
            const { filter, limit = 50 } = req.query;
            
            // Placeholder - implement with actual audit_logs table
            const auditEntries = [
                {
                    id: 1,
                    action: 'role_created',
                    description: 'System initialized with default roles',
                    userId: 'system',
                    ip: '127.0.0.1',
                    timestamp: new Date().toISOString(),
                    details: { roleName: 'Administrator', permissions: '1234' }
                }
            ];
            
            let filteredEntries = auditEntries;
            if (filter && filter !== 'all') {
                filteredEntries = filteredEntries.filter(entry => entry.action === filter);
            }
            
            res.json({
                success: true,
                entries: filteredEntries.slice(0, parseInt(limit))
            });
            
        } catch (error) {
            logger.error('Error getting audit trail', {
                error: error.message,
                userId: req.user?.userId
            });
            
            res.status(500).json({
                success: false,
                message: 'Failed to get audit trail'
            });
        }
    }
    
    /**
     * Bulk role operations
     */
    static async bulkRoleOperations(req, res) {
        try {
            const { operation, roleIds } = req.body;
            
            if (!operation || !roleIds || !Array.isArray(roleIds)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid request parameters'
                });
            }
            
            switch (operation) {
                case 'delete_multiple':
                    // Don't allow deleting all roles
                    const remainingRoles = await Role.query().whereNotIn('id', roleIds).resultSize();
                    if (remainingRoles === 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Cannot delete all roles'
                        });
                    }
                    
                    await Role.query().delete().whereIn('id', roleIds);
                    logger.info('Bulk role deletion', {
                        deletedRoles: roleIds,
                        userId: req.user?.userId
                    });
                    break;
                    
                case 'copy_permissions':
                    if (roleIds.length < 2) {
                        return res.status(400).json({
                            success: false,
                            message: 'Need at least 2 roles for copy operation'
                        });
                    }
                    
                    const sourceRole = await Role.query().findById(roleIds[0]);
                    if (!sourceRole) {
                        return res.status(404).json({
                            success: false,
                            message: 'Source role not found'
                        });
                    }
                    
                    await Role.query()
                        .whereIn('id', roleIds.slice(1))
                        .patch({ permission: sourceRole.permission });
                    
                    logger.info('Bulk permission copy', {
                        sourceRole: sourceRole.id,
                        targetRoles: roleIds.slice(1),
                        permissions: sourceRole.permission,
                        userId: req.user?.userId
                    });
                    break;
                    
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid bulk operation'
                    });
            }
            
            res.json({
                success: true,
                message: 'Bulk operation completed successfully'
            });
            
        } catch (error) {
            logger.error('Error in bulk role operations', {
                error: error.message,
                body: req.body,
                userId: req.user?.userId
            });
            
            res.status(500).json({
                success: false,
                message: 'Failed to perform bulk operation',
                error: error.message
            });
        }
    }
}

module.exports = RBACController;