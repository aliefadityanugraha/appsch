"use strcit";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  periode: async (req, res) => {
    const data = await prisma.periode.findMany();
    res.render("periode", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: "Periode",
      data,
    });
  },
  addPeriode: async (req, res) => {
    const data = await prisma.periode.create({
      data: {
        periode: req.body.periode,
        nilai: parseInt(req.body.nilai),
      },
    });
    console.log(data);
    res.redirect("/periode");
  },
  editPeriode: async (req, res) => {
    res.render("editPeriode", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: "Edit Periode",
    });
  },
  updatePeriode: async (req, res) => {
    res.render("updatePeriode", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: "Update Periode",
    });
  },
  deletePeriode: async (req, res) => {
    const data = await prisma.periode.delete({
      where: {
        id: req.params.id,
      },
    });

    res.redirect("/periode");
  },
};
