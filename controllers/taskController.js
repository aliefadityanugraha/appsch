"use strict";

const TaskService = require('../services/TaskService');
const StaffService = require('../services/StaffService');
const ResponseFormatter = require('../utils/ResponseFormatter');
const Periode = require('../models/Periode');
const Records = require('../models/Records');
const { knex } = require('../config/database');

class TaskController {
    constructor() {
        this.taskService = new TaskService();
        this.staffService = new StaffService();
    }

    task = ResponseFormatter.asyncHandler(async (req, res) => {
        const staffId = req.params.id;

        const [staff, tasks, periodeData] = await Promise.all([
            this.staffService.getStaffById(staffId),
            this.taskService.getTasksByStaffId(staffId),
            Periode.query().orderBy('createdAt', 'asc')
        ]);

        return ResponseFormatter.renderView(req, res, "task", {
            layout: "layouts/main-layouts",
            title: staff.name,
            data: tasks,
            staff: [staff], // Keep array format for backward compatibility
            id: req.params.id,
            periodeData,
            req: req.path,
        });
    })

    addTask = ResponseFormatter.asyncHandler(async (req, res) => {
        const { description, value, id, periode } = req.body;

        const taskData = {
            description: description,
            value: parseInt(value),
            staffId: id,
            periodeId: periode,
            status: 'pending'
        };

        await this.taskService.createTask(taskData);
        
        return ResponseFormatter.redirectWithFlash(req, res, `/addTask/${id}`, 'Task berhasil ditambahkan', 'success');
    })

    updateTask = ResponseFormatter.asyncHandler(async (req, res) => {
        const { description, periode, value } = req.body;
        const taskId = req.params.id;
        
        const updateData = {
            description,
            value: parseFloat(value),
            periodeId: periode,
        };
        
        await this.taskService.updateTask(taskId, updateData);
            
        return ResponseFormatter.redirectWithFlash(req, res, `/addTask/${req.body.id}`, 'Task berhasil diperbarui', 'success');
    })

    deleteTask = ResponseFormatter.asyncHandler(async (req, res) => {
        const taskId = req.params.id;
        const staffId = req.params.staffId;

        await this.taskService.deleteTask(taskId);
        
        return ResponseFormatter.redirectWithFlash(req, res, `/addTask/${staffId}`, 'Task berhasil dihapus', 'success');
    })

    getTasksByStaffId = ResponseFormatter.asyncHandler(async (req, res) => {
        const staffId = req.params.id;
        const date = req.query.date;
        
        const options = {};
        
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            
            options.dateFrom = start;
            options.dateTo = end;
        }

        const tasks = await this.taskService.getTasksByStaffId(staffId, options);
        
        // Format response for API compatibility
        const formattedTasks = tasks.map(task => ({
            id: task.id,
            description: task.description,
            value: task.value,
            periodeId: task.periodeId
        }));
        
        return ResponseFormatter.sendSuccess(res, formattedTasks, 'Tasks retrieved successfully');
    })

    createRecord = ResponseFormatter.asyncHandler(async (req, res) => {
        const { value, staffId, taskIds } = req.body;
        
        const record = await Records.query().insert({
            value,
            staffId,
        });

        // Many-to-many handled by Objection relations in repositories elsewhere

        return ResponseFormatter.redirectWithFlash(req, res, `/addTask/${staffId}`, {
            success: 'Record berhasil dibuat'
        });
    })
}

// Create and export instance
const taskController = new TaskController();

module.exports = {
    task: taskController.task,
    addTask: taskController.addTask,
    updateTask: taskController.updateTask,
    deleteTask: taskController.deleteTask,
    getTasksByStaffId: taskController.getTasksByStaffId,
    createRecord: taskController.createRecord
};
