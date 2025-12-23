"use strict";

const logger = require('../config/logger');

/**
 * Base Application Error Class
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation Error Class
 */
class ValidationError extends AppError {
    constructor(message, field = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
        this.field = field;
    }
}

/**
 * Authentication Error Class
 */
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTH_ERROR');
        this.name = 'AuthenticationError';
    }
}

/**
 * Authorization Error Class
 */
class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}

/**
 * Not Found Error Class
 */
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

/**
 * Database Error Class
 */
class DatabaseError extends AppError {
    constructor(message, originalError = null) {
        super(message, 500, 'DATABASE_ERROR');
        this.name = 'DatabaseError';
        this.originalError = originalError;
    }
}

/**
 * Error Handler Middleware Class
 */
class ErrorHandlerMiddleware {
    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
    }

    /**
     * Get error title based on status code
     * @param {number} statusCode - HTTP status code
     * @returns {string} Error title
     */
    getErrorTitle(statusCode) {
        const titles = {
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            422: 'Validation Error',
            500: 'Internal Server Error',
            503: 'Service Unavailable'
        };
        return titles[statusCode] || 'Error';
    }

    /**
     * Check if request is an API request
     * @param {Object} req - Express request object
     * @returns {boolean} Whether request is API
     */
    isApiRequest(req) {
        return req.originalUrl?.startsWith('/api') ||
               req.get('Content-Type')?.includes('application/json') ||
               req.get('Accept')?.includes('application/json');
    }

    /**
     * Handle validation errors
     * @param {Error} err - Error object
     * @returns {ValidationError} Processed error
     */
    handleValidationError(err) {
        const errors = Object.values(err.errors).map(val => ({
            field: val.path,
            message: val.message
        }));
        return new ValidationError('Validation failed', errors);
    }

    /**
     * Handle cast errors
     * @param {Error} err - Error object
     * @returns {ValidationError} Processed error
     */
    handleCastError(err) {
        const message = `Invalid ${err.path}: ${err.value}`;
        return new ValidationError(message);
    }

    /**
     * Handle duplicate field errors
     * @param {Error} err - Error object
     * @returns {ValidationError} Processed error
     */
    handleDuplicateFieldError(err) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        return new ValidationError(message, field);
    }

    /**
     * Handle JWT errors
     * @returns {AuthenticationError} Processed error
     */
    handleJWTError() {
        return new AuthenticationError('Invalid token');
    }

    /**
     * Handle JWT expired errors
     * @returns {AuthenticationError} Processed error
     */
    handleJWTExpiredError() {
        return new AuthenticationError('Token expired');
    }

    /**
     * Handle database errors
     * @param {Error} err - Error object
     * @returns {DatabaseError} Processed error
     */
    handleDatabaseError(err) {
        const messages = {
            'ER_DUP_ENTRY': 'Duplicate entry detected',
            'ER_NO_SUCH_TABLE': 'Database table not found',
            'ER_BAD_FIELD_ERROR': 'Invalid database field',
            'ER_ACCESS_DENIED_ERROR': 'Database access denied',
            'ECONNREFUSED': 'Database connection refused',
            'ETIMEDOUT': 'Database connection timeout'
        };
        const message = messages[err.code] || 'Database operation failed';
        return new DatabaseError(message, err);
    }

    /**
     * Send error response
     * @param {Object} res - Express response object
     * @param {Object} error - Error object
     * @param {Object} req - Express request object
     */
    sendErrorResponse(res, error, req) {
        const statusCode = error.statusCode || 500;

        const errorResponse = {
            success: false,
            error: {
                message: error.message || 'Internal server error',
                code: error.code || 'INTERNAL_ERROR',
                statusCode: statusCode
            }
        };

        if (!this.isProduction) {
            errorResponse.error.stack = error.stack;
            errorResponse.error.details = error.details || null;
        }

        if (this.isApiRequest(req)) {
            res.status(statusCode).json(errorResponse);
        } else {
            this.handleWebError(req, res, error, statusCode);
        }
    }

    /**
     * Handle web request errors with flash messages
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Object} error - Error object
     * @param {number} statusCode - HTTP status code
     */
    handleWebError(req, res, error, statusCode) {
        let errorMessage = error.message;

        if (error instanceof ValidationError && error.field) {
            if (Array.isArray(error.field)) {
                const fieldErrors = error.field.map(f => `${f.field}: ${f.message}`).join(', ');
                errorMessage = `${error.message} (${fieldErrors})`;
            } else {
                errorMessage = `${error.message} (Field: ${error.field})`;
            }
        }

        if (statusCode === 404) {
            req.flash('error', 'Halaman yang Anda cari tidak ditemukan.');
        } else if (error instanceof ValidationError) {
            req.flash('error', errorMessage);
        } else if (error instanceof AuthenticationError) {
            req.flash('error', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        } else if (error instanceof AuthorizationError) {
            req.flash('error', 'Anda tidak memiliki akses untuk melakukan tindakan ini.');
        } else {
            req.flash('error', 'Terjadi kesalahan pada sistem. Silakan coba lagi.');
        }

        const redirectUrl = req.get('Referer') || '/';
        logger.warn(`Redirecting to: ${redirectUrl}`);
        res.redirect(redirectUrl);
    }

    /**
     * Main error handler middleware
     * @returns {Function} Express error middleware function
     */
    handler() {
        return (err, req, res, next) => {
            logger.warn('=== ERROR HANDLER DEBUG ===');
            logger.warn(`Error Name: ${err.name}`);
            logger.warn(`Error Message: ${err.message}`);
            logger.warn(`Status Code: ${err.statusCode || 500}`);
            logger.warn(`URL: ${req.originalUrl}`);
            logger.warn(`Referer: ${req.get('Referer')}`);

            const errorMeta = {
                url: req.originalUrl || req.url,
                method: req.method,
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                userId: req.user?.id || 'anonymous',
                body: req.method !== 'GET' ? req.body : undefined,
                params: req.params,
                query: req.query
            };

            // Handle custom application errors
            if (err instanceof ValidationError) {
                return this.sendErrorResponse(res, {
                    statusCode: 400,
                    message: err.message,
                    errors: err.field ? [{ field: err.field, message: err.message }] : err.errors,
                    code: 'VALIDATION_ERROR'
                }, req);
            }

            if (err instanceof AuthenticationError) {
                return this.sendErrorResponse(res, {
                    statusCode: 401,
                    message: err.message,
                    code: 'AUTH_ERROR'
                }, req);
            }

            if (err instanceof AuthorizationError) {
                return this.sendErrorResponse(res, {
                    statusCode: 403,
                    message: err.message,
                    code: 'AUTHORIZATION_ERROR'
                }, req);
            }

            if (err instanceof NotFoundError) {
                return this.sendErrorResponse(res, {
                    statusCode: 404,
                    message: err.message,
                    code: 'NOT_FOUND'
                }, req);
            }

            if (err instanceof DatabaseError) {
                return this.sendErrorResponse(res, {
                    statusCode: 500,
                    message: 'Database operation failed',
                    code: 'DATABASE_ERROR'
                }, req);
            }

            // Handle specific error types
            let error = { ...err };
            error.message = err.message;
            error.statusCode = err.statusCode || 500;

            if (err.name === 'ValidationError') {
                error = this.handleValidationError(err);
            } else if (err.name === 'CastError') {
                error = this.handleCastError(err);
            } else if (err.code === 11000) {
                error = this.handleDuplicateFieldError(err);
            } else if (err.name === 'JsonWebTokenError') {
                error = this.handleJWTError();
            } else if (err.name === 'TokenExpiredError') {
                error = this.handleJWTExpiredError();
            } else if (err.code && err.code.startsWith('ER_')) {
                error = this.handleDatabaseError(err);
            }

            // Log error based on severity
            if (error.statusCode >= 500) {
                logger.error(error.message, { ...errorMeta, stack: err.stack });
            } else if (error.statusCode >= 400) {
                logger.warn(error.message, errorMeta);
            }

            this.sendErrorResponse(res, error, req);
        };
    }

    /**
     * 404 Not Found handler middleware
     * @returns {Function} Express middleware function
     */
    notFoundHandler() {
        return (req, res, next) => {
            const error = new NotFoundError(`Route ${req.originalUrl} not found`);
            next(error);
        };
    }

    /**
     * Async handler wrapper to catch errors
     * @param {Function} fn - Async function to wrap
     * @returns {Function} Wrapped function
     */
    asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    /**
     * Setup unhandled rejection handler
     */
    handleUnhandledRejection() {
        process.on('unhandledRejection', (reason, promise) => {
            logger.fatal('Unhandled Promise Rejection', {
                reason: reason?.message || reason,
                stack: reason?.stack,
                promise: promise
            });
            process.exit(1);
        });
    }

    /**
     * Setup uncaught exception handler
     */
    handleUncaughtException() {
        process.on('uncaughtException', (error) => {
            logger.fatal('Uncaught Exception', {
                message: error.message,
                stack: error.stack
            });
            process.exit(1);
        });
    }
}

// Create singleton instance
const errorHandlerMiddleware = new ErrorHandlerMiddleware();

module.exports = {
    // Error Classes
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    DatabaseError,

    // Middleware Class
    ErrorHandlerMiddleware,

    // Middleware functions
    errorHandler: errorHandlerMiddleware.handler(),
    asyncHandler: (fn) => errorHandlerMiddleware.asyncHandler(fn),
    notFoundHandler: errorHandlerMiddleware.notFoundHandler(),

    // Process handlers
    handleUnhandledRejection: () => errorHandlerMiddleware.handleUnhandledRejection(),
    handleUncaughtException: () => errorHandlerMiddleware.handleUncaughtException()
};
