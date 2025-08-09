"use strict";

const BaseRepository = require('./BaseRepository');
const Periode = require('../models/Periode');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

class PeriodeRepository extends BaseRepository {
    constructor() {
        super(Periode);
    }

    /**
     * Find periods with relations
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of periods with relations
     */
    async findWithRelations(options = {}) {
        try {
            let query = this.model.query();

            // Apply relations
            if (options.includeRelations) {
                query = query.withGraphFetched('[tasks, staff]');
            }

            // Apply filters
            if (options.where) {
                query = query.where(options.where);
            }

            if (options.status) {
                query = query.where('status', options.status);
            }

            if (options.year) {
                query = query.whereRaw('YEAR(start_date) = ? OR YEAR(end_date) = ?', [options.year, options.year]);
            }

            if (options.active) {
                const now = new Date();
                query = query.where('start_date', '<=', now)
                           .where('end_date', '>=', now)
                           .where('status', 'active');
            }

            // Apply ordering
            if (options.orderBy) {
                query = query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
            } else {
                query = query.orderBy('start_date', 'desc');
            }

            // Apply pagination
            if (options.limit) {
                query = query.limit(options.limit);
            }

            if (options.offset) {
                query = query.offset(options.offset);
            }

            const periods = await query;
            logger.info('Found periods with relations', { count: periods.length, options });
            
            return periods;
        } catch (error) {
            logger.error('Failed to find periods with relations', { error: error.message, options });
            throw error;
        }
    }

    /**
     * Find periods by status
     * @param {string} status - Period status
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Array of periods
     */
    async findByStatus(status, options = {}) {
        try {
            let query = this.model.query().where('status', status);

            if (options.includeRelations) {
                query = query.withGraphFetched('[tasks, staff]');
            }

            if (options.orderBy) {
                query = query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
            } else {
                query = query.orderBy('start_date', 'desc');
            }

            const periods = await query;
            logger.info('Found periods by status', { status, count: periods.length });
            
            return periods;
        } catch (error) {
            logger.error('Failed to find periods by status', { error: error.message, status });
            throw error;
        }
    }

    /**
     * Find periods by date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Array of periods
     */
    async findByDateRange(startDate, endDate, options = {}) {
        try {
            let query = this.model.query()
                .where(function() {
                    this.whereBetween('start_date', [startDate, endDate])
                        .orWhereBetween('end_date', [startDate, endDate])
                        .orWhere(function() {
                            this.where('start_date', '<=', startDate)
                                .where('end_date', '>=', endDate);
                        });
                });

            if (options.includeRelations) {
                query = query.withGraphFetched('[tasks, staff]');
            }

            if (options.status) {
                query = query.where('status', options.status);
            }

            if (options.orderBy) {
                query = query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
            } else {
                query = query.orderBy('start_date', 'asc');
            }

            const periods = await query;
            logger.info('Found periods by date range', { startDate, endDate, count: periods.length });
            
            return periods;
        } catch (error) {
            logger.error('Failed to find periods by date range', { error: error.message, startDate, endDate });
            throw error;
        }
    }

    /**
     * Find active periods
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Array of active periods
     */
    async findActivePeriods(options = {}) {
        try {
            const now = new Date();
            let query = this.model.query()
                .where('start_date', '<=', now)
                .where('end_date', '>=', now)
                .where('status', 'active');

            if (options.includeRelations) {
                query = query.withGraphFetched('[tasks, staff]');
            }

            if (options.orderBy) {
                query = query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
            } else {
                query = query.orderBy('start_date', 'asc');
            }

            const periods = await query;
            logger.info('Found active periods', { count: periods.length });
            
            return periods;
        } catch (error) {
            logger.error('Failed to find active periods', { error: error.message });
            throw error;
        }
    }

    /**
     * Find periods by year
     * @param {number} year - Year
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Array of periods
     */
    async findByYear(year, options = {}) {
        try {
            let query = this.model.query()
                .whereRaw('YEAR(start_date) = ? OR YEAR(end_date) = ?', [year, year]);

            if (options.includeRelations) {
                query = query.withGraphFetched('[tasks, staff]');
            }

            if (options.status) {
                query = query.where('status', options.status);
            }

            if (options.orderBy) {
                query = query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
            } else {
                query = query.orderBy('start_date', 'asc');
            }

            const periods = await query;
            logger.info('Found periods by year', { year, count: periods.length });
            
            return periods;
        } catch (error) {
            logger.error('Failed to find periods by year', { error: error.message, year });
            throw error;
        }
    }

