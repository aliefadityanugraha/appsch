"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  data: async (req, res) => {
    const records = await prisma.records.findMany({
      where: {
        createdAt: {
          gte: new Date("2024-06-01"), // Start of date range
          lte: new Date("2025-03-31"), // End of date range
        },
      },
      include: {
        staff: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.render("data", {
      layout: "layouts/main-layouts",
      title: "Data",
      req: req.path,
      records,
    });
  },

  addData: async (req, res) => {
    let data = req.body["task"];

    console.debug(typeof data);

    if (typeof data === "string") {
      data = [data];
    }

    const taskList = Array.isArray(data)
      ? data.map((item) => {
          const [taskId, taskValue, taskDescription] = item.split(",");
          return { taskId, taskValue: parseInt(taskValue), taskDescription };
        })
      : [];

    const totalTaskValue = taskList.reduce(
      (sum, task) => sum + task.taskValue,
      0
    );

    await prisma.records.create({
      data: {
        staffId: req.params.id,
        value: totalTaskValue,
        taskList,
      },
    });
    res.redirect("/staff");
  },
};
