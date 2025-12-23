"use strict";

const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Request Logger Middleware Class
 * Handles request logging, security headers, and performance monitoring
 */
class RequestLoggerMiddleware {
    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
        this.slowRequestThreshold = 1000; // ms
        this.highMemoryThreshold = 100; // MB
        this.sensitiveFields = [
            'password', 'confirmPassword', 'oldPassword', 'newPassword',
            'token', 'accessToken', 'refreshToken', 'apiKey',
            'secret', 'privateKey', 'creditCard', 'ssn'
        ];
    }

    /**
     * Get client IP address from request
     * @param {Object} req - Express request object
     * @returns {string} Client IP address
     */
    getClientIP(req) {
        return req.ip ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               req.connection?.socket?.remoteAddress ||
               req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               'unknown';
    }

    /**
     * Sanitize object by removing sensitive fields
     * @param {Object} data - Data to sanitize
     * @returns {Object} Sanitized data
     */
    sanitize(data) {
        if (!data || typeof data !== 'object') return data;

        if (Array.isArray(data)) {
            return data.map(item => this.sanitize(item));
        }

        const sanitized = { ...data };
        for (const field of this.sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
        return sanitized;
    }

    /**
     * Log response details
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {*} data - Response data
     * @param {number} startTime - Request start time
     */
    logResponse(req, res, data, startTime) {
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

        if (res.statusCode >= 500) {
            logger.error(`Response ${res.statusCode} (${responseTime}ms)`, responseInfo);
        } else {
            logger.info(`Response ${res.statusCode} (${responseTime}ms)`, {
                requestId: req.requestId,
                responseTime: responseInfo.responseTime,
                statusCode: res.statusCode
            });
        }

        if (responseTime > this.slowRequestThreshold) {
            logger.warn('Slow request detected', {
                requestId: req.requestId,
                url: req.originalUrl || req.url,
                responseTime: `${responseTime}ms`,
                threshold: `${this.slowRequestThreshold}ms`
            });
        }
    }

    /**
     * Main request logger middleware
     * @returns {Function} Express middleware function
     */
    logger() {
        return (req, res, next) => {
            if (this.isProduction) {
                const startTime = Date.now();
                res.on('finish', () => {
                    const responseTime = Date.now() - startTime;
                    if (res.statusCode >= 400 || responseTime > this.slowRequestThreshold) {
                        logger.warn(`${req.method} ${req.url} - ${res.statusCode} (${responseTime}ms)`, {
                            requestId: req.requestId,
                            statusCode: res.statusCode,
                            responseTime: `${responseTime}ms`
                        });
                    }
                });
                return next();
            }

            req.requestId = uuidv4();
            const startTime = Date.now();

            logger.info(`HTTP ${req.method} ${req.originalUrl || req.url}`, {
                requestId: req.requestId,
                ip: this.getClientIP(req),
                userId: req.user?.id || 'anonymous'
            });

            const self = this;
            const originalJson = res.json;
            res.json = function(data) {
                self.logResponse(req, res, data, startTime);
                return originalJson.call(this, data);
            };

            const originalSend = res.send;
            res.send = function(data) {
                self.logResponse(req, res, data, startTime);
                return originalSend.call(this, data);
            };

            const originalRender = res.render;
            res.render = function(view, locals, callback) {
                self.logResponse(req, res, { view, locals }, startTime);
                return originalRender.call(this, view, locals, callback);
            };

            next();
        };
    }

    /**
     * Security headers middleware
     * @returns {Function} Express middleware function
     */
    securityHeaders() {
        return (req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.setHeader('X-Request-ID', req.requestId || uuidv4());
            res.removeHeader('X-Powered-By');
            next();
        };
    }

    /**
     * Rate limit logger middleware
     * @returns {Function} Express middleware function
     */
    rateLimitLogger() {
        return (req, res, next) => {
            const originalRateLimit = res.rateLimit;

            if (originalRateLimit) {
                logger.warn('Rate limit applied', {
                    requestId: req.requestId,
                    ip: this.getClientIP(req),
                    url: req.originalUrl || req.url,
                    limit: originalRateLimit.limit,
                    remaining: originalRateLimit.remaining,
                    resetTime: new Date(originalRateLimit.resetTime)
                });
            }

            next();
        };
    }

    /**
     * Performance monitoring middleware
     * @returns {Function} Express middleware function
     */
    performanceMonitor() {
        return (req, res, next) => {
            const startTime = process.hrtime.bigint();

            res.on('finish', () => {
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000;

                const performanceData = {
                    requestId: req.requestId,
                    url: req.originalUrl || req.url,
                    method: req.method,
                    statusCode: res.statusCode,
                    duration: `${duration.toFixed(2)}ms`,
                    memoryUsage: process.memoryUsage(),
                    cpuUsage: process.cpuUsage()
                };

                if (duration > this.slowRequestThreshold) {
                    logger.warn('Performance: Slow request', performanceData);
                } else if (duration > 500) {
                    logger.info('Performance: Medium request', performanceData);
                }

                const memoryUsageMB = performanceData.memoryUsage.heapUsed / 1024 / 1024;
                if (memoryUsageMB > this.highMemoryThreshold) {
                    logger.warn('Performance: High memory usage', {
                        requestId: req.requestId,
                        memoryUsageMB: `${memoryUsageMB.toFixed(2)}MB`
                    });
                }
            });

            next();
        };
    }
}

// Create singleton instance
const requestLoggerMiddleware = new RequestLoggerMiddleware();

// Export class and convenience methods for backward compatibility
module.exports = {
    RequestLoggerMiddleware,
    requestLogger: requestLoggerMiddleware.logger(),
    securityHeaders: requestLoggerMiddleware.securityHeaders(),
    rateLimitLogger: requestLoggerMiddleware.rateLimitLogger(),
    performanceMonitor: requestLoggerMiddleware.performanceMonitor()
};
