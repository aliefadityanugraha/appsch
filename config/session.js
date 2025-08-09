"use strict";

require('dotenv').config();
const session = require("express-session");

// Session configuration from environment variables
const expireSessionIn = parseInt(process.env.SESSION_MAX_AGE) || 60000 * 60 * 12; // Default 12 hours
const sessionSecure = process.env.SESSION_SECURE === 'true' || process.env.NODE_ENV === 'production';
const sessionSameSite = process.env.SESSION_SAME_SITE || 'strict';

// Generate secure session secret from environment or use fallback
const sessionSecret = process.env.SESSION_SECRET || process.env.ACCESS_SECRET_KEY || 'fallback-secret-change-in-production';

if (!process.env.SESSION_SECRET) {
    console.warn('⚠️  WARNING: SESSION_SECRET not set in environment variables. Using fallback.');
    console.warn('⚠️  For production, please set SESSION_SECRET in .env file.');
}

module.exports = {
    session: session({
        secret: sessionSecret,
        // store: store, // Database session store (commented out for now)
        saveUninitialized: false, // Don't save uninitialized sessions
        resave: false, // Don't save session if unmodified
        name: 'appsch.sid', // Change default session name
        cookie: {
            maxAge: expireSessionIn,
            httpOnly: true, // Prevent XSS attacks
            secure: sessionSecure, // HTTPS only in production or when explicitly set
            sameSite: sessionSameSite // CSRF protection
        },
        rolling: true // Reset expiration on activity
    })
};
