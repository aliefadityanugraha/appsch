"use strict";

const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();
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
        // Total Money: jumlah nilai di records
        const totalMoney = await prisma.records.aggregate({ _sum: { value: true } });

        // Total Users
        const totalUsers = await prisma.user.count();

        // New Clients: staff yang dibuat bulan ini
        const awalBulan = startOfMonth(new Date());
        const newClients = await prisma.staff.count({
            where: { createdAt: { gte: awalBulan } }
        });

        // Total Sales: jumlah task
        const totalSales = await prisma.task.count();

        // Data chart: records per bulan (6 bulan terakhir)
        const records = await prisma.records.findMany({
            select: {
                createdAt: true,
                value: true
            }
        });

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
            totalMoney: totalMoney._sum.value || 0,
            totalUsers,
            newClients,
            totalSales,
            salesChartLabels,
            salesChartData
        });
    },
};
