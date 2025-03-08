"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  main: async (req, res) => {
    res.status(200).render("main", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: "Home",
      req: req.path,
    });
  },
};
