"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  periode: async (req, res) => {
    const data = await prisma.periode.findMany();
    res.render("periode", {
      layout: "layouts/main-layouts",
      title: "Periode",
      data,
      req: req.path,
    });
  },
  addPeriode: async (req, res) => {
    const { periode, nilai } = req.body;
    const data = await prisma.periode.create({
      data: {
        periode,
        nilai: parseInt(nilai),
      },
    });
    console.log(data);
    res.redirect("/periode");
  },
  updatePeriode: async (req, res) => {
    const { periode, nilai } = req.body;
    const data = await prisma.periode.update({
      where: {
        id: req.params.id,
      },
      data: {
        periode,
        nilai: parseInt(nilai),
        updatedAt: new Date(),
      },
    });
    console.log(`${data.id} periode updated`);
    res.redirect("/periode");
  },
  deletePeriode: async (req, res) => {
    await prisma.periode.delete({
      where: {
        id: req.params.id,
      },
    });
    res.redirect("/periode");
  },
};
