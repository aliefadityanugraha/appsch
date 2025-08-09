"use strict";

const { ValidationError } = require('../middleware/errorHandler');
const { validate: uuidValidate } = require('uuid');

class ValidationService {
    static validateString(value, fieldName = 'Field', minLength = 0, maxLength = Infinity) {
        if (value === undefined || value === null) {
            throw new ValidationError(`${fieldName} is required`);
        }
        if (typeof value !== 'string') {
            throw new ValidationError(`${fieldName} must be a string`);
        }
        const trimmed = value.trim();
        if (trimmed.length < minLength) {
            throw new ValidationError(`${fieldName} must be at least ${minLength} characters`);
        }
        if (trimmed.length > maxLength) {
            throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`);
        }
    }

    static validateNumber(value, fieldName = 'Number', min = -Infinity, max = Infinity) {
        if (value === undefined || value === null) {
            throw new ValidationError(`${fieldName} is required`);
        }
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (Number.isNaN(num)) {
            throw new ValidationError(`${fieldName} must be a valid number`);
        }
        if (num < min) {
            throw new ValidationError(`${fieldName} must be greater than or equal to ${min}`);
        }
        if (num > max) {
            throw new ValidationError(`${fieldName} must be less than or equal to ${max}`);
        }
    }
    static validateUUID(id, fieldName = 'ID') {
        if (!id) {
            throw new ValidationError(`${fieldName} is required`, [{ field: fieldName.toLowerCase().replace(' ', ''), message: `${fieldName} is required` }]);
        }
        
        if (!uuidValidate(id)) {
            throw new ValidationError(`Invalid ${fieldName} format`, [{ field: fieldName.toLowerCase().replace(' ', ''), message: `Invalid ${fieldName} format` }]);
        }
    }

    static validateStaffData(data, requireAll = true) {
        const errors = [];
        
        // Required fields validation
        if (requireAll || data.name !== undefined) {
            if (!data.name || String(data.name).trim().length === 0) {
                errors.push({ field: 'name', message: 'Name is required' });
            } else if (String(data.name).trim().length < 2) {
                errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
            } else if (String(data.name).trim().length > 100) {
                errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
            }
        }
        
        if (requireAll || data.jabatan !== undefined) {
            if (!data.jabatan || String(data.jabatan).trim().length === 0) {
                errors.push({ field: 'jabatan', message: 'Jabatan is required' });
            } else if (String(data.jabatan).trim().length < 2) {
                errors.push({ field: 'jabatan', message: 'Jabatan must be at least 2 characters' });
            }
        }
        
        if (requireAll || data.nip !== undefined) {
            if (!data.nip || String(data.nip).trim().length === 0) {
                errors.push({ field: 'nip', message: 'NIP is required' });
            } else if (!/^[0-9]+$/.test(String(data.nip).trim())) {
                errors.push({ field: 'nip', message: 'NIP must contain only numbers' });
            } else if (String(data.nip).trim().length < 8 || String(data.nip).trim().length > 20) {
                errors.push({ field: 'nip', message: 'NIP must be between 8 and 20 digits' });
            }
        }
        
        if (requireAll || data.tunjangan !== undefined) {
            if (!data.tunjangan || String(data.tunjangan).trim().length === 0) {
                errors.push({ field: 'tunjangan', message: 'Tunjangan is required' });
            }
        }
        
        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }

    static validateTaskData(data, requireAll = true) {
        const errors = [];
        
        if (requireAll || data.description !== undefined) {
            if (!data.description || data.description.trim().length === 0) {
                errors.push({ field: 'description', message: 'Description is required' });
            } else if (data.description.trim().length < 5) {
                errors.push({ field: 'description', message: 'Description must be at least 5 characters' });
            }
        }
        
        if (requireAll || data.value !== undefined) {
            if (data.value === undefined || data.value === null) {
                errors.push({ field: 'value', message: 'Value is required' });
            } else if (isNaN(data.value) || data.value < 0 || data.value > 100) {
                errors.push({ field: 'value', message: 'Value must be a number between 0 and 100' });
            }
        }
        
        if (requireAll || data.staffId !== undefined) {
            if (!data.staffId) {
                errors.push({ field: 'staffId', message: 'Staff ID is required' });
            } else {
                ValidationService.validateUUID(data.staffId, 'Staff ID');
            }
        }
        
        if (requireAll || data.periodeId !== undefined) {
            if (!data.periodeId) {
                errors.push({ field: 'periodeId', message: 'Periode ID is required' });
            } else {
                ValidationService.validateUUID(data.periodeId, 'Periode ID');
            }
        }
        
        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }

    static validateRecordData(data, requireAll = true) {
        const errors = [];
        
        if (requireAll || data.value !== undefined) {
            if (data.value === undefined || data.value === null) {
                errors.push({ field: 'value', message: 'Value is required' });
            } else if (isNaN(data.value) || data.value < 0) {
                errors.push({ field: 'value', message: 'Value must be a positive number' });
            }
        }
        
        if (requireAll || data.staffId !== undefined) {
            if (!data.staffId) {
                errors.push({ field: 'staffId', message: 'Staff ID is required' });
            } else {
                ValidationService.validateUUID(data.staffId, 'Staff ID');
            }
        }
        
        // Note: taskId validation is removed because records are associated with multiple tasks
        // Task IDs are validated separately in the service layer
        
        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }

    static validatePeriodeData(data, requireAll = true) {
        const errors = [];
        
        if (requireAll || data.periode !== undefined) {
            if (!data.periode || data.periode.trim().length === 0) {
                errors.push({ field: 'periode', message: 'Periode is required' });
            } else if (data.periode.trim().length < 3) {
                errors.push({ field: 'periode', message: 'Periode must be at least 3 characters' });
            }
        }
        
        if (requireAll || data.nilai !== undefined) {
            if (data.nilai === undefined || data.nilai === null) {
                errors.push({ field: 'nilai', message: 'Nilai is required' });
            } else if (isNaN(data.nilai) || data.nilai < 0) {
                errors.push({ field: 'nilai', message: 'Nilai must be a positive number' });
            }
        }
        
        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }

    static validateUserData(data, requireAll = true) {
        const errors = [];
        
        if (requireAll || data.email !== undefined) {
            if (!data.email || data.email.trim().length === 0) {
                errors.push({ field: 'email', message: 'Email is required' });
            } else if (!ValidationService.isValidEmail(data.email.trim())) {
                errors.push({ field: 'email', message: 'Invalid email format' });
            }
        }
        
        if (requireAll || data.password !== undefined) {
            if (!data.password || data.password.length === 0) {
                errors.push({ field: 'password', message: 'Password is required' });
            } else if (data.password.length < 8) {
                errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
            } else if (!ValidationService.isStrongPassword(data.password)) {
                errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' });
            }
        }
        
        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }

    static validateDate(date, fieldName = 'Date') {
        if (!date) {
            throw new ValidationError(`${fieldName} is required`);
        }
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            throw new ValidationError(`Invalid ${fieldName} format`);
        }
    }

    static validateTaskStatus(status) {
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new ValidationError(`Invalid task status. Must be one of: ${validStatuses.join(', ')}`);
        }
    }

    static validatePeriodeStatus(status) {
        const validStatuses = ['draft', 'active', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new ValidationError(`Invalid period status. Must be one of: ${validStatuses.join(', ')}`);
        }
    }

    static validateDateRange(startDate, endDate) {
        if (!startDate || !endDate) {
            throw new ValidationError('Start date and end date are required');
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new ValidationError('Invalid date format');
        }
        
        if (start > end) {
            throw new ValidationError('Start date must be before end date');
        }
    }

    static validatePaginationParams(page, limit) {
        if (page && (isNaN(page) || page < 1)) {
            throw new ValidationError('Page must be a positive number');
        }
        
        if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
            throw new ValidationError('Limit must be a number between 1 and 100');
        }
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isStrongPassword(password) {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        return hasUpperCase && hasLowerCase && hasNumbers;
    }

    static sanitizeString(str) {
        if (typeof str !== 'string') return str;
        return str.trim().replace(/[<>"'&]/g, '');
    }

    static sanitizeNumber(num) {
        const parsed = parseFloat(num);
        return isNaN(parsed) ? 0 : parsed;
    }
}

module.exports = ValidationService;