"use strcit";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  task: async (req, res) => {
    const staffId = req.params.id;
    const staff = await prisma.staff.findMany({
      where: {
        id: staffId,
      },
    });

    const data = await prisma.task.findMany({
      where: {
        staffId: staffId,
      },
    });
    const periodeData = await prisma.periode.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    const periode = await prisma.periode.findMany({
      where: {
        id: data[0].periodeId,
      },
    });

    res.render("task", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: staff[0].name,
      data,
      staff,
      id: req.params.id,
      periodeData: periodeData,
      periode: periode[0].periode,
      req: req.path,
    });
  },

  addTask: async (req, res) => {
    const data = await prisma.task.create({
      data: {
        deskripsi: req.body.deskripsi,
        nilai: parseInt(req.body.nilai),
        staffId: req.body.id,
        periodeId: req.body.periode,
      },
    });
    console.log(data);
    res.redirect("/addTask/" + req.body.id);
  },
  updateTask: async (req, res) => {
    const data = await prisma.task.update({
      where: {
        id: req.params.id,
      },
      data: {
        deskripsi: req.body.deskripsi,
        nilai: parseInt(req.body.nilai),
        updatedAt: new Date(),
      },
    });
    console.log(data);
    res.redirect("/addTask/" + req.body.id);
  },
  deleteTask: async (req, res) => {
    const data = await prisma.task.delete({
      where: {
        id: req.params.id,
      },
    });
    console.log(req.params.id + "task deleted");

    res.redirect("/addTask/" + req.params.staffId);
  },
};
