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
      req: req.path,
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
  updatePeriode: async (req, res) => {
    const data = await prisma.periode.update({
      where: {
        id: req.params.id,
      },
      data: {
        periode: req.body.periode,
        nilai: parseInt(req.body.nilai),
        updatedAt: new Date(),
      },
    });
    console.log(data[0] + "periode updated");
    res.redirect("/periode");
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
