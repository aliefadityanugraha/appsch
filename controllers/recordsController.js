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
                staff: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        res.status(200).render("data2", {
            layout: "layouts/main-layouts",
            title: "Data",
            req: req.path,
            records: records,
        });

    },

    addRecords: async (req, res) => {

        let data = req.body["task"];

        if (typeof data === "string") {
            data = [data];
        }

        const taskList = Array.isArray(data)
            ? data.map((item) => {
                const [taskId, taskValue, taskDescription] = item.split(",");
                return {taskId, taskValue: parseInt(taskValue), taskDescription};
            })
            : [];

        const totalTaskValue = taskList.reduce(
            (sum, task) => sum + task.taskValue,
            0
        );

        await prisma.records.create({
            data: {
                staffId: req.params.id,
                value: totalTaskValue,
                taskList: taskList,
            },
        });
        res.status(200).redirect("/staff");

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
                staff: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        res.status(200).render("data", {
            layout: "layouts/main-layouts",
            title: "Data Filtered",
            req: req.path,
            records: records,
        });

    }
};
