"use strict";

const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {

    periode: async (req, res) => {

        const data = await prisma.periode.findMany();

        res.status(200).render("periode", {
            layout: "layouts/main-layouts",
            title: "Periode",
            data: data,
            req: req.path,
        });

    },

    addPeriode: async (req, res) => {

        const {periode, nilai} = req.body;

        await prisma.periode.create({
            data: {
                periode: periode,
                nilai: parseInt(nilai),
            },
        });
        res.status(200).redirect("/periode");

    },

    updatePeriode: async (req, res) => {

        const {periode, nilai} = req.body;

        await prisma.periode.update({
            where: {
                id: req.params.id,
            },
            data: {
                periode: periode,
                nilai: parseInt(nilai),
                updatedAt: new Date(),
            },
        });
        res.status(200).redirect("/periode");

    },

    deletePeriode: async (req, res) => {

        await prisma.periode.delete({
            where: {
                id: req.params.id,
            },
        });
        res.status(200).redirect("/periode");

    },
};
