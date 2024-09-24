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
      title: "Data Staff",
      data,
      req: req.path,
    });
  },
  addStaff: async (req, res) => {
    const { name, jabatan, nip } = req.body;
    const data = await prisma.staff.create({
      data: { name, jabatan, nip },
    });
    console.log(data);
    res.redirect("/staff");
  },
  updateStaff: async (req, res) => {
    const { id } = req.params;
    const { name, jabatan, nip } = req.body;
    const data = await prisma.staff.update({
      where: { id },
      data: { name, jabatan, nip, updatedAt: new Date() },
    });
    res.redirect("/staff");
  },
  deleteStaff: async (req, res) => {
    const { id } = req.params;
    const data = await prisma.staff.delete({
      where: { id },
    });
    console.log(data);
    res.redirect("/staff");
  },
};
