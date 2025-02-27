"use strict";

const { PrismaClient } = require("@prisma/client");
const { task } = require("./taskController");
const prisma = new PrismaClient();

module.exports = {
  data: async (req, res) => {
    const records = await prisma.records.findMany({
      where: {
        createdAt: {
          gte: new Date("2024-06-01"), // Start of date range
          lte: new Date("2025-07-31"), // End of date range
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

    const dataParseJson = Object.fromEntries(groupByStaff);

    console.log(dataParseJson);
    console.log(
      "--------------------------------------------------------------------------"
    );

    // New object to accumulate the data
    let newObj = {};

    // for (const staffId in dataParseJson) {
    //   newObj[staffId] = dataParseJson[staffId].map((record) => ({
    //     id: record.id,
    //     nilai: record.nilai,
    //     createdAt: record.createdAt,
    //     updatedAt: record.updatedAt,
    //     // detail: record.detail.map((item) => item.index),
    //   }));
    // }

    // console.log(JSON.stringify(newObj, null, 2));

    // Loop through the main object
    // Object.keys(parseJson).forEach((staffId) => {
    //   console.log(`Staff ID: ${staffId}`);

    //   // Loop through the array of records for each staffId
    //   parseJson[staffId].forEach((record) => {
    //     // Corrected this line
    //     const newObject = {
    //       id: record.id,
    //       nilai: record.nilai,
    //       createdAt: record.createdAt,
    //       updatedAt: record.updatedAt,
    //     };
    //     console.log(newObject);
    //     // Access other properties as needed
    //   });
    // });

    res.render("data", {
      layout: "layouts/main-layouts",
      title: "Data",
      data: records,
      dataParseJson,
      req: req.path,
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
    res.redirect("/staff");
  },
};
