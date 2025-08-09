"use strict";

const crypto = require('crypto');

/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens to prevent Cross-Site Request Forgery attacks
 */

/**
 * Generate a secure random CSRF token
 */
function generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware to generate CSRF token and make it available in views
 */
function csrfProtection(req, res, next) {
    // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        // Generate token for forms
        if (!req.session.csrfToken) {
            req.session.csrfToken = generateCSRFToken();
        }
        
        // Make token available in views
        res.locals.csrfToken = req.session.csrfToken;
        return next();
    }
    
    // Skip CSRF for health monitoring endpoints (error reporting)
    if (req.path === '/api/health/error-report' || req.path === '/health/error-report') {
        return next();
    }
    
    // For POST, PUT, DELETE, PATCH requests, validate token
    const sessionToken = req.session.csrfToken;
    const submittedToken = req.body._token || req.headers['x-csrf-token'];
    
    if (!sessionToken) {
        console.log('❌ CSRF: No session token found');
        return res.status(403).json({ 
            error: 'CSRF token missing from session',
            message: 'Security error: Please refresh the page and try again'
        });
    }
    
    if (!submittedToken) {
        console.log('❌ CSRF: No token submitted with request');
        return res.status(403).json({ 
            error: 'CSRF token missing from request',
            message: 'Security error: Missing security token'
        });
    }
    
    // Use timing-safe comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(sessionToken), Buffer.from(submittedToken))) {
        console.log('❌ CSRF: Token mismatch');
        console.log('   Session token:', sessionToken.substring(0, 8) + '...');
        console.log('   Submitted token:', submittedToken.substring(0, 8) + '...');
        
        // Generate new token after failed validation
        req.session.csrfToken = generateCSRFToken();
        
        return res.status(403).json({ 
            error: 'CSRF token mismatch',
            message: 'Security error: Invalid security token. Please refresh the page and try again'
        });
    }
    
    console.log('✅ CSRF: Token validated successfully');
    
    // Generate new token for next request (token rotation)
    req.session.csrfToken = generateCSRFToken();
    res.locals.csrfToken = req.session.csrfToken;
    
    next();
}

/**
 * Middleware specifically for API routes that might use JSON
 */
function csrfProtectionAPI(req, res, next) {
    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    
    const sessionToken = req.session.csrfToken;
    const submittedToken = req.body._token || req.headers['x-csrf-token'] || req.headers['csrf-token'];
    
    if (!sessionToken || !submittedToken) {
        return res.status(403).json({ 
            success: false,
            error: 'CSRF_TOKEN_MISSING',
            message: 'CSRF token is required for this request'
        });
    }
    
    if (!crypto.timingSafeEqual(Buffer.from(sessionToken), Buffer.from(submittedToken))) {
        // Generate new token after failed validation
        req.session.csrfToken = generateCSRFToken();
        
        return res.status(403).json({ 
            success: false,
            error: 'CSRF_TOKEN_INVALID',
            message: 'Invalid CSRF token'
        });
    }
    
    // Generate new token for next request
    req.session.csrfToken = generateCSRFToken();
    
    next();
}

/**
 * Helper function to get CSRF token for AJAX requests
 */
function getCSRFToken(req, res) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = generateCSRFToken();
    }
    
    res.json({ 
        success: true,
        csrfToken: req.session.csrfToken 
    });
}

module.exports = {
    csrfProtection,
    csrfProtectionAPI,
    getCSRFToken,
    generateCSRFToken
};