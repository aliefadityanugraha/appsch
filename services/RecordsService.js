"use strict";

const RecordsRepository = require('../repositories/RecordsRepository');
const ValidationService = require('./ValidationService');
const { ValidationError, NotFoundError, DatabaseError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

class RecordsService {
    constructor() {
        this.recordsRepository = new RecordsRepository();
    }

    /**
     * Get all records with optional filters
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Array of records
     */
    async getAllRecords(filters = {}) {
        try {
            logger.info('Getting all records', { filters });
            
            const options = {
                orderBy: { column: 'createdAt', direction: 'desc' }
            };

            if (filters.staffId) {
                ValidationService.validateUUID(filters.staffId, 'Staff ID');
                options.where = { ...options.where, staffId: filters.staffId };
            }

            if (filters.dateFrom) {
                ValidationService.validateDate(filters.dateFrom, 'Date from');
            }

            if (filters.dateTo) {
                ValidationService.validateDate(filters.dateTo, 'Date to');
            }

            if (filters.limit) {
                options.limit = parseInt(filters.limit);
            }

            const records = await this.recordsRepository.findWithRelations(options);
            
            logger.info('Successfully retrieved records', { count: records.length });
            return records;
        } catch (error) {
            logger.error('Failed to get all records', { error: error.message, filters });
            throw error;
        }
    }

    /**
     * Get record by ID
     * @param {string} id - Record ID
     * @returns {Promise<Object>} Record object
     */
    async getRecordById(id) {
        try {
            ValidationService.validateUUID(id, 'Record ID');
            
            logger.info('Getting record by ID', { id });
            
            const record = await this.recordsRepository.findById(id);
            
            if (!record) {
                throw new NotFoundError('Record not found');
            }
            
            // Get record with relations
            const recordWithRelations = await this.recordsRepository.findWithRelations({
                where: { id }
            });
            
            logger.info('Successfully retrieved record', { id });
            return recordWithRelations[0];
        } catch (error) {
            logger.error('Failed to get record by ID', { error: error.message, id });
            throw error;
        }
    }

    /**
     * Create new record
     * @param {Object} recordData - Record data
     * @param {Array<string>} taskIds - Optional task IDs to associate
     * @returns {Promise<Object>} Created record
     */
    async createRecord(recordData, taskIds = []) {
        try {
            logger.info('Creating new record', { recordData: { ...recordData, value: '[REDACTED]' }, taskIds });
            
            // Validate record data
            ValidationService.validateRecordData(recordData);
            
            // Validate staff ID
            ValidationService.validateUUID(recordData.staffId, 'Staff ID');
            
            // Validate task IDs if provided
            if (taskIds && taskIds.length > 0) {
                // Filter out empty/null/undefined values
                const validTaskIds = taskIds.filter(taskId => taskId && taskId.trim && taskId.trim() !== '');
                
                if (validTaskIds.length !== taskIds.length) {
                    logger.warn('Found empty task IDs in request', { 
                        originalCount: taskIds.length, 
                        validCount: validTaskIds.length,
                        taskIds: taskIds
                    });
                    throw new ValidationError('Task ID is required', [{ field: 'taskId', message: 'Task ID is required' }]);
                }
                
                validTaskIds.forEach((taskId, index) => {
                    try {
                        ValidationService.validateUUID(taskId, 'Task ID');
                    } catch (error) {
                        logger.error(`Invalid task ID at index ${index}`, { taskId, error: error.message });
                        throw error;
                    }
                });
                
                // Update taskIds to use only valid ones
                taskIds = validTaskIds;
            }
            
            // Create record with tasks
            const record = await this.recordsRepository.createWithTasks(recordData, taskIds);
            
            logger.info('Successfully created record', { id: record.id });
            return record;
        } catch (error) {
            logger.error('Failed to create record', { error: error.message, recordData: { ...recordData, value: '[REDACTED]' }, taskIds });
            
            if (error.code === '23503') { // Foreign key constraint
                throw new ValidationError('Invalid staff ID or task ID');
            }
            
            throw error;
        }
    }

    /**
     * Update record
     * @param {string} id - Record ID
     * @param {Object} updateData - Update data
     * @param {Array<string>} taskIds - Optional task IDs to associate
     * @returns {Promise<Object>} Updated record
     */
    async updateRecord(id, updateData, taskIds = null) {
        try {
            ValidationService.validateUUID(id, 'Record ID');
            
            logger.info('Updating record', { id, updateData: { ...updateData, value: '[REDACTED]' }, taskIds });
            
            // Check if record exists
            const existingRecord = await this.recordsRepository.findById(id);
            if (!existingRecord) {
                throw new NotFoundError('Record not found');
            }
            
            // Validate update data
            if (updateData.value !== undefined) {
                ValidationService.validateNumber(updateData.value, 'Value', 0);
            }
            
            if (updateData.staffId !== undefined) {
                ValidationService.validateUUID(updateData.staffId, 'Staff ID');
            }
            
            // Validate task IDs if provided
            if (taskIds && taskIds.length > 0) {
                taskIds.forEach(taskId => ValidationService.validateUUID(taskId, 'Task ID'));
            }
            
            // Update record with tasks
            const updatedRecord = await this.recordsRepository.updateWithTasks(id, updateData, taskIds);
            
            logger.info('Successfully updated record', { id });
            return updatedRecord;
        } catch (error) {
            logger.error('Failed to update record', { error: error.message, id, updateData: { ...updateData, value: '[REDACTED]' }, taskIds });
            
            if (error.code === '23503') { // Foreign key constraint
                throw new ValidationError('Invalid staff ID or task ID');
            }
            
            throw error;
        }
    }

    /**
     * Delete record
     * @param {string} id - Record ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteRecord(id) {
        try {
            ValidationService.validateUUID(id, 'Record ID');
            
            logger.info('Deleting record', { id });
            
            // Check if record exists
            const existingRecord = await this.recordsRepository.findById(id);
            if (!existingRecord) {
                throw new NotFoundError('Record not found');
            }
            
            // Delete record
            const deleted = await this.recordsRepository.delete(id);
            
            if (!deleted) {
                throw new DatabaseError('Failed to delete record');
            }
            
            logger.info('Successfully deleted record', { id });
            return true;
        } catch (error) {
            logger.error('Failed to delete record', { error: error.message, id });
            throw error;
        }
    }

    /**
     * Get records by staff ID
     * @param {string} staffId - Staff ID
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Array of records
     */
    async getRecordsByStaffId(staffId, options = {}) {
        try {
            ValidationService.validateUUID(staffId, 'Staff ID');
            
            logger.info('Getting records by staff ID', { staffId, options });
            
            // Validate date filters if provided
            if (options.dateFrom) {
                ValidationService.validateDate(options.dateFrom, 'Date from');
            }
            
            if (options.dateTo) {
                ValidationService.validateDate(options.dateTo, 'Date to');
            }
            
            const records = await this.recordsRepository.findByStaffId(staffId, options);
            
            logger.info('Successfully retrieved records by staff ID', { staffId, count: records.length });
            return records;
        } catch (error) {
            logger.error('Failed to get records by staff ID', { error: error.message, staffId, options });
            throw error;
        }
    }

    /**
     * Get records by date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Array of records
     */
    async getRecordsByDateRange(startDate, endDate, options = {}) {
        try {
            ValidationService.validateDateRange(startDate, endDate);
            
            logger.info('Getting records by date range', { startDate, endDate, options });
            
            // Validate staff ID if provided
            if (options.staffId) {
                ValidationService.validateUUID(options.staffId, 'Staff ID');
            }
            
            const records = await this.recordsRepository.findByDateRange(startDate, endDate, options);
            
            logger.info('Successfully retrieved records by date range', { startDate, endDate, count: records.length });
            return records;
        } catch (error) {
            logger.error('Failed to get records by date range', { error: error.message, startDate, endDate, options });
            throw error;
        }
    }

    /**
     * Get records statistics
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Records statistics
     */
    async getRecordsStatistics(filters = {}) {
        try {
            logger.info('Getting records statistics', { filters });
            
            // Validate filters
            if (filters.staffId) {
                ValidationService.validateUUID(filters.staffId, 'Staff ID');
            }
            
            if (filters.dateFrom) {
                ValidationService.validateDate(filters.dateFrom, 'Date from');
            }
            
            if (filters.dateTo) {
                ValidationService.validateDate(filters.dateTo, 'Date to');
            }
            
            const statistics = await this.recordsRepository.getStatistics(filters);
            
            logger.info('Successfully retrieved records statistics', { statistics });
            return statistics;
        } catch (error) {
            logger.error('Failed to get records statistics', { error: error.message, filters });
            throw error;
        }
    }

    /**
     * Get paginated records
     * @param {Object} options - Pagination and filter options
     * @returns {Promise<Object>} Paginated records
     */
    async getPaginatedRecords(options = {}) {
        try {
            logger.info('Getting paginated records', { options });
            
            // Validate pagination parameters
            ValidationService.validatePaginationParams(options.page, options.limit);
            
            // Validate filters
            if (options.staffId) {
                ValidationService.validateUUID(options.staffId, 'Staff ID');
            }
            
            if (options.dateFrom) {
                ValidationService.validateDate(options.dateFrom, 'Date from');
            }
            
            if (options.dateTo) {
                ValidationService.validateDate(options.dateTo, 'Date to');
            }
            
            const result = await this.recordsRepository.getPaginated(options);
            
            logger.info('Successfully retrieved paginated records', { 
                page: result.page, 
                totalPages: result.totalPages, 
                totalItems: result.totalItems 
            });
            
            return result;
        } catch (error) {
            logger.error('Failed to get paginated records', { error: error.message, options });
            throw error;
        }
    }

    /**
     * Get records summary by staff
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Records summary grouped by staff
     */
    async getRecordsSummaryByStaff(filters = {}) {
        try {
            logger.info('Getting records summary by staff', { filters });
            
            // Validate date filters if provided
            if (filters.dateFrom) {
                ValidationService.validateDate(filters.dateFrom, 'Date from');
            }
            
            if (filters.dateTo) {
                ValidationService.validateDate(filters.dateTo, 'Date to');
            }
            
            const summary = await this.recordsRepository.getRecordsSummaryByStaff(filters);
            
            logger.info('Successfully retrieved records summary by staff', { count: summary.length });
            return summary;
        } catch (error) {
            logger.error('Failed to get records summary by staff', { error: error.message, filters });
            throw error;
        }
    }

    /**
     * Get records by task IDs
     * @param {Array<string>} taskIds - Array of task IDs
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Records associated with tasks
     */
    async getRecordsByTaskIds(taskIds, options = {}) {
        try {
            if (!Array.isArray(taskIds) || taskIds.length === 0) {
                throw new ValidationError('Task IDs array is required');
            }
            
            // Validate all task IDs
            taskIds.forEach(taskId => ValidationService.validateUUID(taskId, 'Task ID'));
            
            logger.info('Getting records by task IDs', { taskIds, options });
            
            const records = await this.recordsRepository.findByTaskIds(taskIds, options);
            
            logger.info('Successfully retrieved records by task IDs', { taskIds, count: records.length });
            return records;
        } catch (error) {
            logger.error('Failed to get records by task IDs', { error: error.message, taskIds, options });
            throw error;
        }
    }

    /**
     * Bulk delete records
     * @param {Array<string>} recordIds - Array of record IDs
     * @returns {Promise<number>} Number of deleted records
     */
    async bulkDeleteRecords(recordIds) {
        try {
            if (!Array.isArray(recordIds) || recordIds.length === 0) {
                throw new ValidationError('Record IDs array is required');
            }
            
            // Validate all record IDs
            recordIds.forEach(recordId => ValidationService.validateUUID(recordId, 'Record ID'));
            
            logger.info('Bulk deleting records', { recordIds });
            
            const deletedCount = await this.recordsRepository.bulkDelete(recordIds);
            
            logger.info('Successfully bulk deleted records', { recordIds, deletedCount });
            return deletedCount;
        } catch (error) {
            logger.error('Failed to bulk delete records', { error: error.message, recordIds });
            throw error;
        }
    }
}

module.exports = RecordsService;