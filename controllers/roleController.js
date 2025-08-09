"use strict";

const Role = require('../models/Role');

module.exports = {

    roles: async (req, res) => {
        try {
            // Fetch all roles from database
            const roles = await Role.query().orderBy('createdAt', 'desc');
            
            res.render("roles", {
                layout: "layouts/main-layouts",
                title: "Roles",
                req: req.path,
                role: roles // Pass roles data to view
            });
        } catch (error) {
            console.error('Error fetching roles:', error);
            res.render("roles", {
                layout: "layouts/main-layouts",
                title: "Roles",
                req: req.path,
                role: [] // Empty array if error
            });
        }
    },

    insertRole: async (req, res) => {
        try {
            const { _id, role, roleId, description, postPermit, categoryPermit, rolePermit, userPermit, editMode } = req.body;
            
            const permissions = [];
            if (postPermit) permissions.push('1');
            if (categoryPermit) permissions.push('2');
            if (rolePermit) permissions.push('3');
            if (userPermit) permissions.push('4');
            
            if (editMode === 'true' && _id) {
                // Edit existing role
                await Role.query().findById(_id).patch({
                    role,
                    roleId: parseInt(roleId),
                    description,
                    permission: permissions
                });
                console.log('✅ Role updated successfully');
            } else {
                // Insert new role
                await Role.query().insert({
                    role,
                    roleId: parseInt(roleId),
                    permission: permissions,
                    description,
                });
                console.log('✅ Role inserted successfully');
            }
            
            res.redirect('/roles');
        } catch (error) {
            console.error('Error processing role:', error);
            res.status(500).send('Error processing role');
        }
    },

    editRole: async (req, res) => {
        try {
            const { _id, role, roleId, description, postPermit, categoryPermit, rolePermit, userPermit } = req.body;
            
            const permissions = [];
            if (postPermit) permissions.push('1');
            if (categoryPermit) permissions.push('2');
            if (rolePermit) permissions.push('3');
            if (userPermit) permissions.push('4');
            
            await Role.query().findById(_id).patch({
                role,
                roleId: parseInt(roleId),
                description,
                permission: permissions
            });
            
            res.redirect('/roles');
        } catch (error) {
            console.error('Error editing role:', error);
            res.status(500).send('Error editing role');
        }
    },

    deleteRole: async (req, res) => {
        try {
            const roleId = req.params.id;
            
            // Check if role exists
            const role = await Role.query().findById(roleId);
            if (!role) {
                return res.status(404).send('Role not found');
            }
            
            await Role.query().deleteById(roleId);
            
            console.log('✅ Role deleted successfully');
            res.redirect('/roles');
        } catch (error) {
            console.error('Error deleting role:', error);
            res.status(500).send('Error deleting role');
        }
    }
};