    /**
     * Get periods statistics
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Periods statistics
     */
    async getStatistics(filters = {}) {
        try {
            let query = this.model.query();

            if (filters.year) {
                query = query.whereRaw('YEAR(start_date) = ? OR YEAR(end_date) = ?', [filters.year, filters.year]);
            }

            if (filters.status) {
                query = query.where('status', filters.status);
            }

            const [totalCount, activeCount, completedCount, draftCount] = await Promise.all([
                query.clone().count('* as count').first(),
                this.model.query().where('status', 'active').count('* as count').first(),
                this.model.query().where('status', 'completed').count('* as count').first(),
                this.model.query().where('status', 'draft').count('* as count').first()
            ]);

            const statistics = {
                total: parseInt(totalCount.count),
                active: parseInt(activeCount.count),
                completed: parseInt(completedCount.count),
                draft: parseInt(draftCount.count)
            };

            logger.info('Generated periods statistics', { statistics, filters });
            return statistics;
        } catch (error) {
            logger.error('Failed to get periods statistics', { error: error.message, filters });
            throw error;
        }
    }

    /**
     * Get paginated periods
     * @param {Object} options - Pagination and filter options
     * @returns {Promise<Object>} Paginated periods result
     */
    async getPaginated(options = {}) {
        try {
            const page = parseInt(options.page) || 1;
            const limit = parseInt(options.limit) || 10;
            const offset = (page - 1) * limit;

            let query = this.model.query();
            let countQuery = this.model.query();

            // Apply filters
            if (options.status) {
                query = query.where('status', options.status);
                countQuery = countQuery.where('status', options.status);
            }

            if (options.year) {
                const yearCondition = function() {
                    this.whereRaw('YEAR(start_date) = ?', [options.year])
                        .orWhereRaw('YEAR(end_date) = ?', [options.year]);
                };
                query = query.where(yearCondition);
                countQuery = countQuery.where(yearCondition);
            }

            if (options.search) {
                const searchCondition = function() {
                    this.where('name', 'like', `%${options.search}%`)
                        .orWhere('description', 'like', `%${options.search}%`);
                };
                query = query.where(searchCondition);
                countQuery = countQuery.where(searchCondition);
            }

            // Apply relations
            if (options.includeRelations) {
                query = query.withGraphFetched('[tasks, staff]');
            }

            // Apply ordering
            if (options.orderBy) {
                query = query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
            } else {
                query = query.orderBy('start_date', 'desc');
            }

            // Apply pagination
            query = query.limit(limit).offset(offset);

            // Execute queries
            const [periods, totalCount] = await Promise.all([
                query,
                countQuery.count('* as count').first()
            ]);

            const totalItems = parseInt(totalCount.count);
            const totalPages = Math.ceil(totalItems / limit);

            const result = {
                data: periods,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };

            logger.info('Generated paginated periods', { 
                page, 
                limit, 
                totalItems, 
                totalPages,
                filters: options 
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
    async updateStatus(id, status) {
        try {
            const validStatuses = ['draft', 'active', 'completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            }

            const period = await this.update(id, { status });
            
            logger.info('Updated period status', { id, status });
            return period;
        } catch (error) {
            logger.error('Failed to update period status', { error: error.message, id, status });
            throw error;
        }
    }

    /**
     * Find overlapping periods
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {string} excludeId - Period ID to exclude from check
     * @returns {Promise<Array>} Array of overlapping periods
     */
    async findOverlappingPeriods(startDate, endDate, excludeId = null) {
        try {
            let query = this.model.query()
                .where(function() {
                    this.whereBetween('start_date', [startDate, endDate])
                        .orWhereBetween('end_date', [startDate, endDate])
                        .orWhere(function() {
                            this.where('start_date', '<=', startDate)
                                .where('end_date', '>=', endDate);
                        });
                })
                .whereNot('status', 'cancelled');

            if (excludeId) {
                query = query.whereNot('id', excludeId);
            }

            const periods = await query;
            logger.info('Found overlapping periods', { startDate, endDate, excludeId, count: periods.length });
            
            return periods;
        } catch (error) {
            logger.error('Failed to find overlapping periods', { error: error.message, startDate, endDate, excludeId });
            throw error;
        }
    }

    /**
     * Bulk update period status
     * @param {Array<string>} periodIds - Array of period IDs
     * @param {string} status - New status
     * @returns {Promise<number>} Number of updated periods
     */
    async bulkUpdateStatus(periodIds, status) {
        try {
            const validStatuses = ['draft', 'active', 'completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            }

            const updatedCount = await this.model.query()
                .whereIn('id', periodIds)
                .patch({ status, updated_at: new Date() });

            logger.info('Bulk updated period status', { periodIds, status, updatedCount });
            return updatedCount;
        } catch (error) {
            logger.error('Failed to bulk update period status', { error: error.message, periodIds, status });
            throw error;
        }
    }
}

module.exports = PeriodeRepository;