"use strict";

const BaseRepository = require('./BaseRepository');
const Task = require('../models/Task');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

class TaskRepository extends BaseRepository {
    constructor() {
        super(Task);
    }

    /**
     * Find tasks with related data (staff and periode)
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Tasks with relations
     */
    async findWithRelations(options = {}) {
        const query = this.model.query()
            .withGraphFetched('[staff, periode]');

        if (options.where) {
            query.where(options.where);
        }

        if (options.orderBy) {
            query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
        }

        if (options.limit) {
            query.limit(options.limit);
        }

        if (options.offset) {
            query.offset(options.offset);
        }

        return await query;
    }

    /**
     * Find tasks by staff ID
     * @param {string} staffId - Staff ID
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Tasks for the staff
     */
    async findByStaffId(staffId, options = {}) {
        if (!staffId) {
            throw new ValidationError('Staff ID is required');
        }

        const query = this.model.query()
            .where('staffId', staffId)
            .withGraphFetched('[staff, periode]');

        if (options.periodeId) {
            query.where('periodeId', options.periodeId);
        }

        if (options.status) {
            query.where('status', options.status);
        }

        if (options.orderBy) {
            query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
        } else {
            query.orderBy('createdAt', 'desc');
        }

        return await query;
    }

    /**
     * Find tasks by periode ID
     * @param {string} periodeId - Periode ID
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Tasks for the periode
     */
    async findByPeriodeId(periodeId, options = {}) {
        if (!periodeId) {
            throw new ValidationError('Periode ID is required');
        }

        const query = this.model.query()
            .where('periodeId', periodeId)
            .withGraphFetched('[staff, periode]');

        if (options.staffId) {
            query.where('staffId', options.staffId);
        }

        if (options.status) {
            query.where('status', options.status);
        }

        if (options.orderBy) {
            query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
        } else {
            query.orderBy('createdAt', 'desc');
        }

        return await query;
    }

    /**
     * Find tasks by status
     * @param {string} status - Task status
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Tasks with the specified status
     */
    async findByStatus(status, options = {}) {
        if (!status) {
            throw new ValidationError('Status is required');
        }

        const query = this.model.query()
            .where('status', status)
            .withGraphFetched('[staff, periode]');

        if (options.staffId) {
            query.where('staffId', options.staffId);
        }

        if (options.periodeId) {
            query.where('periodeId', options.periodeId);
        }

        if (options.orderBy) {
            query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
        } else {
            query.orderBy('createdAt', 'desc');
        }

        return await query;
    }

    /**
     * Search tasks by name or description
     * @param {string} searchTerm - Search term
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Matching tasks
     */
    async search(searchTerm, options = {}) {
        if (!searchTerm || searchTerm.trim().length === 0) {
            throw new ValidationError('Search term is required');
        }

        const query = this.model.query()
            .where(builder => {
                builder.where('description', 'like', `%${searchTerm}%`);
            })
            .withGraphFetched('[staff, periode]');

        if (options.staffId) {
            query.where('staffId', options.staffId);
        }

        if (options.periodeId) {
            query.where('periodeId', options.periodeId);
        }

        if (options.status) {
            query.where('status', options.status);
        }

        if (options.orderBy) {
            query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
        } else {
            query.orderBy('createdAt', 'desc');
        }

        if (options.limit) {
            query.limit(options.limit);
        }

        return await query;
    }

    /**
     * Get task statistics
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} Task statistics
     */
    async getStatistics(filters = {}) {
        const baseQuery = this.model.query();

        if (filters.staffId) {
            baseQuery.where('staffId', filters.staffId);
        }

        if (filters.periodeId) {
            baseQuery.where('periodeId', filters.periodeId);
        }

        if (filters.dateFrom) {
            baseQuery.where('createdAt', '>=', filters.dateFrom);
        }

        if (filters.dateTo) {
            baseQuery.where('createdAt', '<=', filters.dateTo);
        }

        const [total, completed, pending, inProgress] = await Promise.all([
            baseQuery.clone().count('* as count').first(),
            baseQuery.clone().where('status', 'completed').count('* as count').first(),
            baseQuery.clone().where('status', 'pending').count('* as count').first(),
            baseQuery.clone().where('status', 'in_progress').count('* as count').first()
        ]);

        return {
            total: parseInt(total.count) || 0,
            completed: parseInt(completed.count) || 0,
            pending: parseInt(pending.count) || 0,
            inProgress: parseInt(inProgress.count) || 0,
            completionRate: total.count > 0 ? ((completed.count / total.count) * 100).toFixed(2) : 0
        };
    }

