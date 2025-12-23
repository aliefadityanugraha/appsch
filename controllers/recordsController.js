const RecordsService = require('../services/RecordsService');
const TaskService = require('../services/TaskService');
const ResponseFormatter = require('../utils/ResponseFormatter');

class RecordsController {
    constructor() {
        this.recordsService = new RecordsService();
        this.taskService = new TaskService();
    }

    // Helper: Get current month date range
    getCurrentMonthRange() {
        const now = new Date();
        return {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        };
    }

    // Helper: Normalize taskIds to array
    normalizeTaskIds(taskIds) {
        if (!taskIds) return [];
        return Array.isArray(taskIds) ? taskIds : [taskIds];
    }

    // Helper: Calculate total value and validate tasks
    async validateAndCalculateTaskValue(taskIds, staffId) {
        if (!taskIds.length) return 0;

        const tasks = await this.taskService.getTasksByIds(taskIds);
        const invalidTasks = tasks.filter(t => t.staffId !== staffId);
        
        if (invalidTasks.length > 0) {
            throw new Error('INVALID_TASKS');
        }

        return tasks.reduce((sum, task) => sum + (task.value || 0), 0);
    }

    // Helper: Format date to MySQL datetime
    formatDate(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    records = ResponseFormatter.asyncHandler(async (req, res) => {
        const { start, end } = this.getCurrentMonthRange();
        const records = await this.recordsService.getRecordsByDateRange(start, end, {
            includeRelations: true,
            orderBy: { column: 'createdAt', direction: 'asc' }
        });

        return ResponseFormatter.renderView(req, res, 'export', {
            layout: 'layouts/main-layouts',
            title: 'Data',
            req: req.path,
            records
        });
    })

    addRecords = ResponseFormatter.asyncHandler(async (req, res) => {
        const taskIds = this.normalizeTaskIds(req.body.taskIds);
        
        try {
            const totalValue = await this.validateAndCalculateTaskValue(taskIds, req.params.id);
            
            const recordData = {
                staffId: req.params.id,
                value: totalValue,
                ...(req.body.date && { createdAt: req.body.date + ' 00:00:00' })
            };

            await this.recordsService.createRecord(recordData, taskIds);
            return ResponseFormatter.redirectWithFlash(req, res, '/staff', 'Record berhasil ditambahkan', 'success');
        } catch (error) {
            if (error.message === 'INVALID_TASKS') {
                return ResponseFormatter.redirectWithFlash(req, res, '/staff', 'Beberapa tugas tidak valid', 'danger');
            }
            throw error;
        }
    })

    filterRecords = ResponseFormatter.asyncHandler(async (req, res) => {
        const records = await this.recordsService.getRecordsByDateRange(
            new Date(req.body.gte),
            new Date(req.body.lte),
            { includeRelations: true, orderBy: { column: 'createdAt', direction: 'asc' } }
        );

        return ResponseFormatter.renderView(req, res, 'export', {
            layout: 'layouts/main-layouts',
            title: 'Data Filtered',
            req: req.path,
            records
        });
    })

    getRecordsByStaffAndDate = ResponseFormatter.asyncHandler(async (req, res) => {
        const options = { includeRelations: true };

        if (req.query.date) {
            const formatted = this.formatDate(req.query.date);
            options.dateFrom = `${formatted} 00:00:00`;
            options.dateTo = `${formatted} 23:59:59`;
        }

        const records = await this.recordsService.getRecordsByStaffId(req.params.staffId, options);
        const result = records.length > 0 
            ? { recordId: records[0].id, tasks: records[0].tasks || [] }
            : { recordId: null, tasks: [] };

        return ResponseFormatter.sendSuccess(res, result);
    })

    updateRecord = ResponseFormatter.asyncHandler(async (req, res) => {
        const taskIds = this.normalizeTaskIds(req.body.taskIds);
        const record = await this.recordsService.getRecordById(req.params.id);

        if (!record) {
            return ResponseFormatter.sendError(res, 'Record tidak ditemukan', 404);
        }

        try {
            const totalValue = await this.validateAndCalculateTaskValue(taskIds, record.staffId);
            await this.recordsService.updateRecord(req.params.id, { value: totalValue }, taskIds);
            return ResponseFormatter.sendSuccess(res, { success: true }, 'Record berhasil diperbarui');
        } catch (error) {
            if (error.message === 'INVALID_TASKS') {
                return ResponseFormatter.sendError(res, 'Beberapa tugas tidak valid', 400);
            }
            throw error;
        }
    })
}

module.exports = new RecordsController();
