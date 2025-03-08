"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  apiTest: async (req, res) => {
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
    res.json(data);
  },
  addRecords: (req, res) => {
    res.json(req.body);
  },
  records: async (req, res) => {
    const data = await prisma.records.findMany({
      include: {
        staff: true,
      },
    });

    res.json(data);
  },
};
