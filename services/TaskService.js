"use strict";

const TaskRepository = require('../repositories/TaskRepository');
const ValidationService = require('./ValidationService');
const { ValidationError, NotFoundError, DatabaseError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

class TaskService {
    constructor() {
        this.taskRepository = new TaskRepository();
    }

    /**
     * Get all tasks with optional filters
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Array of tasks
     */
    async getAllTasks(filters = {}) {
        try {
            logger.info('Getting all tasks', { filters });

            const options = {
                orderBy: { column: 'createdAt', direction: 'desc' }
            };

            if (filters.staffId) {
                ValidationService.validateUUID(filters.staffId, 'Staff ID');
                options.where = { ...options.where, staffId: filters.staffId };
            }

            if (filters.periodeid) {
                ValidationService.validateUUID(filters.periodeid, 'Periode ID');
                options.where = { ...options.where, periodeid: filters.periodeid };
            }

            if (filters.status) {
                ValidationService.validateTaskStatus(filters.status);
                options.where = { ...options.where, status: filters.status };
            }

            if (filters.limit) {
                options.limit = parseInt(filters.limit);
            }

            const tasks = await this.taskRepository.findWithRelations(options);

            logger.info('Successfully retrieved tasks', { count: tasks.length });
            return tasks;
        } catch (error) {
            logger.error('Failed to get all tasks', { error: error.message, filters });
            throw error;
        }
    }

    /**
     * Get task by ID
     * @param {string} id - Task ID
     * @returns {Promise<Object>} Task object
     */
    async getTaskById(id) {
        try {
            ValidationService.validateUUID(id, 'Task ID');

            logger.info('Getting task by ID', { id });

            const task = await this.taskRepository.findById(id);

            if (!task) {
                throw new NotFoundError('Task not found');
            }

            // Get task with relations
            const taskWithRelations = await this.taskRepository.findWithRelations({
                where: { id }
            });

            logger.info('Successfully retrieved task', { id });
            return taskWithRelations[0];
        } catch (error) {
            logger.error('Failed to get task by ID', { error: error.message, id });
            throw error;
        }
    }

    /**
     * Create new task
     * @param {Object} taskData - Task data
     * @returns {Promise<Object>} Created task
     */
    async createTask(taskData) {
        try {
            logger.info('Creating new task', { taskData: { ...taskData, description: '[REDACTED]' } });

            // Validate task data
            ValidationService.validateTaskData(taskData);

            // Validate foreign keys
            ValidationService.validateUUID(taskData.staffId, 'Staff ID');
            ValidationService.validateUUID(taskData.periodeid, 'Periode ID');

            // Set default status if not provided
            if (!taskData.status) {
                taskData.status = 'pending';
            }

            // Validate status
            ValidationService.validateTaskStatus(taskData.status);

            // Create task
            const task = await this.taskRepository.create(taskData);

            // Get created task with relations
            const createdTask = await this.getTaskById(task.id);

            logger.info('Successfully created task', { id: task.id });
            return createdTask;
        } catch (error) {
            logger.error('Failed to create task', { error: error.message, taskData: { ...taskData, description: '[REDACTED]' } });

            if (error.code === '23503') { // Foreign key constraint
                throw new ValidationError('Invalid staff ID or periode ID');
            }

            throw error;
        }
    }

    /**
     * Update task
     * @param {string} id - Task ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated task
     */
    async updateTask(id, updateData) {
        try {
            ValidationService.validateUUID(id, 'Task ID');

            logger.info('Updating task', { id, updateData: { ...updateData, description: '[REDACTED]' } });

            // Check if task exists
            const existingTask = await this.taskRepository.findById(id);
            if (!existingTask) {
                throw new NotFoundError('Task not found');
            }

            // Validate update data
            if (updateData.name !== undefined) {
                ValidationService.validateString(updateData.name, 'Task name', 1, 255);
            }

            if (updateData.description !== undefined) {
                ValidationService.validateString(updateData.description, 'Description', 0, 1000);
            }

            if (updateData.staffId !== undefined) {
                ValidationService.validateUUID(updateData.staffId, 'Staff ID');
            }

            if (updateData.periodeid !== undefined) {
                ValidationService.validateUUID(updateData.periodeid, 'Periode ID');
            }

            if (updateData.status !== undefined) {
                ValidationService.validateTaskStatus(updateData.status);
            }

            if (updateData.due_date !== undefined) {
                ValidationService.validateDate(updateData.due_date, 'Due date');
            }

            // Update task
            const updatedTask = await this.taskRepository.update(id, updateData);

            // Get updated task with relations
            const taskWithRelations = await this.getTaskById(id);

            logger.info('Successfully updated task', { id });
            return taskWithRelations;
        } catch (error) {
            logger.error('Failed to update task', { error: error.message, id, updateData: { ...updateData, description: '[REDACTED]' } });

            if (error.code === '23503') { // Foreign key constraint
                throw new ValidationError('Invalid staff ID or periode ID');
            }

            throw error;
        }
    }

    /**
     * Delete task
     * @param {string} id - Task ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteTask(id) {
        try {
            ValidationService.validateUUID(id, 'Task ID');

            logger.info('Deleting task', { id });

            // Check if task exists
            const existingTask = await this.taskRepository.findById(id);
            if (!existingTask) {
                throw new NotFoundError('Task not found');
            }

            // Delete task
            const deleted = await this.taskRepository.delete(id);

            if (!deleted) {
                throw new DatabaseError('Failed to delete task');
            }

            logger.info('Successfully deleted task', { id });
            return true;
        } catch (error) {
            logger.error('Failed to delete task', { error: error.message, id });
            throw error;
        }
    }

    /**
     * Get tasks by staff ID
     * @param {string} staffId - Staff ID
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Array of tasks
     */
    async getTasksByStaffId(staffId, options = {}) {
        try {
            ValidationService.validateUUID(staffId, 'Staff ID');

            logger.info('Getting tasks by staff ID', { staffId, options });

            const tasks = await this.taskRepository.findByStaffId(staffId, options);

            logger.info('Successfully retrieved tasks by staff ID', { staffId, count: tasks.length });
            return tasks;
        } catch (error) {
            logger.error('Failed to get tasks by staff ID', { error: error.message, staffId, options });
            throw error;
        }
    }

    /**
     * Get tasks by periode ID
     * @param {string} periodeId - Periode ID
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Array of tasks
     */
    async getTasksByPeriodeId(periodeid, options = {}) {
        try {
            ValidationService.validateUUID(periodeid, 'Periode ID');

            logger.info('Getting tasks by periode ID', { periodeid, options });

            const tasks = await this.taskRepository.findByPeriodeId(periodeid, options);

            logger.info('Successfully retrieved tasks by periode ID', { periodeid, count: tasks.length });
            return tasks;
        } catch (error) {
            logger.error('Failed to get tasks by periode ID', { error: error.message, periodeid, options });
            throw error;
        }
    }

    /**
     * Search tasks
     * @param {string} searchTerm - Search term
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Array of matching tasks
     */
    async searchTasks(searchTerm, options = {}) {
        try {
            ValidationService.validateString(searchTerm, 'Search term', 1, 100);

            logger.info('Searching tasks', { searchTerm, options });

            const tasks = await this.taskRepository.search(searchTerm, options);

            logger.info('Successfully searched tasks', { searchTerm, count: tasks.length });
            return tasks;
        } catch (error) {
            logger.error('Failed to search tasks', { error: error.message, searchTerm, options });
            throw error;
        }
    }

    /**
     * Get task statistics
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Task statistics
     */
    async getTaskStatistics(filters = {}) {
        try {
            logger.info('Getting task statistics', { filters });

            // Validate filters
            if (filters.staffId) {
                ValidationService.validateUUID(filters.staffId, 'Staff ID');
            }

            if (filters.periodeid) {
                ValidationService.validateUUID(filters.periodeid, 'Periode ID');
            }

            if (filters.dateFrom) {
                ValidationService.validateDate(filters.dateFrom, 'Date from');
            }

            if (filters.dateTo) {
                ValidationService.validateDate(filters.dateTo, 'Date to');
            }

            const statistics = await this.taskRepository.getStatistics(filters);

            logger.info('Successfully retrieved task statistics', { statistics });
            return statistics;
        } catch (error) {
            logger.error('Failed to get task statistics', { error: error.message, filters });
            throw error;
        }
    }

    /**
     * Get paginated tasks
     * @param {Object} options - Pagination and filter options
     * @returns {Promise<Object>} Paginated tasks
     */
    async getPaginatedTasks(options = {}) {
        try {
            logger.info('Getting paginated tasks', { options });

            // Validate pagination parameters
            ValidationService.validatePaginationParams(options.page, options.limit);

            // Validate filters
            if (options.staffId) {
                ValidationService.validateUUID(options.staffId, 'Staff ID');
            }

            if (options.periodeid) {
                ValidationService.validateUUID(options.periodeid, 'Periode ID');
            }

            if (options.status) {
                ValidationService.validateTaskStatus(options.status);
            }

            if (options.search) {
                ValidationService.validateString(options.search, 'Search term', 1, 100);
            }

            const result = await this.taskRepository.getPaginated(options);

            logger.info('Successfully retrieved paginated tasks', {
                page: result.page,
                totalPages: result.totalPages,
                totalItems: result.totalItems
            });

            return result;
        } catch (error) {
            logger.error('Failed to get paginated tasks', { error: error.message, options });
            throw error;
        }
    }

    /**
     * Update task status
     * @param {string} id - Task ID
     * @param {string} status - New status
     * @param {string} updatedBy - User ID who updated
     * @returns {Promise<Object>} Updated task
     */
    async updateTaskStatus(id, status, updatedBy) {
        try {
            ValidationService.validateUUID(id, 'Task ID');
            ValidationService.validateTaskStatus(status);

            if (updatedBy) {
                ValidationService.validateUUID(updatedBy, 'Updated by user ID');
            }

            logger.info('Updating task status', { id, status, updatedBy });

            const updatedTask = await this.taskRepository.updateStatus(id, status, updatedBy);

            // Get updated task with relations
            const taskWithRelations = await this.getTaskById(id);

            logger.info('Successfully updated task status', { id, status });
            return taskWithRelations;
        } catch (error) {
            logger.error('Failed to update task status', { error: error.message, id, status, updatedBy });
            throw error;
        }
    }

    /**
     * Get tasks due soon
     * @param {number} days - Number of days to look ahead
     * @returns {Promise<Array>} Tasks due soon
     */
    async getTasksDueSoon(days = 7) {
        try {
            if (days < 1 || days > 365) {
                throw new ValidationError('Days must be between 1 and 365');
            }

            logger.info('Getting tasks due soon', { days });

            const tasks = await this.taskRepository.getTasksDueSoon(days);

            logger.info('Successfully retrieved tasks due soon', { days, count: tasks.length });
            return tasks;
        } catch (error) {
            logger.error('Failed to get tasks due soon', { error: error.message, days });
            throw error;
        }
    }

    /**
     * Get overdue tasks
     * @returns {Promise<Array>} Overdue tasks
     */
    async getOverdueTasks() {
        try {
            logger.info('Getting overdue tasks');

            const tasks = await this.taskRepository.getOverdueTasks();

            logger.info('Successfully retrieved overdue tasks', { count: tasks.length });
            return tasks;
        } catch (error) {
            logger.error('Failed to get overdue tasks', { error: error.message });
            throw error;
        }
    }

    /**
     * Get tasks by IDs
     * @param {Array<string>} taskIds - Array of task IDs
     * @returns {Promise<Array>} Array of tasks
     */
    async getTasksByIds(taskIds) {
        try {
            if (!Array.isArray(taskIds) || taskIds.length === 0) {
                throw new ValidationError('Task IDs array is required');
            }

            // Validate all task IDs
            taskIds.forEach(id => ValidationService.validateUUID(id, 'Task ID'));

            logger.info('Getting tasks by IDs', { taskIds });

            const tasks = await this.taskRepository.model.query()
                .whereIn('id', taskIds)
                .withGraphFetched('[staff, periode]');

            logger.info('Successfully retrieved tasks by IDs', { taskIds, count: tasks.length });
            return tasks;
        } catch (error) {
            logger.error('Failed to get tasks by IDs', { error: error.message, taskIds });
            throw error;
        }
    }

    /**
     * Bulk update task status
     * @param {Array<string>} taskIds - Array of task IDs
     * @param {string} status - New status
     * @param {string} updatedBy - User ID who updated
     * @returns {Promise<number>} Number of updated tasks
     */
    async bulkUpdateTaskStatus(taskIds, status, updatedBy) {
        try {
            if (!Array.isArray(taskIds) || taskIds.length === 0) {
                throw new ValidationError('Task IDs array is required');
            }

            // Validate all task IDs
            taskIds.forEach(id => ValidationService.validateUUID(id, 'Task ID'));

            ValidationService.validateTaskStatus(status);

            if (updatedBy) {
                ValidationService.validateUUID(updatedBy, 'Updated by user ID');
            }

            logger.info('Bulk updating task status', { taskIds, status, updatedBy });

            const updatedCount = await this.taskRepository.bulkUpdateStatus(taskIds, status, updatedBy);

            logger.info('Successfully bulk updated task status', { taskIds, status, updatedCount });
            return updatedCount;
        } catch (error) {
            logger.error('Failed to bulk update task status', { error: error.message, taskIds, status, updatedBy });
            throw error;
        }
    }
}

module.exports = TaskService;