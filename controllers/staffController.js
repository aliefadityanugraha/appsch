"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  staff: async (req, res) => {
    const data = await prisma.staff.findMany({
      include: {
        task: {
          include: {
            periode: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    const listPeriode = await prisma.periode.findMany({});
    res.status(200).render("staff", {
      layout: "layouts/main-layouts",
      title: "Data Staff",
      data,
      listPeriode,
      req: req.path,
    });
  },

  addStaff: async (req, res) => {
    const { name, jabatan, nip, tunjangan } = req.body;

    await prisma.staff.create({
      data: { name, jabatan, nip, tunjangan },
    });
    res.status(200).redirect("/staff");
  },

  updateStaff: async (req, res) => {
    const { id } = req.params;
    const { name, jabatan, nip, tunjangan } = req.body;

    await prisma.staff.update({
      where: { id },
      data: { name, jabatan, nip, tunjangan, updatedAt: new Date() },
    });
    res.status(200).redirect("/staff");
  },

  deleteStaff: async (req, res) => {
    const { id } = req.params;

    await prisma.staff.delete({
      where: { id },
    });
    res.status(200).redirect("/staff");
  },
};
