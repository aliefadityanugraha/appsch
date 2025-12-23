const User = require('../models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const EmailService = require('../services/EmailService');

class PasswordResetController {
    constructor() {
        // Inject dependencies for better testability
        this.User = User;
        this.EmailService = EmailService;
        
        // Configuration
        this.bcryptRounds = 12;
        this.minPasswordLength = 6;
        this.tokenExpiryHours = 1;
    }

    // Helper: Generate reset token
    generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Helper: Calculate token expiry time
    getTokenExpiry() {
        const expiry = new Date(Date.now() + this.tokenExpiryHours * 3600000);
        return expiry.toISOString().slice(0, 19).replace('T', ' ');
    }

    // Helper: Format current datetime for MySQL
    getCurrentDateTime() {
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    // Helper: Validate password
    validatePassword(password, confirmPassword) {
        if (!password || !confirmPassword) {
            throw new Error('Password dan konfirmasi harus diisi');
        }

        if (password !== confirmPassword) {
            throw new Error('Password dan konfirmasi password tidak sama');
        }

        if (password.length < this.minPasswordLength) {
            throw new Error(`Password minimal ${this.minPasswordLength} karakter`);
        }

        return true;
    }

    // Helper: Hash password
    async hashPassword(password) {
        return await bcrypt.hash(password, this.bcryptRounds);
    }

    // Helper: Verify password
    async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // Route handler: Show reset password form
    showResetForm = (req, res) => {
        const { token } = req.query;
        res.render('auth/reset-password', { 
            layout: 'layouts/auth-layouts',
            title: 'Reset Password',
            token: token || null,
            message: req.flash('message')
        });
    }

    // Route handler: Show force reset password form
    showForceResetForm = (req, res) => {
        res.render('auth/force-reset-password', { 
            layout: 'layouts/auth-layouts',
            title: 'Ubah Password Anda',
            message: req.flash('message')
        });
    }

    // Route handler: Generate reset token and send email
    generateResetToken = async (req, res) => {
        try {
            const { email } = req.body;
            
            if (!email) {
                req.flash('message', 'Email harus diisi');
                return res.redirect('/auth/reset-password');
            }

            const user = await this.User.findByEmail(email);
            if (!user) {
                // Don't reveal if email exists for security
                req.flash('message', 'Jika email terdaftar, link reset password akan dikirim');
                return res.redirect('/auth/reset-password');
            }

            // Generate and save reset token
            const resetToken = this.generateToken();
            const tokenExpiry = this.getTokenExpiry();

            await this.User.query()
                .findById(user.id)
                .patch({
                    resetToken,
                    resetTokenExpiry: tokenExpiry,
                    updatedAt: this.getCurrentDateTime()
                });

            // Send reset email
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const emailResult = await this.EmailService.sendPasswordResetEmail(email, resetToken, baseUrl);
            
            if (emailResult.success) {
                console.log(`✅ Email reset password berhasil dikirim ke ${email}`);
                req.flash('message', 'Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.');
            } else {
                console.error(`❌ Gagal mengirim email ke ${email}:`, emailResult.error);
                req.flash('message', 'Jika email terdaftar, link reset password akan dikirim');
            }
            
            res.redirect('/auth/reset-password');

        } catch (error) {
            console.error('Error generating reset token:', error);
            req.flash('message', 'Terjadi kesalahan, silakan coba lagi');
            res.redirect('/auth/reset-password');
        }
    }

    // Route handler: Reset password with token
    resetPasswordWithToken = async (req, res) => {
        try {
            const { token, newPassword, confirmPassword } = req.body;
            
            if (!token) {
                req.flash('message', 'Token tidak valid');
                return res.redirect('/auth/reset-password');
            }

            // Validate password
            this.validatePassword(newPassword, confirmPassword);

            // Find user with valid token
            const user = await this.User.query()
                .where('resetToken', token)
                .where('resetTokenExpiry', '>', this.getCurrentDateTime())
                .first();

            if (!user) {
                req.flash('message', 'Token reset tidak valid atau sudah expired');
                return res.redirect('/auth/reset-password');
            }

            // Hash and update password
            const hashedPassword = await this.hashPassword(newPassword);

            await this.User.query()
                .findById(user.id)
                .patch({
                    password: hashedPassword,
                    resetToken: null,
                    resetTokenExpiry: null,
                    mustResetPassword: false,
                    updatedAt: this.getCurrentDateTime()
                });

            req.flash('message', 'Password berhasil diubah, silakan login');
            res.redirect('/auth/login');

        } catch (error) {
            console.error('Error resetting password:', error);
            const message = error.message || 'Terjadi kesalahan, silakan coba lagi';
            req.flash('message', message);
            res.redirect(`/auth/reset-password${req.body.token ? `?token=${req.body.token}` : ''}`);
        }
    }

    // Route handler: Force reset password for users who must reset
    forceResetPassword = async (req, res) => {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;
            const userId = req.user.userId;

            // Validate password
            this.validatePassword(newPassword, confirmPassword);

            const user = await this.User.query().findById(userId);
            if (!user) {
                req.flash('message', 'User tidak ditemukan');
                return res.redirect('/auth/login');
            }

            // Verify current password if user has one
            if (user.password && currentPassword) {
                const isValid = await this.verifyPassword(currentPassword, user.password);
                if (!isValid) {
                    req.flash('message', 'Password lama tidak benar');
                    return res.redirect('/auth/force-reset');
                }
            }

            // Hash and update password
            const hashedPassword = await this.hashPassword(newPassword);

            await this.User.query()
                .findById(userId)
                .patch({
                    password: hashedPassword,
                    mustResetPassword: false,
                    resetToken: null,
                    updatedAt: this.getCurrentDateTime()
                });

            req.flash('message', 'Password berhasil diubah');
            res.redirect('/');

        } catch (error) {
            console.error('Error in force reset password:', error);
            const message = error.message || 'Terjadi kesalahan, silakan coba lagi';
            req.flash('message', message);
            res.redirect('/auth/force-reset');
        }
    }

    // Helper: Check if token is valid (for future use)
    async isTokenValid(token) {
        const user = await this.User.query()
            .where('resetToken', token)
            .where('resetTokenExpiry', '>', this.getCurrentDateTime())
            .first();
        
        return !!user;
    }

    // Helper: Invalidate all tokens for user (for future use)
    async invalidateUserTokens(userId) {
        await this.User.query()
            .findById(userId)
            .patch({
                resetToken: null,
                resetTokenExpiry: null,
                updatedAt: this.getCurrentDateTime()
            });
    }
}

module.exports = new PasswordResetController();