"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  data: async (req, res) => {
    const records = await prisma.records.findMany({
      where: {
        createdAt: {
          gte: new Date("2024-06-01"), // Start of date range
          lte: new Date("2024-07-31"), // End of date range
        },
      },
      include: {
        staff: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const groupByStaff = Map.groupBy(records, (record) => {
      return record.staffId;
    });

    const parseJson = Object.fromEntries(groupByStaff);

    console.log(parseJson);
    console.log(
      "--------------------------------------------------------------------------"
    );

    // Loop through the main object
    Object.keys(parseJson).forEach((staffId) => {
      console.log(`Staff ID: ${staffId}`);

      // Loop through the array of records for each staffId
      parseJson[staffId].forEach((record) => {
        // Corrected this line
        const newObject = {
          id: record.id,
          nilai: record.nilai,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };
        console.log(newObject);
        // Access other properties as needed
      });
    });

    res.render("data", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: "Data",
      data: records,
      parseJson,
    });
  },
  addData: async (req, res) => {
    console.log(req.params.id);

    // jumlahkan array yang tercentang
    let total = Object.values(req.body.value).reduce((val, nilaiSekarang) => {
      return parseInt(val) + parseInt(nilaiSekarang);
    }, 0);

    console.log(total);

    let persentase = (total / 100) * 4.5;
    console.log(persentase);
    // algoritma ada disini

    const data = await prisma.records.create({
      data: {
        detail: req.body,
        nilai: persentase,
        staffId: req.params.id,
      },
    });
    console.log(data);
    res.redirect("/data");
  },
};
