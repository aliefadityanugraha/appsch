"use strict";

const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {

    task: async (req, res) => {

        const staffId = req.params.id;

        const staff = await prisma.staff.findMany({
            where: {
                id: staffId,
            },
        });

        const tasks = await prisma.task.findMany({
            where: {
                staffId: staffId,
            },
            include: {
                periode: true,
            },
        });

        const periodeData = await prisma.periode.findMany({
            orderBy: {
                createdAt: "asc",
            },
        });

        res.status(200).render("task", {
            layout: "layouts/main-layouts",
            title: staff[0].name,
            data: tasks,
            staff,
            id: req.params.id,
            periodeData,
            req: req.path,
        });

    },

    addTask: async (req, res) => {

        const {deskripsi, nilai, id, periode} = req.body;

        await prisma.task.create({
            data: {
                deskripsi,
                nilai: parseInt(nilai),
                staffId: id,
                periodeId: periode,
            },
        });
        res.status(200).redirect(`/addTask/${id}`);

    },

    updateTask: async (req, res) => {

        const {deskripsi, periode, nilai} = req.body;
        const taskId = req.params.id;

        await prisma.task.update({
            where: {
                id: taskId,
            },
            data: {
                deskripsi,
                nilai: parseInt(nilai),
                periodeId: periode,
                updatedAt: new Date(),
            },
        });
        res.status(200).redirect(`/addTask/${req.body.id}`);

    },

    deleteTask: async (req, res) => {

        const taskId = req.params.id;
        const staffId = req.params.staffId;

        await prisma.task.delete({
            where: {
                id: taskId,
            },
        });
        res.status(200).redirect(`/addTask/${staffId}`);

    },
};
