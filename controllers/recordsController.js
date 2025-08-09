"use strict";

const RecordsService = require('../services/RecordsService');
const TaskService = require('../services/TaskService');
const ResponseFormatter = require('../utils/ResponseFormatter');


    records = ResponseFormatter.asyncHandler(async (req, res) => {
        // Calculate current month date range
        const thisDate = new Date();
        const startDate = new Date(`${thisDate.getFullYear()}-${thisDate.getMonth() + 1}-01`);
        const endDate = new Date(`${thisDate.getFullYear()}-${thisDate.getMonth() + 1}-31`);
        
        // Get records for current month with relations
        const records = await this.recordsService.getRecordsByDateRange(startDate, endDate, {
            includeRelations: true,
            orderBy: { column: 'createdAt', direction: 'asc' }
        });
        
        return ResponseFormatter.renderView(req, res, 'export', {
            layout: 'layouts/main-layouts',
            title: 'Data',
            req: req.path,
            records: records
        });
    })

    addRecords = ResponseFormatter.asyncHandler(async (req, res) => {
        // Debug: Log incoming request data
        console.log('=== DEBUG addRecords Endpoint ===');
        console.log('Request params:', req.params);
        console.log('Request body:', req.body);
        console.log('Staff ID from params:', req.params.id);
        
        let taskIds = req.body.taskIds || [];
        console.log('Original taskIds:', taskIds, 'Type:', typeof taskIds);
        
        if (typeof taskIds === "string") {
            taskIds = [taskIds];
        }
        console.log('Processed taskIds:', taskIds);
        
        // Calculate total value from selected tasks
        let totalTaskValue = 0;
        if (taskIds.length > 0) {
            const tasks = await this.taskService.getTasksByIds(taskIds);
            console.log('Retrieved tasks:', tasks);
            totalTaskValue = tasks.reduce((sum, task) => sum + (task.value || 0), 0);
            console.log('Total task value calculated:', totalTaskValue);
        }
        
        // Prepare record data
        const recordData = {
            staffId: req.params.id,
            value: totalTaskValue
        };
        
        // Set custom date if provided
        if (req.body.date) {
            recordData.createdAt = req.body.date + ' 00:00:00';
            console.log('Custom date set:', recordData.createdAt);
        }
        
        console.log('Final recordData:', recordData);
        console.log('TaskIds to associate:', taskIds);
        
        // Create record with associated tasks
        try {
            const result = await this.recordsService.createRecord(recordData, taskIds);
            console.log('Record created successfully:', result);
        } catch (error) {
            console.log('Error creating record:', error.message);
            console.log('Error details:', error);
            throw error;
        }
        
        console.log('=== END DEBUG addRecords ===');
        return ResponseFormatter.redirectWithFlash(req, res, '/staff', 'Record berhasil ditambahkan', 'success');
    })

    filterRecords = ResponseFormatter.asyncHandler(async (req, res) => {
        const startDate = new Date(req.body.gte);
        const endDate = new Date(req.body.lte);
        
        // Get filtered records with relations
        const records = await this.recordsService.getRecordsByDateRange(startDate, endDate, {
            includeRelations: true,
            orderBy: { column: 'createdAt', direction: 'asc' }
        });
        
        return ResponseFormatter.renderView(req, res, 'export', {
            layout: 'layouts/main-layouts',
            title: 'Data Filtered',
            req: req.path,
            records: records
        });
    })

    getRecordsByStaffAndDate = ResponseFormatter.asyncHandler(async (req, res) => {
        const staffId = req.params.staffId;
        const date = req.query.date;
        
        let options = { includeRelations: true };
        
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            
            options.dateFrom = start;
            options.dateTo = end;
        }
        
        const records = await this.recordsService.getRecordsByStaffId(staffId, options);
        
        let recordId = null;
        let tasks = [];
        if (records.length > 0) {
            recordId = records[0].id;
            tasks = records[0].tasks || [];
        }
        return ResponseFormatter.sendSuccess(res, { recordId, tasks });
    })

    updateRecord = ResponseFormatter.asyncHandler(async (req, res) => {
        const recordId = req.params.id;
        let taskIds = req.body.taskIds;
        
        if (typeof taskIds === "string") {
            taskIds = [taskIds];
        }
        if (!Array.isArray(taskIds)) {
            taskIds = [];
        }
        
        // Calculate total value from selected tasks
        let totalTaskValue = 0;
        if (taskIds.length > 0) {
            const tasks = await this.taskService.getTasksByIds(taskIds);
            totalTaskValue = tasks.reduce((sum, task) => sum + (task.value || 0), 0);
        }
        
        // Update record with new value and tasks
        const updateData = { value: totalTaskValue };
        await this.recordsService.updateRecord(recordId, updateData, taskIds);
        
        return ResponseFormatter.sendSuccess(res, { success: true }, 'Record berhasil diperbarui');
     })
}

module.exports = new RecordsController();
