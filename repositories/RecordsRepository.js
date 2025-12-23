"use strict";

const BaseRepository = require('./BaseRepository');
const Records = require('../models/Records');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

class RecordsRepository extends BaseRepository {
    constructor() {
        super(Records);
    }

    /**
     * Find records with related data (staff and tasks)
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Records with relations
     */
    async findWithRelations(options = {}) {
        const query = this.model.query()
            .withGraphFetched('[staff, tasks]');

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
     * Find records by staff ID
     * @param {string} staffId - Staff ID
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Records for the staff
     */
    async findByStaffId(staffId, options = {}) {
        if (!staffId) {
            throw new ValidationError('Staff ID is required');
        }

        const query = this.model.query()
            .where('staffId', staffId)
            .withGraphFetched('[staff, tasks(selectBasicFields)]')
            .modifiers({
                selectBasicFields(builder) {
                    builder.select('id', 'description', 'value', 'staffId', 'periodeid');
                }
            });

        if (options.dateFrom) {
            query.where('createdAt', '>=', options.dateFrom);
        }

        if (options.dateTo) {
            query.where('createdAt', '<=', options.dateTo);
        }

        if (options.orderBy) {
            query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
        } else {
            query.orderBy('createdAt', 'desc');
        }

        return await query;
    }

    /**
     * Find records by date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Records in date range
     */
    async findByDateRange(startDate, endDate, options = {}) {
        if (!startDate || !endDate) {
            throw new ValidationError('Start date and end date are required');
        }

        const query = this.model.query()
            .whereBetween('createdAt', [startDate, endDate])
            .withGraphFetched('[staff, tasks]');

        if (options.staffId) {
            query.where('staffId', options.staffId);
        }

        if (options.orderBy) {
            query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
        } else {
            query.orderBy('createdAt', 'desc');
        }

        return await query;
    }

    /**
     * Get records statistics
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} Records statistics
     */
    async getStatistics(filters = {}) {
        const baseQuery = this.model.query();

        if (filters.staffId) {
            baseQuery.where('staffId', filters.staffId);
        }

        if (filters.dateFrom) {
            baseQuery.where('createdAt', '>=', filters.dateFrom);
        }

        if (filters.dateTo) {
            baseQuery.where('createdAt', '<=', filters.dateTo);
        }

        const [total, totalValue, avgValue, maxValue, minValue] = await Promise.all([
            baseQuery.clone().count('* as count').first(),
            baseQuery.clone().sum('value as total').first(),
            baseQuery.clone().avg('value as average').first(),
            baseQuery.clone().max('value as maximum').first(),
            baseQuery.clone().min('value as minimum').first()
        ]);

        return {
            total: parseInt(total.count) || 0,
            totalValue: parseFloat(totalValue.total) || 0,
            averageValue: parseFloat(avgValue.average) || 0,
            maximumValue: parseFloat(maxValue.maximum) || 0,
            minimumValue: parseFloat(minValue.minimum) || 0
        };
    }

    /**
     * Get records with pagination and filters
     * @param {Object} options - Pagination and filter options
     * @returns {Promise<Object>} Paginated records
     */
    async getPaginated(options = {}) {
        const {
            page = 1,
            limit = 10,
            staffId,
            dateFrom,
            dateTo,
            orderBy = 'created_at',
            orderDirection = 'desc'
        } = options;

        const query = this.model.query()
            .withGraphFetched('[staff, tasks]');

        // Apply filters
        if (staffId) {
            query.where('staffId', staffId);
        }

        if (dateFrom) {
            query.where('created_at', '>=', dateFrom);
        }

        if (dateTo) {
            query.where('created_at', '<=', dateTo);
        }

        // Apply ordering
        query.orderBy(orderBy, orderDirection);

        return await this.paginate(query, page, limit);
    }

    /**
     * Create record with tasks
     * @param {Object} recordData - Record data
     * @param {Array<string>} taskIds - Array of task IDs
     * @returns {Promise<Object>} Created record
     */
    async createWithTasks(recordData, taskIds = []) {
        const trx = await this.model.startTransaction();

        try {
            // Robust duplicate check using local date parts to avoid UTC shifts
            const targetDate = recordData.createdAt ? new Date(recordData.createdAt) : new Date();

            // Generate local YYYY-MM-DD strings for comparison
            const yr = targetDate.getFullYear();
            const mt = String(targetDate.getMonth() + 1).padStart(2, '0');
            const dy = String(targetDate.getDate()).padStart(2, '0');

            const startOfDay = `${yr}-${mt}-${dy} 00:00:00`;
            const endOfDay = `${yr}-${mt}-${dy} 23:59:59`;

            const existingRecord = await this.model.query(trx)
                .where('staffId', recordData.staffId)
                .whereBetween('createdAt', [startOfDay, endOfDay])
                .first();

            if (existingRecord) {
                throw new ValidationError(
                    `Record untuk staff ini sudah ada pada tanggal ${targetDate.toLocaleDateString('id-ID')}. Hanya boleh ada satu record per staff per hari.`,
                    [{ field: 'staffId', message: 'Duplicate record for this date' }]
                );
            }

            // Create record
            const record = await this.model.query(trx).insert(recordData);

            // Associate with tasks if provided
            if (taskIds && taskIds.length > 0) {
                // Use individual relate calls for MySQL compatibility
                for (const taskId of taskIds) {
                    await record.$relatedQuery('tasks', trx).relate(taskId);
                }
            }

            await trx.commit();

            // Return record with relations
            return await this.model.query()
                .findById(record.id)
                .withGraphFetched('[staff, tasks]');
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    /**
     * Update record with tasks
     * @param {string} id - Record ID
     * @param {Object} updateData - Update data
     * @param {Array<string>} taskIds - Array of task IDs
     * @returns {Promise<Object>} Updated record
     */
    async updateWithTasks(id, updateData, taskIds = null) {
        const trx = await this.model.startTransaction();

        try {
            // Update record
            await this.model.query(trx).findById(id).patch(updateData);

            // Update task associations if provided
            if (taskIds !== null) {
                const record = await this.model.query(trx).findById(id);

                // Unrelate all existing tasks
                await record.$relatedQuery('tasks', trx).unrelate();

                // Relate new tasks
                if (taskIds.length > 0) {
                    // Use individual relate calls for MySQL compatibility (avoid batch insert error)
                    for (const taskId of taskIds) {
                        await record.$relatedQuery('tasks', trx).relate(taskId);
                    }
                }
            }

            await trx.commit();

            // Return updated record with relations
            return await this.model.query()
                .findById(id)
                .withGraphFetched('[staff, tasks]');
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    /**
     * Delete records by staff ID
     * @param {string} staffId - Staff ID
     * @returns {Promise<number>} Number of deleted records
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
     * Get records summary by staff
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} Records summary grouped by staff
     */
    async getRecordsSummaryByStaff(filters = {}) {
        const query = this.model.query()
            .select('staffId')
            .count('* as recordCount')
            .sum('value as totalValue')
            .avg('value as averageValue')
            .groupBy('staffId')
            .withGraphFetched('staff');

        if (filters.dateFrom) {
            query.where('createdAt', '>=', filters.dateFrom);
        }

        if (filters.dateTo) {
            query.where('createdAt', '<=', filters.dateTo);
        }

        return await query;
    }

    /**
     * Get records by task IDs
     * @param {Array<string>} taskIds - Array of task IDs
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Records associated with tasks
     */
    async findByTaskIds(taskIds, options = {}) {
        if (!Array.isArray(taskIds) || taskIds.length === 0) {
            throw new ValidationError('Task IDs array is required');
        }

        const query = this.model.query()
            .joinRelated('tasks')
            .whereIn('tasks.id', taskIds)
            .withGraphFetched('[staff, tasks]');

        if (options.orderBy) {
            query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
        } else {
            query.orderBy('created_at', 'desc');
        }

        return await query;
    }

    /**
     * Bulk delete records
     * @param {Array<string>} recordIds - Array of record IDs
     * @returns {Promise<number>} Number of deleted records
     */
    async bulkDelete(recordIds) {
        if (!Array.isArray(recordIds) || recordIds.length === 0) {
            throw new ValidationError('Record IDs array is required');
        }

        return await this.model.query()
            .whereIn('id', recordIds)
            .delete();
    }
}

module.exports = RecordsRepository;