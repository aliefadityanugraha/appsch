"use strict";

class ResponseFormatter {
    /**
     * Format success response
     * @param {*} data - Response data
     * @param {string} message - Success message
     * @param {number} statusCode - HTTP status code
     * @returns {Object} Formatted response
     */
    static success(data = null, message = 'Success', statusCode = 200) {
        return {
            success: true,
            statusCode,
            message,
            data,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Format error response
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {*} errors - Detailed errors
     * @param {string} code - Error code
     * @returns {Object} Formatted error response
     */
    static error(message = 'Internal Server Error', statusCode = 500, errors = null, code = null) {
        const response = {
            success: false,
            statusCode,
            message,
            timestamp: new Date().toISOString()
        };

        if (errors) {
            response.errors = errors;
        }

        if (code) {
            response.code = code;
        }

        return response;
    }

    /**
     * Format validation error response
     * @param {Array} validationErrors - Array of validation errors
     * @param {string} message - Main error message
     * @returns {Object} Formatted validation error response
     */
    static validationError(validationErrors, message = 'Validation failed') {
        return this.error(message, 400, validationErrors, 'VALIDATION_ERROR');
    }

    /**
     * Format not found error response
     * @param {string} resource - Resource name
     * @returns {Object} Formatted not found response
     */
    static notFound(resource = 'Resource') {
        return this.error(`${resource} not found`, 404, null, 'NOT_FOUND');
    }

    /**
     * Format unauthorized error response
     * @param {string} message - Error message
     * @returns {Object} Formatted unauthorized response
     */
    static unauthorized(message = 'Unauthorized access') {
        return this.error(message, 401, null, 'UNAUTHORIZED');
    }

    /**
     * Format forbidden error response
     * @param {string} message - Error message
     * @returns {Object} Formatted forbidden response
     */
    static forbidden(message = 'Access forbidden') {
        return this.error(message, 403, null, 'FORBIDDEN');
    }

    /**
     * Format paginated response
     * @param {Array} data - Array of data
     * @param {Object} pagination - Pagination info
     * @param {string} message - Success message
     * @returns {Object} Formatted paginated response
     */
    static paginated(data, pagination, message = 'Data retrieved successfully') {
        return {
            success: true,
            statusCode: 200,
            message,
            data,
            pagination,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Format created response
     * @param {*} data - Created resource data
     * @param {string} message - Success message
     * @returns {Object} Formatted created response
     */
    static created(data, message = 'Resource created successfully') {
        return this.success(data, message, 201);
    }

    /**
     * Format updated response
     * @param {*} data - Updated resource data
     * @param {string} message - Success message
     * @returns {Object} Formatted updated response
     */
    static updated(data, message = 'Resource updated successfully') {
        return this.success(data, message, 200);
    }

    /**
     * Format deleted response
     * @param {string} message - Success message
     * @returns {Object} Formatted deleted response
     */
    static deleted(message = 'Resource deleted successfully') {
        return this.success(null, message, 200);
    }

    /**
     * Send JSON response with proper status code
     * @param {Object} res - Express response object
     * @param {Object} responseData - Formatted response data
     */
    static send(res, responseData) {
        return res.status(responseData.statusCode).json(responseData);
    }

    /**
     * Send success response
     * @param {Object} res - Express response object
     * @param {*} data - Response data
     * @param {string} message - Success message
     * @param {number} statusCode - HTTP status code
     */
    static sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
        const response = this.success(data, message, statusCode);
        return this.send(res, response);
    }

    /**
     * Send error response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {*} errors - Detailed errors
     * @param {string} code - Error code
     */
    static sendError(res, message = 'Internal Server Error', statusCode = 500, errors = null, code = null) {
        const response = this.error(message, statusCode, errors, code);
        return this.send(res, response);
    }

    /**
     * Send paginated response
     * @param {Object} res - Express response object
     * @param {Array} data - Array of data
     * @param {Object} pagination - Pagination info
     * @param {string} message - Success message
     */
    static sendPaginated(res, data, pagination, message = 'Data retrieved successfully') {
        const response = this.paginated(data, pagination, message);
        return this.send(res, response);
    }

    /**
     * Handle view rendering with flash messages
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {string} view - View template name
     * @param {Object} data - View data
     * @param {Object} options - Additional options
     */
    static renderView(req, res, view, data = {}, options = {}) {
        const viewData = {
            ...data,
            req: req.path,
            message: req.flash('message')[0] || '',
            type: req.flash('type')[0] || 'success',
            csrfToken: req.session.csrfToken,
            ...options
        };

        return res.render(view, viewData);
    }

    /**
     * Set flash message and redirect
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {string} redirectPath - Redirect path
     * @param {string} message - Flash message
     * @param {string} type - Message type (success, error, warning, info)
     */
    static redirectWithFlash(req, res, redirectPath, message, type = 'success') {
        // Use the new flash message system
        req.flash(type, message);
        // Keep backward compatibility
        req.flash('message', message);
        req.flash('type', type);
        return res.redirect(redirectPath);
    }

    /**
     * Handle async controller errors
     * @param {Function} controllerFn - Controller function
     * @returns {Function} Wrapped controller function
     */
    static asyncHandler(controllerFn) {
        return (req, res, next) => {
            Promise.resolve(controllerFn(req, res, next)).catch(next);
        };
    }
}

module.exports = ResponseFormatter;