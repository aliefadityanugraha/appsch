"use strict";

const Records = require('../models/Records');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Task = require('../models/Task');
const { startOfMonth } = require('date-fns');

module.exports = {
    main: async (req, res) => {
        res.status(200).render("main", {
            layout: "layouts/main-layouts",
            title: "Home",
            req: req.path,
        });
    },

    dashboard: async (req, res) => {
        try {
            // Total Money: jumlah nilai di records
            // Equivalent to prisma.records.aggregate({ _sum: { value: true } })
            const totalMoneyResult = await Records.query()
                .sum('value as total')
                .first();
            const totalMoney = totalMoneyResult.total || 0;

            // Total Users
            // Equivalent to prisma.user.count()
            const totalUsers = await User.query().resultSize();

            // New Clients: staff yang dibuat bulan ini
            // Equivalent to prisma.staff.count({where: { createdAt: { gte: awalBulan } }})
            const awalBulan = startOfMonth(new Date());
            const newClients = await Staff.query()
                .where('createdAt', '>=', awalBulan)
                .resultSize();

            // Total Sales: jumlah task
            // Equivalent to prisma.task.count()
            const totalSales = await Task.query().resultSize();

            // Data chart: records per bulan (6 bulan terakhir)
            // Equivalent to prisma.records.findMany({select: {createdAt: true, value: true}})
            const records = await Records.query()
                .select('createdAt', 'value');

            // Proses data chart
            const monthMap = {};
            records.forEach(r => {
                const month = r.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
                if (!monthMap[month]) monthMap[month] = 0;
                monthMap[month] += Number(r.value);
            });
            const salesChartLabels = Object.keys(monthMap);
            const salesChartData = Object.values(monthMap);

            res.render('main', {
                layout: "layouts/main-layouts",
                title: "Home",
                req: req.path,
                totalMoney,
                totalUsers,
                newClients,
                totalSales,
                salesChartLabels,
                salesChartData
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}; 