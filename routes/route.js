const express = require("express");
const router = express.Router();

const mainController = require("../controllers/mainController");
const staffController = require("../controllers/staffController");
const tugasController = require("../controllers/tugasController");
const recordsController = require("../controllers/recordsController");
const periodeController = require("../controllers/periodeController");

router.get("/", mainController.main);

router.get("/staff", staffController.staff);
router.post("/addStaff", staffController.addStaff);
router.get("/deleteStaff/:id", staffController.deleteStaff);

router.get("/addTugas/:id", tugasController.tugas);
router.post("/addTugas", tugasController.addTugas);
router.get("/editTugas/:id", tugasController.editTugas);
router.post("/updateTugas", tugasController.updateTugas);
router.get("/deleteTugas/:id/:staffId", tugasController.deleteTugas);

router.get("/periode", periodeController.periode);
router.post("/addPeriode", periodeController.addPeriode);
router.get("/editPeriode/:id", periodeController.editPeriode);
router.post("/updatePeriode", periodeController.updatePeriode);
router.get("/deletePeriode/:id", periodeController.deletePeriode);

router.get("/data", recordsController.data);
router.post("/addRecordTugas/:id", recordsController.addData);

module.exports = router;
