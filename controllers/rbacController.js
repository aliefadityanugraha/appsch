"use strict";

const Role = require('../models/Role');
const User = require('../models/User');
const logger = require('../config/logger');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');

class RBACController {
    /**
     * Display RBAC Control Dashboard
     */
    static async dashboard(req, res) {
        try {
            const roles = await Role.query().orderBy('createdAt', 'desc');
            const users = await User.query().withGraphFetched('userRole');
            
            // Calculate statistics
            const stats = {
                totalRoles: roles.length,
                totalUsers: users.length,
                activeUsers: users.filter(u => u.isActive).length,
                recentChanges: 0 // This would come from audit log
            };
            
            res.render('rbac-control', {
                title: 'RBAC Control Dashboard',
                role: roles,
                users: users,
                stats: stats,
                layout: 'layouts/main-layouts',
                req: req.path
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
            const { changes } = req.body;
            
            if (!Array.isArray(changes)) {
                throw new ValidationError('Invalid changes format');
            }
            
            // Group changes by role
            const roleChanges = {};
            changes.forEach(change => {
                if (!roleChanges[change.roleId]) {
                    roleChanges[change.roleId] = [];
                }
                roleChanges[change.roleId].push(change);
            });
            
            // Update each role's permissions
            for (const [roleId, rolePermissions] of Object.entries(roleChanges)) {
                const role = await Role.query().findById(roleId);
                if (!role) {
                    throw new NotFoundError(`Role with ID ${roleId} not found`);
                }
                
                // Build new permission string
                let newPermissions = '';
                rolePermissions.forEach(perm => {
                    if (perm.enabled && !newPermissions.includes(perm.permission)) {
                        newPermissions += perm.permission;
                    }
                });
                
                // Update role
                await Role.query()
                    .findById(roleId)
                    .patch({ permission: newPermissions });
                
                // Log the change
                logger.info('Permission matrix updated', {
                    roleId: roleId,
                    roleName: role.role,
                    oldPermissions: role.permission,
                    newPermissions: newPermissions,
                    userId: req.user?.userId,
                    ip: req.ip
                });
            }
            
            res.json({
                success: true,
                message: 'Permission matrix updated successfully'
            });
            
        } catch (error) {
            logger.error('Error updating permission matrix', {
                error: error.message,
                stack: error.stack,
                userId: req.user?.userId,
                body: req.body
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
            
            const users = await User.query()
                .withGraphFetched('role')
                .where(builder => {
                    builder
                        .where('name', 'ilike', `%${query}%`)
                        .orWhere('email', 'ilike', `%${query}%`);
                })
                .limit(limit);
            
            res.json({
                success: true,
                users: users.map(user => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    currentRole: user.role ? {
                        id: user.role.id,
                        name: user.role.role
                    } : null,
                    isActive: user.isActive
                }))
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
            
            // Validate input
            if (!userId || !roleId) {
                throw new ValidationError('User ID and Role ID are required');
            }
            
            // Check if user exists
            const user = await User.query().findById(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }
            
            // Check if role exists
            const role = await Role.query().findById(roleId);
            if (!role) {
                throw new NotFoundError('Role not found');
            }
            
            // Update user role
            const oldRole = await User.query()
                .findById(userId)
                .withGraphFetched('role');
            
            await User.query()
                .findById(userId)
                .patch({ role: roleId });
            
            // Log the change
            logger.info('User role assigned', {
                userId: userId,
                userName: user.name,
                userEmail: user.email,
                oldRole: oldRole.role?.role || 'None',
                newRole: role.role,
                assignedBy: req.user?.userId,
                ip: req.ip
            });
            
            res.json({
                success: true,
                message: `Role '${role.role}' assigned to user '${user.name}' successfully`
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
                    .where('role', role.id)
                    .resultSize();
                
                distribution.push({
                    roleId: role.id,
                    roleName: role.role,
                    userCount: userCount,
                    permissions: role.permission.split('').map(p => parseInt(p))
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
            const { filter, date, limit = 50 } = req.query;
            
            // This is a placeholder - in a real implementation,
            // you would have an audit_logs table
            const auditEntries = [
                {
                    id: 1,
                    action: 'role_created',
                    description: 'Created new role: Administrator',
                    userId: 'admin@example.com',
                    ip: '192.168.1.1',
                    timestamp: new Date().toISOString(),
                    details: {
                        roleName: 'Administrator',
                        permissions: '1234'
                    }
                },
                {
                    id: 2,
                    action: 'permission_updated',
                    description: 'Updated permissions for Editor role',
                    userId: 'admin@example.com',
                    ip: '192.168.1.1',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    details: {
                        roleName: 'Editor',
                        oldPermissions: '12',
                        newPermissions: '123'
                    }
                }
            ];
            
            // Apply filters
            let filteredEntries = auditEntries;
            
            if (filter && filter !== 'all') {
                filteredEntries = filteredEntries.filter(entry => 
                    entry.action === filter
                );
            }
            
            if (date) {
                const filterDate = new Date(date);
                filteredEntries = filteredEntries.filter(entry => {
                    const entryDate = new Date(entry.timestamp);
                    return entryDate.toDateString() === filterDate.toDateString();
                });
            }
            
            res.json({
                success: true,
                entries: filteredEntries.slice(0, limit)
            });
            
        } catch (error) {
            logger.error('Error getting audit trail', {
                error: error.message,
                query: req.query,
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
            const { operation, roleIds, targetRoleId } = req.body;
            
            switch (operation) {
                case 'delete_multiple':
                    await Role.query().delete().whereIn('id', roleIds);
                    logger.info('Bulk role deletion', {
                        deletedRoles: roleIds,
                        userId: req.user?.userId
                    });
                    break;
                    
                case 'copy_permissions':
                    const sourceRole = await Role.query().findById(roleIds[0]);
                    if (!sourceRole) {
                        throw new NotFoundError('Source role not found');
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
                    throw new ValidationError('Invalid bulk operation');
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