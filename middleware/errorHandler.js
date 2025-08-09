"use strict";

const logger = require('../config/logger');

/**
 * Custom Error Classes
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

class ValidationError extends AppError {
    constructor(message, field = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
        this.field = field;
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTH_ERROR');
        this.name = 'AuthenticationError';
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

class DatabaseError extends AppError {
    constructor(message, originalError = null) {
        super(message, 500, 'DATABASE_ERROR');
        this.name = 'DatabaseError';
        this.originalError = originalError;
    }
}

/**
 * Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
    // Set default error values
    let error = { ...err };
    error.message = err.message;

    // Log the error
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
        return sendErrorResponse(res, {
            statusCode: 400,
            message: err.message,
            errors: err.field ? [{ field: err.field, message: err.message }] : err.errors,
            code: 'VALIDATION_ERROR'
        }, req);
    }
    
    if (err instanceof AuthenticationError) {
        return sendErrorResponse(res, {
            statusCode: 401,
            message: err.message,
            code: 'AUTH_ERROR'
        }, req);
    }
    
    if (err instanceof AuthorizationError) {
        return sendErrorResponse(res, {
            statusCode: 403,
            message: err.message,
            code: 'AUTHORIZATION_ERROR'
        }, req);
    }
    
    if (err instanceof NotFoundError) {
        return sendErrorResponse(res, {
            statusCode: 404,
            message: err.message,
            code: 'NOT_FOUND'
        }, req);
    }
    
    if (err instanceof DatabaseError) {
        return sendErrorResponse(res, {
            statusCode: 500,
            message: 'Database operation failed',
            code: 'DATABASE_ERROR'
        }, req);
    }

    // Handle specific error types
    if (err.name === 'ValidationError') {
        error = handleValidationError(err);
    } else if (err.name === 'CastError') {
        error = handleCastError(err);
    } else if (err.code === 11000) {
        error = handleDuplicateFieldError(err);
    } else if (err.name === 'JsonWebTokenError') {
        error = handleJWTError(err);
    } else if (err.name === 'TokenExpiredError') {
        error = handleJWTExpiredError(err);
    } else if (err.code && err.code.startsWith('ER_')) {
        error = handleDatabaseError(err);
    }

    // Log error based on severity
    if (error.statusCode >= 500) {
        logger.error(error.message, { ...errorMeta, stack: err.stack });
    } else if (error.statusCode >= 400) {
        logger.warn(error.message, errorMeta);
    }

    // Send error response
    sendErrorResponse(res, error, req);
}

/**
 * Handle Validation Errors
 */
function handleValidationError(err) {
    const errors = Object.values(err.errors).map(val => ({
        field: val.path,
        message: val.message
    }));
    
    return new ValidationError('Validation failed', errors);
}

/**
 * Handle Cast Errors
 */
function handleCastError(err) {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new ValidationError(message);
}

/**
 * Handle Duplicate Field Errors
 */
function handleDuplicateFieldError(err) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    return new ValidationError(message, field);
}

/**
 * Handle JWT Errors
 */
function handleJWTError(err) {
    return new AuthenticationError('Invalid token');
}

/**
 * Handle JWT Expired Errors
 */
function handleJWTExpiredError(err) {
    return new AuthenticationError('Token expired');
}

/**
 * Handle Database Errors
 */
function handleDatabaseError(err) {
    let message = 'Database operation failed';
    
    switch (err.code) {
        case 'ER_DUP_ENTRY':
            message = 'Duplicate entry detected';
            break;
        case 'ER_NO_SUCH_TABLE':
            message = 'Database table not found';
            break;
        case 'ER_BAD_FIELD_ERROR':
            message = 'Invalid database field';
            break;
        case 'ER_ACCESS_DENIED_ERROR':
            message = 'Database access denied';
            break;
        case 'ECONNREFUSED':
            message = 'Database connection refused';
            break;
        case 'ETIMEDOUT':
            message = 'Database connection timeout';
            break;
    }
    
    return new DatabaseError(message, err);
}

/**
 * Send Error Response
 */
function sendErrorResponse(res, error, req) {
    const statusCode = error.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Prepare error response
    const errorResponse = {
        success: false,
        error: {
            message: error.message || 'Internal server error',
            code: error.code || 'INTERNAL_ERROR',
            statusCode: statusCode
        }
    };

    // Add additional error details in development
    if (!isProduction) {
        errorResponse.error.stack = error.stack;
        errorResponse.error.details = error.details || null;
    }

    // Handle API vs Web requests
    const isApiRequest = req.originalUrl?.startsWith('/api') || 
                        req.get('Content-Type')?.includes('application/json') ||
                        req.get('Accept')?.includes('application/json');

    if (isApiRequest) {
        // Send JSON response for API requests
        res.status(statusCode).json(errorResponse);
    } else {
        // For web requests, use flash messages and redirect back
        let errorMessage = error.message;
        
        // For ValidationError, include field information if available
        if (error instanceof ValidationError && error.field) {
            if (Array.isArray(error.field)) {
                // Multiple validation errors
                const fieldErrors = error.field.map(f => `${f.field}: ${f.message}`).join(', ');
                errorMessage = `${error.message} (${fieldErrors})`;
            } else {
                // Single field error
                errorMessage = `${error.message} (Field: ${error.field})`;
            }
        }
        
        // Set flash message based on error type
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
        
        // Get the referer URL or fallback to home
        const redirectUrl = req.get('Referer') || '/';
        
        // Redirect back to the previous page with flash message
        res.redirect(redirectUrl);
    }
}

/**
 * Get Error Title
 */
function getErrorTitle(statusCode) {
    switch (statusCode) {
        case 400:
            return 'Bad Request';
        case 401:
            return 'Unauthorized';
        case 403:
            return 'Forbidden';
        case 404:
            return 'Not Found';
        case 422:
            return 'Validation Error';
        case 500:
            return 'Internal Server Error';
        case 503:
            return 'Service Unavailable';
        default:
            return 'Error';
    }
}

/**
 * Async Error Handler Wrapper
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * 404 Handler
 */
function notFoundHandler(req, res, next) {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    next(error);
}

/**
 * Unhandled Promise Rejection Handler
 */
function handleUnhandledRejection() {
    process.on('unhandledRejection', (reason, promise) => {
        logger.fatal('Unhandled Promise Rejection', {
            reason: reason?.message || reason,
            stack: reason?.stack,
            promise: promise
        });
        
        // Graceful shutdown
        process.exit(1);
    });
}

/**
 * Uncaught Exception Handler
 */
function handleUncaughtException() {
    process.on('uncaughtException', (error) => {
        logger.fatal('Uncaught Exception', {
            message: error.message,
            stack: error.stack
        });
        
        // Graceful shutdown
        process.exit(1);
    });
}

module.exports = {
    // Error Classes
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    DatabaseError,
    
    // Middleware
    errorHandler,
    asyncHandler,
    notFoundHandler,
    
    // Process handlers
    handleUnhandledRejection,
    handleUncaughtException
};