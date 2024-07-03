"use strcit";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  tugas: async (req, res) => {
    const staffId = req.params.id;
    const staff = await prisma.staff.findMany({
      where: {
        id: staffId,
      },
    });
    const data = await prisma.tugas.findMany({
      where: {
        staffId: staffId,
      },
    });
    console.log(staff);

    res.render("tugas", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: staff[0].name,
      data,
      staff,
      id: req.params.id,
    });
  },

  addTugas: async (req, res) => {
    const data = await prisma.tugas.create({
      data: {
        deskripsi: req.body.deskripsi,
        nilai: parseInt(req.body.nilai),
        staffId: req.body.id,
      },
    });
    console.log(data);
    res.redirect("/addTugas/" + req.body.id);
  },
  editTugas: async (req, res) => {
    res.render("editTugas", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: "Edit Tugas",
    });
  },
  updateTugas: async (req, res) => {
    res.render("updateTugas", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: "Update Tugas",
    });
  },
  deleteTugas: async (req, res) => {
    const data = await prisma.tugas.delete({
      where: {
        id: req.params.id,
      },
    });
    console.log(req.params.id);

    res.redirect("/addTugas/" + req.params.staffId);
  },
};
