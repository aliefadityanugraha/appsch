/** @format */

"use strict";

const jwt = require("jsonwebtoken");
const Role = require('../models/Role');
const User = require('../models/User');

const isRole = (perm) => {
  return async (req, res, next) => {
    try {
      const session = req.session;
      
      if (!session || !session.token) {
        console.log('❌ No session or token found');
        return res.status(401).redirect('/auth/login');
      }

      // Verify JWT token using correct secret key
      const token = jwt.verify(session.token, process.env.ACCESS_SECRET_KEY);
      
      if (!token || !token.userId) {
        console.log('❌ Invalid token structure');
        return res.status(401).redirect('/auth/login');
      }

      // Get user with role information
      const user = await User.query().findById(token.userId);
      
      if (!user) {
        console.log('❌ User not found');
        return res.status(401).redirect('/auth/login');
      }

      // Get role information using Objection.js
      // Since user.role is an integer but Role.id is UUID, we need to map them
      // Create a mapping for integer role IDs to role names
      // Based on database data: role 1 = Administrator, role 2 = Manager, role 3 = User
      const roleMapping = {
        1: 'Administrator',
        2: 'Manager', 
        3: 'User'
      };
      
      const roleName = roleMapping[user.role];
      if (!roleName) {
        console.log('❌ Invalid role ID:', user.role);
        return res.status(403).json({ error: 'Invalid role' });
      }
      
      const findRole = await Role.query().where('role', roleName);
      
      if (findRole.length === 0) {
        console.log('❌ Role not found for user:', user.email);
        return res.status(403).json({ error: 'Role not found' });
      }

      const userRole = findRole[0];
      const userPermissions = userRole.permission;
      
      // Check if permission is an array or object
      let hasPermission = false;
      
      console.log('🔍 Checking permission:', perm, 'against user permissions:', userPermissions);
      
      if (Array.isArray(userPermissions)) {
        hasPermission = userPermissions.includes(perm.toString());
      } else if (typeof userPermissions === 'object' && userPermissions.arrayPermission) {
        hasPermission = userPermissions.arrayPermission.includes(perm.toString());
      } else if (typeof userPermissions === 'string') {
        // Handle string permissions like "1234"
        hasPermission = userPermissions.includes(perm.toString());
      }
      
      console.log('🔍 Permission check result:', hasPermission);

      if (hasPermission) {
        console.log('✅ Permission granted for:', perm);
        req.user = {
          ...req.user,
          role: user.role,
          permissions: userPermissions
        };
        next();
      } else {
        console.log('❌ Permission denied for:', perm);
        return res.status(403).render('error', {
          layout: 'layouts/main-layouts',
          title: 'Access Denied',
          message: 'You do not have permission to access this resource',
          statusCode: 403,
          req: req.path
        });
      }
    } catch (error) {
      console.error('❌ Role middleware error:', error);
      
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).redirect('/auth/login');
      }
      
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

module.exports = {
  isRole,
};
