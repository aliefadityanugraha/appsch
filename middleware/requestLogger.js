"use strict";

const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Request Logger Middleware
 */
function requestLogger(req, res, next) {
    // Generate unique request ID
    req.requestId = uuidv4();
    
    // Start time for response time calculation
    const startTime = Date.now();
    
    // Log request details
    const requestInfo = {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        ip: getClientIP(req),
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
        userId: req.user?.id || 'anonymous',
        sessionId: req.sessionID || null,
        timestamp: new Date().toISOString()
    };

    // Log request body for non-GET requests (excluding sensitive data)
    if (req.method !== 'GET' && req.body) {
        requestInfo.body = sanitizeRequestBody(req.body);
    }

    // Log query parameters
    if (Object.keys(req.query).length > 0) {
        requestInfo.query = req.query;
    }

    // Log request
    logger.info('Incoming request', requestInfo);

    // Override res.json to log response
    const originalJson = res.json;
    res.json = function(data) {
        logResponse(req, res, data, startTime);
        return originalJson.call(this, data);
    };

    // Override res.send to log response
    const originalSend = res.send;
    res.send = function(data) {
        logResponse(req, res, data, startTime);
        return originalSend.call(this, data);
    };

    // Override res.render to log response
    const originalRender = res.render;
    res.render = function(view, locals, callback) {
        logResponse(req, res, { view, locals }, startTime);
        return originalRender.call(this, view, locals, callback);
    };

    next();
}

/**
 * Log Response Details
 */
function logResponse(req, res, data, startTime) {
    const responseTime = Date.now() - startTime;
    
    const responseInfo = {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentType: res.get('Content-Type'),
        contentLength: res.get('Content-Length'),
        userId: req.user?.id || 'anonymous',
        timestamp: new Date().toISOString()
    };

    // Add response data for development environment
    if (process.env.NODE_ENV !== 'production' && data) {
        responseInfo.responseData = sanitizeResponseData(data);
    }

    // Log based on status code
    if (res.statusCode >= 500) {
        logger.error('Response sent', responseInfo);
    } else if (res.statusCode >= 400) {
        logger.warn('Response sent', responseInfo);
    } else {
        logger.info('Response sent', responseInfo);
    }

    // Log slow requests
    if (responseTime > 1000) {
        logger.warn('Slow request detected', {
            requestId: req.requestId,
            url: req.originalUrl || req.url,
            responseTime: `${responseTime}ms`,
            threshold: '1000ms'
        });
    }
}

/**
 * Get Client IP Address
 */
function getClientIP(req) {
    return req.ip ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.connection?.socket?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           'unknown';
}

/**
 * Sanitize Request Body (remove sensitive data)
 */
function sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') {
        return body;
    }

    const sensitiveFields = [
        'password', 'confirmPassword', 'oldPassword', 'newPassword',
        'token', 'accessToken', 'refreshToken', 'apiKey',
        'secret', 'privateKey', 'creditCard', 'ssn'
    ];

    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
}

/**
 * Sanitize Response Data (remove sensitive data)
 */
function sanitizeResponseData(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }

    const sensitiveFields = [
        'password', 'token', 'accessToken', 'refreshToken',
        'secret', 'privateKey', 'apiKey'
    ];

    let sanitized;
    
    if (Array.isArray(data)) {
        sanitized = data.map(item => {
            if (typeof item === 'object') {
                const cleanItem = { ...item };
                for (const field of sensitiveFields) {
                    if (cleanItem[field]) {
                        cleanItem[field] = '[REDACTED]';
                    }
                }
                return cleanItem;
            }
            return item;
        });
    } else {
        sanitized = { ...data };
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
    }

    return sanitized;
}

/**
 * Security Headers Middleware
 */
function securityHeaders(req, res, next) {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Request-ID', req.requestId);
    
    // Remove server header
    res.removeHeader('X-Powered-By');
    
    next();
}

/**
 * Rate Limiting Logger
 */
function rateLimitLogger(req, res, next) {
    const originalRateLimit = res.rateLimit;
    
    if (originalRateLimit) {
        logger.warn('Rate limit applied', {
            requestId: req.requestId,
            ip: getClientIP(req),
            url: req.originalUrl || req.url,
            limit: originalRateLimit.limit,
            remaining: originalRateLimit.remaining,
            resetTime: new Date(originalRateLimit.resetTime)
        });
    }
    
    next();
}

/**
 * Performance Monitoring
 */
function performanceMonitor(req, res, next) {
    const startTime = process.hrtime.bigint();
    
    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        // Log performance metrics
        const performanceData = {
            requestId: req.requestId,
            url: req.originalUrl || req.url,
            method: req.method,
            statusCode: res.statusCode,
            duration: `${duration.toFixed(2)}ms`,
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage()
        };
        
        // Log slow requests
        if (duration > 1000) {
            logger.warn('Performance: Slow request', performanceData);
        } else if (duration > 500) {
            logger.info('Performance: Medium request', performanceData);
        }
        
        // Log high memory usage
        const memoryUsageMB = performanceData.memoryUsage.heapUsed / 1024 / 1024;
        if (memoryUsageMB > 100) {
            logger.warn('Performance: High memory usage', {
                requestId: req.requestId,
                memoryUsageMB: `${memoryUsageMB.toFixed(2)}MB`
            });
        }
    });
    
    next();
}

module.exports = {
    requestLogger,
    securityHeaders,
    rateLimitLogger,
    performanceMonitor
};