"use strict";

const User = require('../models/User');
const jsonWebToken = require('jsonwebtoken');

/**
 * Middleware untuk memeriksa apakah user harus reset password
 * Jika mustResetPassword = true, redirect ke halaman force reset
 */
const checkPasswordReset = async (req, res, next) => {
    try {
        // Skip jika tidak ada token atau sedang di halaman reset password
        if (!req.session.token) {
            return next();
        }

        // Skip jika sedang mengakses halaman reset password atau logout
        const resetPaths = [
            '/auth/force-reset',
            '/auth/reset-password',
            '/auth/logout',
            '/auth/force-reset-password'
        ];
        
        if (resetPaths.some(path => req.path.startsWith(path))) {
            return next();
        }

        // Decode token untuk mendapatkan user ID
        const decoded = jsonWebToken.verify(req.session.token, process.env.ACCESS_SECRET_KEY);
        
        // Ambil data user dari database
        const user = await User.query().findById(decoded.userId);
        
        if (!user) {
            // User tidak ditemukan, hapus session dan redirect ke login
            req.session.destroy();
            return res.redirect('/auth/login');
        }

        // Jika user tidak memiliki password atau harus reset password
        if (!user.password || user.mustResetPassword) {
            console.log(`🔄 User ${user.email} harus reset password`);
            return res.redirect('/auth/force-reset');
        }

        // Simpan data user di request untuk digunakan di controller lain
        req.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
            status: user.status
        };

        next();

    } catch (error) {
        console.error('Error in checkPasswordReset middleware:', error);
        
        // Jika token tidak valid, hapus session dan redirect ke login
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            req.session.destroy();
            return res.redirect('/auth/login');
        }
        
        // Error lain, lanjutkan ke next middleware
        next();
    }
};

module.exports = checkPasswordReset;