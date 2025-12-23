const Staff = require('../models/Staff');
const Records = require('../models/Records');

class ApiController {
    constructor() {
        // Inject dependencies for better testability
        this.Staff = Staff;
        this.Records = Records;
    }

    // Helper: Handle API errors consistently
    handleError(res, error, message = 'Internal server error') {
        console.error(`API Error: ${message}`, error);
        
        const statusCode = error.statusCode || 500;
        const response = {
            success: false,
            error: message
        };

        // Include error details in development
        if (process.env.NODE_ENV === 'development') {
            response.details = error.message;
            response.stack = error.stack;
        }

        res.status(statusCode).json(response);
    }

    // Helper: Send success response
    sendSuccess(res, data, message = 'Success') {
        res.json({
            success: true,
            message,
            data
        });
    }

    // Route handler: Test API endpoint - Get all staff with tasks
    apiTest = async (req, res) => {
        try {
            const data = await this.Staff.query()
                .withGraphFetched('task.periode')
                .orderBy('createdAt', 'asc');
                
            this.sendSuccess(res, data, 'Staff data retrieved successfully');
        } catch (error) {
            this.handleError(res, error, 'Error fetching staff data');
        }
    }

    // Route handler: Add records (echo endpoint)
    addRecords = (req, res) => {
        try {
            // Echo back the request body
            this.sendSuccess(res, req.body, 'Data received');
        } catch (error) {
            this.handleError(res, error, 'Error processing request');
        }
    }

    // Route handler: Get all records with relations
    records = async (req, res) => {
        try {
            const data = await this.Records.query()
                .withGraphFetched('[staff, tasks]')
                .orderBy('createdAt', 'desc');
                
            this.sendSuccess(res, data, 'Records retrieved successfully');
        } catch (error) {
            this.handleError(res, error, 'Error fetching records');
        }
    }

    // Helper: Get staff by ID (for future use)
    async getStaffById(id) {
        return await this.Staff.query()
            .findById(id)
            .withGraphFetched('task.periode');
    }

    // Helper: Get records by date range (for future use)
    async getRecordsByDateRange(startDate, endDate) {
        return await this.Records.query()
            .whereBetween('createdAt', [startDate, endDate])
            .withGraphFetched('[staff, tasks]')
            .orderBy('createdAt', 'desc');
    }
}

module.exports = new ApiController(); 