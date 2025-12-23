const User = require('../models/User');
const bcrypt = require('bcrypt');
const { ValidationError } = require('../middleware/errorHandler');

class SettingController {
    constructor() {
        // Inject dependencies for better testability
        this.User = User;
        this.minPasswordLength = 6;
        this.bcryptRounds = 10;
    }

    // Helper: Validate password change request
    validatePasswordChange(currentPassword, newPassword, confirmPassword) {
        if (!currentPassword) {
            throw new ValidationError('Current password is required to change password');
        }

        if (newPassword !== confirmPassword) {
            throw new ValidationError('New password and confirmation do not match');
        }

        if (newPassword.length < this.minPasswordLength) {
            throw new ValidationError(`New password must be at least ${this.minPasswordLength} characters long`);
        }

        return true;
    }

    // Helper: Verify current password
    async verifyCurrentPassword(currentPassword, hashedPassword) {
        const isValid = await bcrypt.compare(currentPassword, hashedPassword);
        if (!isValid) {
            throw new ValidationError('Current password is incorrect');
        }
        return true;
    }

    // Helper: Check if email is available
    async checkEmailAvailability(email, userId) {
        const existingUser = await this.User.query()
            .where('email', email)
            .whereNot('id', userId)
            .first();

        if (existingUser) {
            throw new ValidationError('Email already exists');
        }
        return true;
    }

    // Helper: Prepare update data
    async prepareUpdateData(user, email, newPassword) {
        const updateData = {};

        // Update email if provided and different
        if (email && email !== user.email) {
            await this.checkEmailAvailability(email, user.id);
            updateData.email = email;
        }

        // Update password if provided
        if (newPassword) {
            updateData.password = await bcrypt.hash(newPassword, this.bcryptRounds);
        }

        return updateData;
    }

    // Route handler: Display settings page
    settings = async (req, res) => {
        try {
            // Get current user data with role
            const user = await this.User.query()
                .findById(req.user.userId)
                .withGraphFetched('userRole');

            res.render("settings", {
                layout: "layouts/main-layouts",
                title: "Settings",
                req: req.path,
                user,
                messages: req.flash('message'),
                errors: req.flash('error'),
                success: req.flash('success')
            });
        } catch (error) {
            console.error('Error loading settings:', error);
            req.flash('error', 'Failed to load settings');
            res.redirect('/');
        }
    }

    // Route handler: Update user profile
    updateProfile = async (req, res) => {
        try {
            const { email, currentPassword, newPassword, confirmPassword } = req.body;
            const userId = req.user.userId;

            // Get current user
            const user = await this.User.query().findById(userId);
            if (!user) {
                req.flash('error', 'User not found');
                return res.redirect('/settings');
            }

            // Validate password change if requested
            if (newPassword) {
                this.validatePasswordChange(currentPassword, newPassword, confirmPassword);
                await this.verifyCurrentPassword(currentPassword, user.password);
            }

            // Prepare update data
            const updateData = await this.prepareUpdateData(user, email, newPassword);

            // Update user if there are changes
            if (Object.keys(updateData).length > 0) {
                await this.User.query().findById(userId).patch(updateData);
                req.flash('success', 'Profile updated successfully');
            } else {
                req.flash('message', 'No changes were made');
            }

            res.redirect('/settings');
        } catch (error) {
            console.error('Error updating profile:', error);
            
            // Handle validation errors
            if (error instanceof ValidationError) {
                req.flash('error', error.message);
            } else {
                req.flash('error', 'Failed to update profile');
            }
            
            res.redirect('/settings');
        }
    }

    // Helper: Change password only (for future use)
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.User.query().findById(userId);
        if (!user) {
            throw new ValidationError('User not found');
        }

        await this.verifyCurrentPassword(currentPassword, user.password);
        
        const hashedPassword = await bcrypt.hash(newPassword, this.bcryptRounds);
        await this.User.query().findById(userId).patch({ password: hashedPassword });
        
        return true;
    }

    // Helper: Update email only (for future use)
    async updateEmail(userId, newEmail) {
        const user = await this.User.query().findById(userId);
        if (!user) {
            throw new ValidationError('User not found');
        }

        await this.checkEmailAvailability(newEmail, userId);
        await this.User.query().findById(userId).patch({ email: newEmail });
        
        return true;
    }
}

module.exports = new SettingController();