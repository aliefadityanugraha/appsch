/** @format */



"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  main: async (req, res) => {
    res.render("main", {
        layout: "layouts/main-layouts",
        message: "ok",
        title: "Home",
  })
  },
  staff: async (req, res) => {
    const data = await prisma.staff.findMany({
      // where: {
      //   createdAt: {
      //     gte: new Date('2024-06-21'), // Start of date range
      //     lte: new Date('2024-06-31'), // End of date range
      //   },
      // },
      include: {
        tugas: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    // console.log(data[0].tugas);
    res.render("staff", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: "Data Staff",
      data,
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
    res.render("updateStaff", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: "Update Staff",
    });
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
  
  tugas: async (req, res) => {
    const staffId = req.params.id;
    const staff = await prisma.staff.findMany({
      where: {
        id: staffId
      }
    });
    const data = await prisma.tugas.findMany({
      where: {
        staffId: staffId
      }
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
    console.log(data)
    res.redirect("/addTugas/"+req.body.id);
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
    
    res.redirect("/addTugas/"+req.params.staffId); 
  },
  
  periode: async (req, res) => {
    const data = await prisma.periode.findMany();
    res.render("periode", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: "Periode",
      data,
    });
  },
  addPeriode: async (req, res) => {
    const data = await prisma.periode.create({
      data: {
        periode: req.body.periode,
        nilai: parseInt(req.body.nilai),
      },
    });
    console.log(data);
    res.redirect("/periode");
  },
  editPeriode: async (req, res) => {
    res.render("editPeriode", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: "Edit Periode",
    });
  },
  updatePeriode: async (req, res) => {
    res.render("updatePeriode", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: "Update Periode",
    });
  },
  deletePeriode: async (req, res) => {
    const data = await prisma.periode.delete({
      where: {
        id: req.params.id,
      },
    })
    
    res.redirect("/periode"); 
  },
  
  data: async (req, res) => {
    const data = await prisma.staff.findMany({
      where: {
        createdAt: {
          gte: new Date('2024-06-01'), // Start of date range
          lte: new Date('2024-06-31'), // End of date range
        },
      },
       include: {
        tugas: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    res.render("data", {
      layout: "layouts/main-layouts",
      message: "ok",
      title: "Data",
      data
    });
  },
  addData: async (req, res) => {
    console.log(req.params.id)
    
    // jumlahkan array yang tercentang
    let total = Object.values(req.body.value).reduce((val, nilaiSekarang) => {
        return parseInt(val) + parseInt(nilaiSekarang);
    },0)
    
    console.log(total)
    
    let persentase = (total / 100) * 4.5;
    console.log(persentase)
    // algoritma ada disini
    
    const data = await prisma.records.create({
      data: {
        detail: req.body,
        nilai: persentase,
        staffId: req.params.id,
      },
    });
    console.log(data)
    res.redirect("/data");
  }
};

