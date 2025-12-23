const Role = require('../models/Role');

class RoleController {
    constructor() {
        // Inject dependencies for better testability
        this.Role = Role;
        
        // Permission mapping for better maintainability
        this.permissionMap = {
            postPermit: '1',
            categoryPermit: '2',
            rolePermit: '3',
            userPermit: '4'
        };
    }

    // Helper: Build permissions string from request body
    buildPermissions(body) {
        const permissions = [];
        
        Object.entries(this.permissionMap).forEach(([key, value]) => {
            // Checkbox sends value when checked, undefined when not
            if (body[key] !== undefined && body[key] !== '' && body[key] !== 'false') {
                permissions.push(value);
            }
        });
        
        // Return as string, e.g., "1234" or empty string if none selected
        return permissions.sort().join('') || '';
    }

    // Helper: Prepare role data from request
    prepareRoleData(body) {
        const permissions = this.buildPermissions(body);
        console.log('📝 Building role data:', {
            role: body.role,
            roleId: body.roleId,
            permissions: permissions,
            rawBody: { postPermit: body.postPermit, categoryPermit: body.categoryPermit, rolePermit: body.rolePermit, userPermit: body.userPermit }
        });
        return {
            role: body.role?.trim(),
            roleId: parseInt(body.roleId) || 0,
            description: body.description?.trim(),
            permission: permissions || '0' // Default to '0' if no permission selected
        };
    }

    // Helper: Render roles page
    renderRolesPage(res, req, roles = [], error = null) {
        res.render("roles", {
            layout: "layouts/main-layouts",
            title: "Roles",
            req: req.path,
            role: roles,
            error
        });
    }

    // Route handler: Display roles page
    roles = async (req, res) => {
        try {
            // Fetch all roles from database
            const roles = await this.Role.query().orderBy('createdAt', 'desc');
            
            this.renderRolesPage(res, req, roles);
        } catch (error) {
            console.error('Error fetching roles:', error);
            this.renderRolesPage(res, req, [], 'Failed to load roles');
        }
    }

    // Route handler: Insert or update role
    insertRole = async (req, res) => {
        try {
            const { _id, editMode } = req.body;
            console.log('📝 Insert/Update role request:', { _id, editMode, body: req.body });
            
            const roleData = this.prepareRoleData(req.body);
            console.log('📝 Prepared role data:', roleData);
            
            // Validate required fields
            if (!roleData.role || !roleData.roleId || !roleData.description) {
                req.flash('error', 'Semua field harus diisi');
                return res.redirect('/rbac-control');
            }
            
            if (editMode === 'true' && _id) {
                // Update existing role
                const existingRole = await this.Role.query().findById(_id);
                if (!existingRole) {
                    console.error('❌ Role not found for update:', _id);
                    req.flash('error', 'Role tidak ditemukan');
                    return res.redirect('/rbac-control');
                }
                
                await this.Role.query().findById(_id).patch(roleData);
                console.log('✅ Role updated successfully:', _id);
                req.flash('success', 'Role berhasil diupdate');
            } else {
                // Insert new role
                const newRole = await this.Role.query().insert(roleData);
                console.log('✅ Role inserted successfully:', newRole.id);
                req.flash('success', 'Role berhasil ditambahkan');
            }
            
            res.redirect('/rbac-control');
        } catch (error) {
            console.error('❌ Error processing role:', error);
            req.flash('error', 'Gagal memproses role: ' + error.message);
            res.redirect('/rbac-control');
        }
    }

    // Route handler: Edit role
    editRole = async (req, res) => {
        try {
            const { _id } = req.body;
            console.log('📝 Edit role request:', { _id, body: req.body });
            
            const roleData = this.prepareRoleData(req.body);
            console.log('📝 Prepared role data:', roleData);
            
            if (!_id) {
                req.flash('error', 'Role ID tidak ditemukan');
                return res.redirect('/rbac-control');
            }
            
            // Check if role exists first
            const existingRole = await this.Role.query().findById(_id);
            if (!existingRole) {
                console.error('❌ Role not found:', _id);
                req.flash('error', 'Role tidak ditemukan');
                return res.redirect('/rbac-control');
            }
            
            await this.Role.query().findById(_id).patch(roleData);
            
            console.log('✅ Role edited successfully:', _id);
            req.flash('success', 'Role berhasil diupdate');
            res.redirect('/rbac-control');
        } catch (error) {
            console.error('❌ Error editing role:', error);
            req.flash('error', 'Gagal mengedit role: ' + error.message);
            res.redirect('/rbac-control');
        }
    }

    // Route handler: Delete role
    deleteRole = async (req, res) => {
        try {
            const roleId = req.params.id;
            
            // Check if role exists
            const role = await this.Role.query().findById(roleId);
            if (!role) {
                console.warn('⚠️ Role not found:', roleId);
                req.flash('error', 'Role tidak ditemukan');
                return res.redirect('/rbac-control');
            }
            
            await this.Role.query().deleteById(roleId);
            
            console.log('✅ Role deleted successfully:', roleId);
            req.flash('success', 'Role berhasil dihapus');
            res.redirect('/rbac-control');
        } catch (error) {
            console.error('Error deleting role:', error);
            req.flash('error', 'Gagal menghapus role: ' + error.message);
            res.redirect('/rbac-control');
        }
    }

    // Helper: Get role by ID (for future use)
    async getRoleById(id) {
        return await this.Role.query().findById(id);
    }

    // Helper: Check if role name exists (for future validation)
    async roleNameExists(roleName, excludeId = null) {
        let query = this.Role.query().where('role', roleName);
        
        if (excludeId) {
            query = query.whereNot('id', excludeId);
        }
        
        const existingRole = await query.first();
        return !!existingRole;
    }

    // Helper: Get roles by permission (for future use)
    async getRolesByPermission(permission) {
        const roles = await this.Role.query();
        return roles.filter(role => 
            role.permission && role.permission.includes(permission)
        );
    }
}

module.exports = new RoleController();