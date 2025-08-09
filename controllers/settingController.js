"use strict";

const User = require('../models/User');
const bcrypt = require('bcrypt');
const { ValidationError } = require('../middleware/errorHandler');

module.exports = {
    settings: async (req, res) => {
        try {
            // Get current user data
            const user = await User.query().findById(req.user.userId).withGraphFetched('userRole');
            
            res.render("settings", {
                layout: "layouts/main-layouts",
                title: "Settings",
                req: req.path,
                user: user,
                messages: req.flash('message'),
                errors: req.flash('error'),
                success: req.flash('success')
            });
        } catch (error) {
            console.error('Error loading settings:', error);
            req.flash('error', 'Failed to load settings');
            res.redirect('/');
        }
    },

    updateProfile: async (req, res) => {
        try {
            const { email, currentPassword, newPassword, confirmPassword } = req.body;
            const userId = req.user.userId;

            // Get current user
            const user = await User.query().findById(userId);
            if (!user) {
                req.flash('error', 'User not found');
                return res.redirect('/settings');
            }

            // Validate current password if changing password
            if (newPassword) {
                if (!currentPassword) {
                    req.flash('error', 'Current password is required to change password');
                    return res.redirect('/settings');
                }

                const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
                if (!isCurrentPasswordValid) {
                    req.flash('error', 'Current password is incorrect');
                    return res.redirect('/settings');
                }

                if (newPassword !== confirmPassword) {
                    req.flash('error', 'New password and confirmation do not match');
                    return res.redirect('/settings');
                }

                if (newPassword.length < 6) {
                    req.flash('error', 'New password must be at least 6 characters long');
                    return res.redirect('/settings');
                }
            }

            // Prepare update data
            const updateData = {};
            
            // Update email if provided and different
            if (email && email !== user.email) {
                // Check if email already exists
                const existingUser = await User.query().where('email', email).whereNot('id', userId).first();
                if (existingUser) {
                    req.flash('error', 'Email already exists');
                    return res.redirect('/settings');
                }
                updateData.email = email;
            }

            // Update password if provided
            if (newPassword) {
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                updateData.password = hashedPassword;
            }

            // Update user if there are changes
            if (Object.keys(updateData).length > 0) {
                await User.query().findById(userId).patch(updateData);
                req.flash('success', 'Profile updated successfully');
            } else {
                req.flash('message', 'No changes were made');
            }

            res.redirect('/settings');
        } catch (error) {
            console.error('Error updating profile:', error);
            req.flash('error', 'Failed to update profile');
            res.redirect('/settings');
        }
    }
};
