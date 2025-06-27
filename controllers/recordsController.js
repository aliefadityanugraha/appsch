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
                }
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
            let data = req.body["task"] || [];
            if (typeof data === "string") {
                data = [data];
            }

            console.log('data:', data, 'typeof:', typeof data, 'isArray:', Array.isArray(data));

            const taskList = [];
            data.forEach(taskStr => {
                const parts = taskStr.split(','); // Memisahkan string menjadi maksimal 3 bagian: id, nilai, deskripsi
                const taskObject = {
                    taskId: parts[0],
                    taskValue: parseInt(parts[1]), // Mengubah nilai menjadi integer
                    deskripsi: parts[2],
                    checked: true
                };
                console.log(parts)
                taskList.push(taskObject);
            });

            // Hitung total nilai hanya dari task yang tercentang
            const totalTaskValue = taskList
                .filter(task => task.checked)
                .reduce((sum, task) => sum + (task.taskValue || 0), 0);
                
            let createdAt = new Date();
            if (req.body.date) {
                createdAt = new Date(req.body.date);
                createdAt.setHours(0,0,0,0);
            }
            await prisma.records.create({
                data: {
                    staffId: req.params.id,
                    value: totalTaskValue,
                    taskList: taskList,
                    createdAt: createdAt,
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
                }
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
            select: { id: true, taskList: true }
        });
        let recordId = null;
        let taskList = [];
        if (records.length > 0) {
            recordId = records[0].id;
            taskList = records[0].taskList || [];
        }
        res.json({ recordId, taskList });
    },

    updateRecord: async (req, res) => {
        try {
            const recordId = req.params.id;
            let taskList = req.body.taskList;
            if (typeof taskList === "string") {
                taskList = JSON.parse(taskList);
            }
            if (!Array.isArray(taskList)) {
                taskList = [];
            }

            console.log(taskList)
            const totalTaskValue = taskList
                .filter(task => task.checked)
                .reduce((sum, task) => sum + task.taskValue, 0);
            console.log(totalTaskValue)

            await prisma.records.update({
                where: { id: recordId },
                data: {
                    value: totalTaskValue,
                    taskList: taskList,
                    updatedAt: new Date(),
                },
            });
            res.status(200).json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