    /**
     * Get tasks with pagination and filters
     * @param {Object} options - Pagination and filter options
     * @returns {Promise<Object>} Paginated tasks
     */
    async getPaginated(options = {}) {
        const {
            page = 1,
            limit = 10,
            staffId,
            periodeId,
            status,
            search,
            orderBy = 'createdAt',
            orderDirection = 'desc'
        } = options;

        const query = this.model.query()
            .withGraphFetched('[staff, periode]');

        // Apply filters
        if (staffId) {
            query.where('staffId', staffId);
        }

        if (periodeId) {
            query.where('periodeId', periodeId);
        }

        if (status) {
            query.where('status', status);
        }

        if (search) {
            query.where(builder => {
                builder.where('description', 'like', `%${search}%`);
            });
        }

        // Apply ordering
        query.orderBy(orderBy, orderDirection);

        // Manual pagination using the built query
        const offset = (page - 1) * limit;
        const [data, total] = await Promise.all([
            query.clone().limit(limit).offset(offset),
            query.clone().resultSize()
        ]);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        };
    }

    /**
     * Update task status
     * @param {string} id - Task ID
     * @param {string} status - New status
     * @param {string} updatedBy - User ID who updated
     * @returns {Promise<Object>} Updated task
     */
    async updateStatus(id, status, updatedBy) {
        if (!id || !status) {
            throw new ValidationError('Task ID and status are required');
        }

        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const task = await this.findById(id);
        if (!task) {
            throw new NotFoundError('Task not found');
        }

        const updateData = {
            status,
            updated_at: new Date()
        };

        if (status === 'completed') {
            updateData.completed_at = new Date();
        }

        return await this.update(id, updateData);
    }

    /**
     * Get tasks due soon
     * @param {number} days - Number of days to look ahead
     * @returns {Promise<Array>} Tasks due soon
     */
    async getTasksDueSoon(days = 7) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);

        return await this.model.query()
            .where('due_date', '<=', dueDate)
            .where('status', '!=', 'completed')
            .withGraphFetched('[staff, periode]')
            .orderBy('due_date', 'asc');
    }

    /**
     * Get overdue tasks
     * @returns {Promise<Array>} Overdue tasks
     */
    async getOverdueTasks() {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        return await this.model.query()
            .where('due_date', '<', today)
            .where('status', '!=', 'completed')
            .withGraphFetched('[staff, periode]')
            .orderBy('due_date', 'asc');
    }

    /**
     * Bulk update task status
     * @param {Array<string>} taskIds - Array of task IDs
     * @param {string} status - New status
     * @param {string} updatedBy - User ID who updated
     * @returns {Promise<number>} Number of updated tasks
     */
    async bulkUpdateStatus(taskIds, status, updatedBy) {
        if (!Array.isArray(taskIds) || taskIds.length === 0) {
            throw new ValidationError('Task IDs array is required');
        }

        if (!status) {
            throw new ValidationError('Status is required');
        }

        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const updateData = {
            status,
            updated_at: new Date()
        };

        if (status === 'completed') {
            updateData.completed_at = new Date();
        }

        const result = await this.model.query()
            .whereIn('id', taskIds)
            .patch(updateData);

        return result;
    }

    /**
     * Delete tasks by staff ID
     * @param {string} staffId - Staff ID
     * @returns {Promise<number>} Number of deleted tasks
     */
    async deleteByStaffId(staffId) {
        if (!staffId) {
            throw new ValidationError('Staff ID is required');
        }

        return await this.model.query()
            .where('staffId', staffId)
            .delete();
    }

    /**
     * Delete tasks by periode ID
     * @param {string} periodeId - Periode ID
     * @returns {Promise<number>} Number of deleted tasks
     */
    async deleteByPeriodeId(periodeId) {
        if (!periodeId) {
            throw new ValidationError('Periode ID is required');
        }

        return await this.model.query()
            .where('periodeId', periodeId)
            .delete();
    }
}

module.exports = TaskRepository;