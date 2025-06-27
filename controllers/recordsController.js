"use strict";

const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {

    records: async (req, res) => {

        const thisDate = new Date();

        const records = await prisma.records.findMany({

            where: {
                createdAt: {
                    gte: new Date(`${thisDate.getFullYear()}-${thisDate.getMonth() + 1}-01`),
                    lte: new Date(`${thisDate.getFullYear()}-${thisDate.getMonth() + 1}-31`),
                },
            },
            include: {
                staff: {
                    select: {
                        name: true,
                        tunjangan: true,
                        jabatan: true
                    }
                },
                tasks: true
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        res.status(200).render("export", {
            layout: "layouts/main-layouts",
            title: "Data",
            req: req.path,
            records: records,
        });

    },

    addRecords: async (req, res) => {
        try {
            let taskIds = req.body["taskIds"] || [];
            if (typeof taskIds === "string") {
                taskIds = [taskIds];
            }

            const tasks = await prisma.task.findMany({ where: { id: { in: taskIds } } });
            const totalTaskValue = tasks.reduce((sum, task) => sum + (task.value || 0), 0);
            let createdAt = new Date();
            if (req.body.date) {
                createdAt = new Date(req.body.date);
                createdAt.setHours(0,0,0,0);
            }
            await prisma.records.create({
                data: {
                    staffId: req.params.id,
                    value: totalTaskValue,
                    createdAt: createdAt,
                    tasks: {
                        connect: taskIds.map(id => ({ id }))
                    }
                },
            });
            res.status(200).redirect("/staff");
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    filterRecords: async (req, res) => {

        const records = await prisma.records.findMany({
            where: {
                createdAt: {
                    gte: new Date(req.body.gte),
                    lte: new Date(req.body.lte),
                },
            },
            include: {
                staff: {
                    select: {
                        name: true,
                        tunjangan: true,
                        jabatan: true
                    }
                },
                tasks: true
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        res.status(200).render("export", {
            layout: "layouts/main-layouts",
            title: "Data Filtered",
            req: req.path,
            records: records,
        });

    },

    getRecordsByStaffAndDate: async (req, res) => {
        const staffId = req.params.staffId;
        const date = req.query.date;
        let whereClause = { staffId };
        if (date) {
            const start = new Date(date);
            start.setHours(0,0,0,0);
            const end = new Date(date);
            end.setHours(23,59,59,999);
            whereClause.createdAt = {
                gte: start,
                lte: end
            };
        }
        const records = await prisma.records.findMany({
            where: whereClause,
            include: { tasks: true }
        });
        let recordId = null;
        let tasks = [];
        if (records.length > 0) {
            recordId = records[0].id;
            tasks = records[0].tasks || [];
        }
        res.json({ recordId, tasks });
    },

    updateRecord: async (req, res) => {
        try {
            const recordId = req.params.id;
            let taskIds = req.body.taskIds;
            if (typeof taskIds === "string") {
                taskIds = [taskIds];
            }
            if (!Array.isArray(taskIds)) {
                taskIds = [];
            }

            const tasks = await prisma.task.findMany({ where: { id: { in: taskIds } } });
            const totalTaskValue = tasks.reduce((sum, task) => sum + (task.value || 0), 0);

            await prisma.records.update({
                where: { id: recordId },
                data: {
                    value: totalTaskValue,
                    updatedAt: new Date(),
                    tasks: {
                        set: taskIds.map(id => ({ id }))
                    }
                },
            });
            res.status(200).json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
