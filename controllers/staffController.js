"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  staff: async (req, res) => {
    const data = await prisma.staff.findMany({
      // where: {
      //   createdAt: {
      //     gte: new Date('2024-06-21'), // Start of date range
      //     lte: new Date('2024-06-31'), // End of date range
      //   },
      // },
      include: {
        task: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    res.render("staff", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: "Data Staff",
      data,
      req: req.path,
    });
  },
  addStaff: async (req, res) => {
    const data = await prisma.staff.create({
      data: {
        name: req.body.name,
        jabatan: req.body.jabatan,
        nip: req.body.nip,
      },
    });
    console.log(data);
    res.redirect("/staff");
  },
  updateStaff: async (req, res) => {
    const data = await prisma.staff.update({
      where: {
        id: req.params.id,
      },
      data: {
        name: req.body.name,
        jabatan: req.body.jabatan,
        nip: req.body.nip,
        updatedAt: new Date(),
      },
    });
    res.redirect("/staff");
  },
  deleteStaff: async (req, res) => {
    const data = await prisma.staff.delete({
      where: {
        id: req.params.id,
      },
    });
    console.log(data);

    res.redirect("/staff");
  },
};
