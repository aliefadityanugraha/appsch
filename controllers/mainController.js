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
            const totalMoneyResult = await Records.query()
                .sum('value as total')
                .first();
            const totalMoney = totalMoneyResult.total || 0;

            const totalUsers = await User.query().resultSize();

            const awalBulan = startOfMonth(new Date());
            const newClients = await Staff.query()
                .where('createdAt', '>=', awalBulan)
                .resultSize();

            const totalSales = await Task.query().resultSize();

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