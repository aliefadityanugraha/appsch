"use strict";

const User = require('../models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jsonWebToken = require('jsonwebtoken');

module.exports = {
    // Tampilkan halaman reset password
    showResetForm: (req, res) => {
        const { token } = req.query;
        res.render('auth/reset-password', { 
            layout: 'layouts/auth-layouts',
            title: 'Reset Password',
            token: token || null,
            message: req.flash('message')
        });
    },

    // Tampilkan halaman force reset password untuk user yang harus reset
    showForceResetForm: (req, res) => {
        res.render('auth/force-reset-password', { 
            layout: 'layouts/auth-layouts',
            title: 'Ubah Password Anda',
            message: req.flash('message')
        });
    },

    // Generate reset token dan kirim ke user (untuk implementasi email nanti)
    generateResetToken: async (req, res) => {
        try {
            const { email } = req.body;
            
            if (!email) {
                req.flash('message', 'Email harus diisi');
                return res.redirect('/auth/reset-password');
            }

            const user = await User.findByEmail(email);
            if (!user) {
                // Jangan beri tahu bahwa email tidak ditemukan untuk keamanan
                req.flash('message', 'Jika email terdaftar, link reset password akan dikirim');
                return res.redirect('/auth/reset-password');
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const tokenExpiry = new Date(Date.now() + 3600000); // 1 jam

            await User.query()
                .findById(user.id)
                .patch({
                    resetToken: resetToken,
                    resetTokenExpiry: tokenExpiry.toISOString().slice(0, 19).replace('T', ' '),
                    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
                });

            // TODO: Implementasi pengiriman email
            console.log(`Reset token untuk ${email}: ${resetToken}`);
            console.log(`Reset URL: ${req.protocol}://${req.get('host')}/auth/reset-password?token=${resetToken}`);

            req.flash('message', 'Link reset password telah dikirim ke email Anda');
            res.redirect('/auth/reset-password');

        } catch (error) {
            console.error('Error generating reset token:', error);
            req.flash('message', 'Terjadi kesalahan, silakan coba lagi');
            res.redirect('/auth/reset-password');
        }
    },

    // Reset password dengan token
    resetPasswordWithToken: async (req, res) => {
        try {
            const { token, newPassword, confirmPassword } = req.body;
            
            if (!token || !newPassword || !confirmPassword) {
                req.flash('message', 'Semua field harus diisi');
                return res.redirect(`/auth/reset-password?token=${token}`);
            }

            if (newPassword !== confirmPassword) {
                req.flash('message', 'Password dan konfirmasi password tidak sama');
                return res.redirect(`/auth/reset-password?token=${token}`);
            }

            if (newPassword.length < 6) {
                req.flash('message', 'Password minimal 6 karakter');
                return res.redirect(`/auth/reset-password?token=${token}`);
            }

            // Cari user dengan reset token
            const user = await User.query()
                .where('resetToken', token)
                .where('resetTokenExpiry', '>', new Date().toISOString().slice(0, 19).replace('T', ' '))
                .first();

            if (!user) {
                req.flash('message', 'Token reset tidak valid atau sudah expired');
                return res.redirect('/auth/reset-password');
            }

            // Hash password baru dengan bcrypt
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update password dan hapus reset token
            await User.query()
                .findById(user.id)
                .patch({
                    password: hashedPassword,
                    resetToken: null,
                    resetTokenExpiry: null,
                    mustResetPassword: false,
                    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
                });

            req.flash('message', 'Password berhasil diubah, silakan login');
            res.redirect('/auth/login');

        } catch (error) {
            console.error('Error resetting password:', error);
            req.flash('message', 'Terjadi kesalahan, silakan coba lagi');
            res.redirect('/auth/reset-password');
        }
    },

    // Force reset password untuk user yang harus reset
    forceResetPassword: async (req, res) => {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;
            const userId = req.user.userId; // Dari token JWT
            
            if (!newPassword || !confirmPassword) {
                req.flash('message', 'Password baru dan konfirmasi harus diisi');
                return res.redirect('/auth/force-reset');
            }

            if (newPassword !== confirmPassword) {
                req.flash('message', 'Password baru dan konfirmasi tidak sama');
                return res.redirect('/auth/force-reset');
            }

            if (newPassword.length < 6) {
                req.flash('message', 'Password minimal 6 karakter');
                return res.redirect('/auth/force-reset');
            }

            const user = await User.query().findById(userId);
            if (!user) {
                req.flash('message', 'User tidak ditemukan');
                return res.redirect('/auth/login');
            }

            // Jika user memiliki password lama, verifikasi
            if (user.password && currentPassword) {
                const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
                if (!isCurrentPasswordValid) {
                    req.flash('message', 'Password lama tidak benar');
                    return res.redirect('/auth/force-reset');
                }
            }

            // Hash password baru
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update password
            await User.query()
                .findById(userId)
                .patch({
                    password: hashedPassword,
                    mustResetPassword: false,
                    resetToken: null,
                    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
                });

            req.flash('message', 'Password berhasil diubah');
            res.redirect('/');

        } catch (error) {
            console.error('Error in force reset password:', error);
            req.flash('message', 'Terjadi kesalahan, silakan coba lagi');
            res.redirect('/auth/force-reset');
        }
    }
};