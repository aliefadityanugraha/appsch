const TaskService = require('../services/TaskService');
const StaffService = require('../services/StaffService');
const ResponseFormatter = require('../utils/ResponseFormatter');
const Periode = require('../models/Periode');

class TaskController {
    constructor() {
        this.taskService = new TaskService();
        this.staffService = new StaffService();
    }

    // Helper: Set date range for query
    getDateRange(date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return { dateFrom: start, dateTo: end };
    }

    task = ResponseFormatter.asyncHandler(async (req, res) => {
        const [staff, tasks, periodeData] = await Promise.all([
            this.staffService.getStaffById(req.params.id),
            this.taskService.getTasksByStaffId(req.params.id),
            Periode.query().orderBy('createdAt', 'asc')
        ]);

        return ResponseFormatter.renderView(req, res, "task", {
            layout: "layouts/main-layouts",
            title: staff.name,
            data: tasks,
            staff: [staff],
            id: req.params.id,
            periodeData,
            req: req.path,
        });
    })

    addTask = ResponseFormatter.asyncHandler(async (req, res) => {
        const { description, value, id, periode } = req.body;

        await this.taskService.createTask({
            description,
            value: parseInt(value),
            staffId: id,
            periodeid: periode,
            status: 'pending'
        });

        return ResponseFormatter.redirectWithFlash(req, res, `/addTask/${id}`, 'Task berhasil ditambahkan', 'success');
    })

    updateTask = ResponseFormatter.asyncHandler(async (req, res) => {
        const { description, periode, value, id } = req.body;

        await this.taskService.updateTask(req.params.id, {
            description,
            value: parseFloat(value),
            periodeid: periode,
        });

        return ResponseFormatter.redirectWithFlash(req, res, `/addTask/${id}`, 'Task berhasil diperbarui', 'success');
    })

    deleteTask = ResponseFormatter.asyncHandler(async (req, res) => {
        await this.taskService.deleteTask(req.params.id);
        return ResponseFormatter.redirectWithFlash(req, res, `/addTask/${req.params.staffId}`, 'Task berhasil dihapus', 'success');
    })

    getTasksByStaffId = ResponseFormatter.asyncHandler(async (req, res) => {
        const options = req.query.date ? this.getDateRange(req.query.date) : {};
        const tasks = await this.taskService.getTasksByStaffId(req.params.id, options);

        const formattedTasks = tasks.map(({ id, description, value, periodeid }) => ({
            id, description, value, periodeid
        }));

        return ResponseFormatter.sendSuccess(res, formattedTasks, 'Tasks retrieved successfully');
    })
}

module.exports = new TaskController();
