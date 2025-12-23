const Records = require('../models/Records');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Task = require('../models/Task');
const { startOfMonth } = require('date-fns');
const cache = require('../config/cache');

class MainController {
    constructor() {
        // Inject dependencies for better testability
        this.Records = Records;
        this.User = User;
        this.Staff = Staff;
        this.Task = Task;
        this.cache = cache;
        this.cacheKey = 'dashboard_stats';
        this.cacheTTL = 300; // 5 minutes
    }

    // Helper: Process chart data from records
    processChartData(records) {
        const monthMap = {};
        
        records.forEach(record => {
            const created = typeof record.createdAt === 'string' 
                ? new Date(record.createdAt) 
                : record.createdAt;
            
            const month = created.toLocaleString('default', { 
                month: 'short', 
                year: '2-digit' 
            });
            
            monthMap[month] = (monthMap[month] || 0) + Number(record.value);
        });

        return {
            labels: Object.keys(monthMap),
            data: Object.values(monthMap)
        };
    }

    // Helper: Fetch dashboard statistics from database
    async fetchDashboardStats() {
        const awalBulan = startOfMonth(new Date());
        
        // Parallel query execution for better performance
        const [
            totalMoneyResult, 
            totalUsersResult, 
            newStaffResult, 
            totalTasksResult, 
            totalStaffResult, 
            records,
            recentStaff,
            recentTasks
        ] = await Promise.all([
            this.Records.query().sum('value as total').first(),
            this.User.query().count('* as count').first(),
            this.Staff.query().where('createdAt', '>=', awalBulan).count('* as count').first(),
            this.Task.query().count('* as count').first(),
            this.Staff.query().count('* as count').first(),
            this.Records.query().select('createdAt', 'value'),
            this.Staff.query().orderBy('createdAt', 'desc').limit(3),
            this.Task.query().orderBy('createdAt', 'desc').limit(3)
        ]);

        // Process chart data
        const chartData = this.processChartData(records);

        return {
            totalMoney: totalMoneyResult.total || 0,
            totalUsers: parseInt(totalUsersResult.count) || 0,
            newStaff: parseInt(newStaffResult.count) || 0,
            totalTasks: parseInt(totalTasksResult.count) || 0,
            totalStaff: parseInt(totalStaffResult.count) || 0,
            chartLabels: chartData.labels,
            chartData: chartData.data,
            recentStaff: recentStaff || [],
            recentTasks: recentTasks || []
        };
    }

    // Helper: Get dashboard data with caching
    async getDashboardData() {
        let dashboardData = this.cache.get(this.cacheKey);

        if (!dashboardData) {
            dashboardData = await this.fetchDashboardStats();
            this.cache.set(this.cacheKey, dashboardData, this.cacheTTL);
        }

        return dashboardData;
    }

    // Route handler: Main page
    main = async (req, res) => {
        res.render("main", {
            layout: "layouts/main-layouts",
            title: "Home",
            req: req.path,
        });
    }

    // Route handler: Dashboard with statistics
    dashboard = async (req, res) => {
        try {
            const dashboardData = await this.getDashboardData();

            res.render('main', {
                layout: "layouts/main-layouts",
                title: "Home",
                req: req.path,
                ...dashboardData
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Helper: Clear dashboard cache (useful for testing or manual refresh)
    clearCache() {
        this.cache.delete(this.cacheKey);
    }
}

module.exports = new MainController(); 