"use strict";

const PeriodeRepository = require('../repositories/PeriodeRepository');
const ValidationService = require('./ValidationService');
const { ValidationError, NotFoundError, DatabaseError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

class PeriodeService {
    constructor() {
        this.periodeRepository = new PeriodeRepository();
    }

    /**
     * Get all periods with optional filters
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Array of periods
     */
    async getAllPeriods(filters = {}) {
        try {
            logger.info('Getting all periods', { filters });
            
            const options = {
                orderBy: { column: 'start_date', direction: 'desc' }
            };

            if (filters.status) {
                ValidationService.validatePeriodeStatus(filters.status);
                options.status = filters.status;
            }

            if (filters.year) {
                ValidationService.validateNumber(filters.year, 'Year', 1900, 2100);
                options.year = filters.year;
            }

            if (filters.active) {
                options.active = true;
            }

            if (filters.includeRelations) {
                options.includeRelations = true;
            }

            if (filters.limit) {
                options.limit = parseInt(filters.limit);
            }

            const periods = await this.periodeRepository.findWithRelations(options);
            
            logger.info('Successfully retrieved periods', { count: periods.length });
            return periods;
        } catch (error) {
            logger.error('Failed to get all periods', { error: error.message, filters });
            throw error;
        }
    }

    /**
     * Get period by ID
     * @param {string} id - Period ID
     * @returns {Promise<Object>} Period object
     */
    async getPeriodeById(id) {
        try {
            ValidationService.validateUUID(id, 'Period ID');
            
            logger.info('Getting period by ID', { id });
            
            const period = await this.periodeRepository.findById(id);
            
            if (!period) {
                throw new NotFoundError('Period not found');
            }
            
            // Get period with relations
            const periodWithRelations = await this.periodeRepository.findWithRelations({
                where: { id },
                includeRelations: true
            });
            
            logger.info('Successfully retrieved period', { id });
            return periodWithRelations[0];
        } catch (error) {
            logger.error('Failed to get period by ID', { error: error.message, id });
            throw error;
        }
    }

    /**
     * Create new period
     * @param {Object} periodData - Period data
     * @returns {Promise<Object>} Created period
     */
    async createPeriode(periodData) {
        try {
            logger.info('Creating new period', { periodData });
            
            // Validate period data
            ValidationService.validatePeriodeData(periodData);
            
            // Validate date range
            ValidationService.validateDateRange(periodData.start_date, periodData.end_date);
            
            // Check for overlapping periods
            const overlappingPeriods = await this.periodeRepository.findOverlappingPeriods(
                periodData.start_date, 
                periodData.end_date
            );
            
            if (overlappingPeriods.length > 0) {
                throw new ValidationError('Period dates overlap with existing active periods');
            }
            
            // Set default status if not provided
            if (!periodData.status) {
                periodData.status = 'draft';
            }
            
            // Create period
            const period = await this.periodeRepository.create(periodData);
            
            logger.info('Successfully created period', { id: period.id });
            return period;
        } catch (error) {
            logger.error('Failed to create period', { error: error.message, periodData });
            
            if (error.code === '23505') { // Unique constraint violation
                throw new ValidationError('Period with this name already exists');
            }
            
            throw error;
        }
    }

    /**
     * Update period
     * @param {string} id - Period ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated period
     */
    async updatePeriode(id, updateData) {
        try {
            ValidationService.validateUUID(id, 'Period ID');
            
            logger.info('Updating period', { id, updateData });
            
            // Check if period exists
            const existingPeriod = await this.periodeRepository.findById(id);
            if (!existingPeriod) {
                throw new NotFoundError('Period not found');
            }
            
            // Validate update data
            if (updateData.name !== undefined) {
                ValidationService.validateString(updateData.name, 'Name', 1, 100);
            }
            
            if (updateData.description !== undefined) {
                ValidationService.validateString(updateData.description, 'Description', 0, 500);
            }
            
            if (updateData.status !== undefined) {
                ValidationService.validatePeriodeStatus(updateData.status);
            }
            
            // Validate date range if dates are being updated
            if (updateData.start_date || updateData.end_date) {
                const startDate = updateData.start_date || existingPeriod.start_date;
                const endDate = updateData.end_date || existingPeriod.end_date;
                
                ValidationService.validateDateRange(startDate, endDate);
                
                // Check for overlapping periods (excluding current period)
                const overlappingPeriods = await this.periodeRepository.findOverlappingPeriods(
                    startDate, 
                    endDate, 
                    id
                );
                
                if (overlappingPeriods.length > 0) {
                    throw new ValidationError('Period dates overlap with existing active periods');
                }
            }
            
            // Update period
            const updatedPeriod = await this.periodeRepository.update(id, updateData);
            
            logger.info('Successfully updated period', { id });
            return updatedPeriod;
        } catch (error) {
            logger.error('Failed to update period', { error: error.message, id, updateData });
            
            if (error.code === '23505') { // Unique constraint violation
                throw new ValidationError('Period with this name already exists');
            }
            
            throw error;
        }
    }

    /**
     * Delete period
     * @param {string} id - Period ID
     * @returns {Promise<boolean>} Success status
     */
    async deletePeriode(id) {
        try {
            ValidationService.validateUUID(id, 'Period ID');
            
            logger.info('Deleting period', { id });
            
            // Check if period exists
            const existingPeriod = await this.periodeRepository.findById(id);
            if (!existingPeriod) {
                throw new NotFoundError('Period not found');
            }
            
            // Check if period has associated tasks
            const periodWithRelations = await this.periodeRepository.findWithRelations({
                where: { id },
                includeRelations: true
            });
            
            if (periodWithRelations[0] && periodWithRelations[0].tasks && periodWithRelations[0].tasks.length > 0) {
                throw new ValidationError('Cannot delete period with associated tasks');
            }
            
            // Delete period
            const deleted = await this.periodeRepository.delete(id);
            
            if (!deleted) {
                throw new DatabaseError('Failed to delete period');
            }
            
            logger.info('Successfully deleted period', { id });
            return true;
        } catch (error) {
            logger.error('Failed to delete period', { error: error.message, id });
            throw error;
        }
    }

    /**
     * Get periods by status
     * @param {string} status - Period status
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Array of periods
     */
    async getPeriodsByStatus(status, options = {}) {
        try {
            ValidationService.validatePeriodeStatus(status);
            
            logger.info('Getting periods by status', { status, options });
            
            const periods = await this.periodeRepository.findByStatus(status, options);
            
            logger.info('Successfully retrieved periods by status', { status, count: periods.length });
            return periods;
        } catch (error) {
            logger.error('Failed to get periods by status', { error: error.message, status, options });
            throw error;
        }
    }

    /**
     * Get active periods
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Array of active periods
     */
    async getActivePeriods(options = {}) {
        try {
            logger.info('Getting active periods', { options });
            
            const periods = await this.periodeRepository.findActivePeriods(options);
            
            logger.info('Successfully retrieved active periods', { count: periods.length });
            return periods;
        } catch (error) {
            logger.error('Failed to get active periods', { error: error.message, options });
            throw error;
        }
    }

    /**
     * Get periods by year
     * @param {number} year - Year
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Array of periods
     */
    async getPeriodsByYear(year, options = {}) {
        try {
            ValidationService.validateNumber(year, 'Year', 1900, 2100);
            
            logger.info('Getting periods by year', { year, options });
            
            const periods = await this.periodeRepository.findByYear(year, options);
            
            logger.info('Successfully retrieved periods by year', { year, count: periods.length });
            return periods;
        } catch (error) {
            logger.error('Failed to get periods by year', { error: error.message, year, options });
            throw error;
        }
    }

    /**
     * Get periods by date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Array of periods
     */
    async getPeriodsByDateRange(startDate, endDate, options = {}) {
        try {
            ValidationService.validateDateRange(startDate, endDate);
            
            logger.info('Getting periods by date range', { startDate, endDate, options });
            
            const periods = await this.periodeRepository.findByDateRange(startDate, endDate, options);
            
            logger.info('Successfully retrieved periods by date range', { startDate, endDate, count: periods.length });
            return periods;
        } catch (error) {
            logger.error('Failed to get periods by date range', { error: error.message, startDate, endDate, options });
            throw error;
        }
    }

    /**
     * Get periods statistics
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Periods statistics
     */
    async getPeriodsStatistics(filters = {}) {
        try {
            logger.info('Getting periods statistics', { filters });
            
            // Validate filters
            if (filters.year) {
                ValidationService.validateNumber(filters.year, 'Year', 1900, 2100);
            }
            
            if (filters.status) {
                ValidationService.validatePeriodeStatus(filters.status);
            }
            
            const statistics = await this.periodeRepository.getStatistics(filters);
            
            logger.info('Successfully retrieved periods statistics', { statistics });
            return statistics;
        } catch (error) {
            logger.error('Failed to get periods statistics', { error: error.message, filters });
            throw error;
        }
    }

    /**
     * Get paginated periods
     * @param {Object} options - Pagination and filter options
     * @returns {Promise<Object>} Paginated periods
     */
    async getPaginatedPeriods(options = {}) {
        try {
            logger.info('Getting paginated periods', { options });
            
            // Validate pagination parameters
            ValidationService.validatePaginationParams(options.page, options.limit);
            
            // Validate filters
            if (options.status) {
                ValidationService.validatePeriodeStatus(options.status);
            }
            
            if (options.year) {
                ValidationService.validateNumber(options.year, 'Year', 1900, 2100);
            }
            
            const result = await this.periodeRepository.getPaginated(options);
            
            logger.info('Successfully retrieved paginated periods', { 
                page: result.pagination.page, 
                totalPages: result.pagination.totalPages, 
                totalItems: result.pagination.totalItems 
            });
            
            return result;
        } catch (error) {
            logger.error('Failed to get paginated periods', { error: error.message, options });
            throw error;
        }
    }

    /**
     * Update period status
     * @param {string} id - Period ID
     * @param {string} status - New status
     * @returns {Promise<Object>} Updated period
     */
    async updatePeriodeStatus(id, status) {
        try {
            ValidationService.validateUUID(id, 'Period ID');
            ValidationService.validatePeriodeStatus(status);
            
            logger.info('Updating period status', { id, status });
            
            // Check if period exists
            const existingPeriod = await this.periodeRepository.findById(id);
            if (!existingPeriod) {
                throw new NotFoundError('Period not found');
            }
            
            // Additional validation for status transitions
            if (status === 'active' && existingPeriod.status === 'completed') {
                throw new ValidationError('Cannot reactivate a completed period');
            }
            
            if (status === 'active') {
                // Check for overlapping active periods
                const overlappingPeriods = await this.periodeRepository.findOverlappingPeriods(
                    existingPeriod.start_date, 
                    existingPeriod.end_date, 
                    id
                );
                
                if (overlappingPeriods.length > 0) {
                    throw new ValidationError('Cannot activate period due to overlapping active periods');
                }
            }
            
            const updatedPeriod = await this.periodeRepository.updateStatus(id, status);
            
            logger.info('Successfully updated period status', { id, status });
            return updatedPeriod;
        } catch (error) {
            logger.error('Failed to update period status', { error: error.message, id, status });
            throw error;
        }
    }

    /**
     * Bulk update period status
     * @param {Array<string>} periodIds - Array of period IDs
     * @param {string} status - New status
     * @returns {Promise<number>} Number of updated periods
     */
    async bulkUpdatePeriodeStatus(periodIds, status) {
        try {
            if (!Array.isArray(periodIds) || periodIds.length === 0) {
                throw new ValidationError('Period IDs array is required');
            }
            
            // Validate all period IDs
            periodIds.forEach(periodId => ValidationService.validateUUID(periodId, 'Period ID'));
            ValidationService.validatePeriodeStatus(status);
            
            logger.info('Bulk updating period status', { periodIds, status });
            
            const updatedCount = await this.periodeRepository.bulkUpdateStatus(periodIds, status);
            
            logger.info('Successfully bulk updated period status', { periodIds, status, updatedCount });
            return updatedCount;
        } catch (error) {
            logger.error('Failed to bulk update period status', { error: error.message, periodIds, status });
            throw error;
        }
    }

    /**
     * Check for overlapping periods
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {string} excludeId - Period ID to exclude from check
     * @returns {Promise<Array>} Array of overlapping periods
     */
    async checkOverlappingPeriods(startDate, endDate, excludeId = null) {
        try {
            ValidationService.validateDateRange(startDate, endDate);
            
            if (excludeId) {
                ValidationService.validateUUID(excludeId, 'Exclude Period ID');
            }
            
            logger.info('Checking for overlapping periods', { startDate, endDate, excludeId });
            
            const overlappingPeriods = await this.periodeRepository.findOverlappingPeriods(
                startDate, 
                endDate, 
                excludeId
            );
            
            logger.info('Found overlapping periods', { startDate, endDate, excludeId, count: overlappingPeriods.length });
            return overlappingPeriods;
        } catch (error) {
            logger.error('Failed to check overlapping periods', { error: error.message, startDate, endDate, excludeId });
            throw error;
        }
    }
}

module.exports = PeriodeService;